'use client'

import { useAuth } from '@/contexts/auth'
import { createPost } from '@/http/post'
import { TiptapEditor } from '@/components/blog/tiptap-editor'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, X } from 'lucide-react'

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
    return (
      <div className="min-h-screen bg-stats-blue-0 dark:bg-stats-blue-1050 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-stats-blue-0 dark:bg-stats-blue-1050 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400">
            You must be an administrator to access this page.
          </p>
        </div>
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
      alert('Failed to create article')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stats-blue-0 dark:bg-stats-blue-1050">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/posts"
            className="inline-flex items-center gap-2 text-stats-blue-600 hover:text-stats-blue-700 dark:text-stats-blue-400 dark:hover:text-stats-blue-300 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Articles
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">Create New Article</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Fill in the details to create a new blog article
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Article Details Card */}
          <div className="bg-white dark:bg-stats-blue-950 rounded-lg border border-gray-200 dark:border-stats-blue-800 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Article Details
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-white dark:bg-stats-blue-900 border border-gray-300 dark:border-stats-blue-700 rounded-lg focus:ring-2 focus:ring-stats-blue-600 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                  placeholder="Enter article title"
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Slug <span className="text-gray-400 text-xs">(optional, auto-generated if empty)</span>
                </label>
                <input
                  type="text"
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-stats-blue-900 border border-gray-300 dark:border-stats-blue-700 rounded-lg focus:ring-2 focus:ring-stats-blue-600 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                  placeholder="my-awesome-article"
                />
              </div>

              <div>
                <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Summary <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <textarea
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white dark:bg-stats-blue-900 border border-gray-300 dark:border-stats-blue-700 rounded-lg focus:ring-2 focus:ring-stats-blue-600 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors resize-none"
                  placeholder="Brief summary of the article for previews..."
                />
              </div>

              <div>
                <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cover Image URL <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <input
                  type="url"
                  id="coverImage"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-stats-blue-900 border border-gray-300 dark:border-stats-blue-700 rounded-lg focus:ring-2 focus:ring-stats-blue-600 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                  placeholder="https://example.com/image.jpg"
                />
                {coverImage && (
                  <div className="mt-3">
                    <img
                      src={coverImage}
                      alt="Cover preview"
                      className="w-full max-w-md h-48 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content Editor Card */}
          <div className="bg-white dark:bg-stats-blue-950 rounded-lg border border-gray-200 dark:border-stats-blue-800 p-6 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Content <span className="text-red-500">*</span>
            </label>
            <TiptapEditor content={content} onChange={setContent} />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between bg-white dark:bg-stats-blue-950 rounded-lg border border-gray-200 dark:border-stats-blue-800 p-4 shadow-sm">
            <Link
              href="/admin/posts"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-stats-blue-900 dark:hover:bg-stats-blue-800 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !title || !content}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-stats-blue-600 hover:bg-stats-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg shadow-lg transition-all hover:shadow-xl disabled:shadow-none"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Creating...' : 'Create Article'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewPostPage
