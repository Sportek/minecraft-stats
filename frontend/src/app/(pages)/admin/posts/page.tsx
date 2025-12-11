'use client'

import { useAuth } from '@/contexts/auth'
import { getAdminPosts, deletePost, publishPost, unpublishPost } from '@/http/post'
import { Post } from '@/types/post'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2, Eye } from 'lucide-react'

const AdminPostsPage = () => {
  const { user, getToken } = useAuth()
  const token = getToken()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')

  useEffect(() => {
    if (!token) return

    const fetchPosts = async () => {
      try {
        setLoading(true)
        const response = await getAdminPosts(token, 1, 50, filter)
        setPosts(response.data)
      } catch (error) {
        console.error('Failed to fetch posts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [token, filter])

  if (!user) {
    return (
      <div className="min-h-screen bg-stats-blue-0 dark:bg-stats-blue-1050 flex items-center justify-center">
        <div className="text-lg text-gray-900 dark:text-white">Loading...</div>
      </div>
    )
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-stats-blue-0 dark:bg-stats-blue-1050 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h1>
          <p className="text-gray-600 dark:text-slate-400">
            You must be an administrator to access this page.
          </p>
        </div>
      </div>
    )
  }

  const handleDelete = async (postId: number) => {
    if (!token) return
    if (!confirm('Are you sure you want to delete this article?')) return

    try {
      await deletePost(postId, token)
      setPosts(posts.filter((p) => p.id !== postId))
    } catch (error) {
      console.error('Failed to delete post:', error)
      alert('Failed to delete article')
    }
  }

  const handlePublish = async (postId: number) => {
    if (!token) return

    try {
      const updatedPost = await publishPost(postId, token)
      setPosts(posts.map((p) => (p.id === postId ? updatedPost : p)))
    } catch (error) {
      console.error('Failed to publish post:', error)
      alert('Failed to publish article')
    }
  }

  const handleUnpublish = async (postId: number) => {
    if (!token) return

    try {
      const updatedPost = await unpublishPost(postId, token)
      setPosts(posts.map((p) => (p.id === postId ? updatedPost : p)))
    } catch (error) {
      console.error('Failed to unpublish post:', error)
      alert('Failed to unpublish article')
    }
  }

  const publishedCount = posts.filter((p) => p.published).length
  const draftCount = posts.filter((p) => !p.published).length

  return (
    <div className="min-h-screen bg-stats-blue-0 dark:bg-stats-blue-1050">
      <div className="container mx-auto px-4 py-8 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Manage Articles
            </h1>
            <p className="text-gray-600 dark:text-slate-400">
              Create, edit and manage your blog posts.
            </p>
          </div>

          <Link
            href="/admin/posts/new"
            className="flex items-center gap-2 bg-stats-blue-600 hover:bg-stats-blue-500 text-white px-4 py-2 rounded-md font-medium transition-all shadow-lg shadow-stats-blue-900/20"
          >
            <Plus className="w-5 h-5" />
            <span>New Article</span>
          </Link>
        </div>

        {/* Tabs / Filters */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-stats-blue-600 text-white'
                : 'bg-gray-200 dark:bg-stats-blue-900 text-gray-700 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-stats-blue-700/50'
            }`}
          >
            All ({posts.length})
          </button>
          <button
            onClick={() => setFilter('published')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === 'published'
                ? 'bg-stats-blue-600 text-white'
                : 'bg-gray-200 dark:bg-stats-blue-900 text-gray-700 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-stats-blue-700/50'
            }`}
          >
            Published
          </button>
          <button
            onClick={() => setFilter('draft')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === 'draft'
                ? 'bg-stats-blue-600 text-white'
                : 'bg-gray-200 dark:bg-stats-blue-900 text-gray-700 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-stats-blue-700/50'
            }`}
          >
            Drafts
          </button>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-stats-blue-1000 border border-gray-300 dark:border-stats-blue-800 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-stats-blue-950 border-b border-gray-300 dark:border-stats-blue-800 text-xs uppercase tracking-wider text-gray-600 dark:text-slate-400 font-semibold">
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-stats-blue-800">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-slate-500">
                      Loading articles...
                    </td>
                  </tr>
                ) : posts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-slate-500">
                      No articles found. Click &quot;New Article&quot; to create one.
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr
                      key={post.id}
                      className="hover:bg-gray-50 dark:hover:bg-stats-blue-900 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-gray-900 dark:text-white font-medium group-hover:text-stats-blue-600 dark:group-hover:text-stats-blue-400 transition-colors">
                            {post.title}
                          </span>
                          <span className="text-gray-500 dark:text-slate-500 text-xs font-mono mt-0.5">
                            {post.slug}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            post.published
                              ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
                              : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20'
                          }`}
                        >
                          {post.published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-slate-400 text-sm">
                        {new Date(post.createdAt).toISOString().split('T')[0]}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              post.published ? handleUnpublish(post.id) : handlePublish(post.id)
                            }
                            className="p-1.5 text-gray-500 dark:text-slate-400 hover:text-stats-blue-600 dark:hover:text-stats-blue-400 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-stats-blue-500/10"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <Link
                            href={`/admin/posts/${post.id}/edit`}
                            className="p-1.5 text-gray-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-green-500/10"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="p-1.5 text-gray-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-red-500/10"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPostsPage
