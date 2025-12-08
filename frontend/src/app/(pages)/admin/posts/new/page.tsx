'use client'

import { useAuth } from '@/contexts/auth'
import { createPost } from '@/http/post'
import { TiptapEditor } from '@/components/blog/tiptap-editor'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const NewPostPage = () => {
  const { user, getToken } = useAuth()
  const token = getToken()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [loading, setLoading] = useState(false)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    try {
      setLoading(true)
      await createPost(
        {
          title,
          slug: slug || undefined,
          content,
          excerpt: excerpt || undefined,
          coverImage: coverImage || undefined,
        },
        token
      )
      router.push('/admin/posts')
    } catch (error) {
      console.error('Failed to create post:', error)
      alert('Échec de la création de l\'article')
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

      <h1 className="text-3xl font-bold mb-6">Nouvel Article</h1>

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
            Slug (optionnel, généré automatiquement si vide)
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
            {loading ? 'Création...' : 'Créer l\'article'}
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

export default NewPostPage
