'use client'

import { useAuth } from '@/contexts/auth'
import { getAdminPosts, updatePost } from '@/http/post'
import { TiptapEditor } from '@/components/blog/tiptap-editor'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Post } from '@/types/post'

const EditPostPage = () => {
  const { user, getToken } = useAuth()
  const token = getToken()
  const router = useRouter()
  const params = useParams()
  const postId = parseInt(params.id as string)

  const [post, setPost] = useState<Post | null>(null)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!token) return

    const fetchPost = async () => {
      try {
        setFetching(true)
        const response = await getAdminPosts(token, 1, 100)
        const foundPost = response.data.find((p) => p.id === postId)
        if (foundPost) {
          setPost(foundPost)
          setTitle(foundPost.title)
          setSlug(foundPost.slug)
          setContent(foundPost.content)
          setExcerpt(foundPost.excerpt || '')
          setCoverImage(foundPost.coverImage || '')
        }
      } catch (error) {
        console.error('Failed to fetch post:', error)
      } finally {
        setFetching(false)
      }
    }

    fetchPost()
  }, [token, postId])

  if (!user) {
    return <div className="p-8">Chargement...</div>
  }

  if (user.role !== 'admin') {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-500">Accès refusé</h1>
        <p>Vous devez être administrateur pour accéder à cette page.</p>
      </div>
    )
  }

  if (fetching) {
    return <div className="p-8">Chargement de l'article...</div>
  }

  if (!post) {
    return <div className="p-8">Article introuvable</div>
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    try {
      setLoading(true)
      await updatePost(
        postId,
        {
          title,
          slug,
          content,
          excerpt: excerpt || undefined,
          coverImage: coverImage || undefined,
        },
        token
      )
      router.push('/admin/posts')
    } catch (error) {
      console.error('Failed to update post:', error)
      alert('Échec de la mise à jour de l\'article')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-5xl">
      <div className="mb-6">
        <Link
          href="/admin/posts"
          className="text-blue-500 hover:text-blue-600 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la liste
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6">Éditer l'Article</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            Titre *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
            placeholder="Titre de l'article"
          />
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium mb-2">
            Slug
          </label>
          <input
            type="text"
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
            placeholder="mon-article-super-cool"
          />
        </div>

        <div>
          <label htmlFor="excerpt" className="block text-sm font-medium mb-2">
            Résumé (optionnel)
          </label>
          <textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
            placeholder="Court résumé de l'article..."
          />
        </div>

        <div>
          <label htmlFor="coverImage" className="block text-sm font-medium mb-2">
            Image de couverture (URL, optionnel)
          </label>
          <input
            type="text"
            id="coverImage"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Contenu *</label>
          <TiptapEditor content={content} onChange={setContent} />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || !title || !content}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-md"
          >
            {loading ? 'Mise à jour...' : 'Mettre à jour'}
          </button>
          <Link
            href="/admin/posts"
            className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 px-6 py-2 rounded-md"
          >
            Annuler
          </Link>
        </div>
      </form>
    </div>
  )
}

export default EditPostPage
