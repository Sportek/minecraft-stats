'use client'

import { useAuth } from '@/contexts/auth'
import { getAdminPosts, deletePost, publishPost, unpublishPost } from '@/http/post'
import { Post } from '@/types/post'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Pencil, Trash2, Eye, EyeOff, Plus, FileText, Calendar, TrendingUp } from 'lucide-react'

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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Blog Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Create, edit, and manage your blog articles
            </p>
          </div>
          <Link
            href="/admin/posts/new"
            className="bg-stats-blue-600 hover:bg-stats-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 shadow-lg transition-all hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            New Article
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-stats-blue-950 rounded-lg border border-gray-200 dark:border-stats-blue-800 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Articles</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{posts.length}</p>
              </div>
              <div className="bg-stats-blue-100 dark:bg-stats-blue-900 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-stats-blue-600 dark:text-stats-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-stats-blue-950 rounded-lg border border-gray-200 dark:border-stats-blue-800 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Published</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{publishedCount}</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                <Eye className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-stats-blue-950 rounded-lg border border-gray-200 dark:border-stats-blue-800 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Drafts</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{draftCount}</p>
              </div>
              <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white dark:bg-stats-blue-950 rounded-lg border border-gray-200 dark:border-stats-blue-800 p-2 mb-6 inline-flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-stats-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-stats-blue-900'
            }`}
          >
            All ({posts.length})
          </button>
          <button
            onClick={() => setFilter('published')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'published'
                ? 'bg-stats-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-stats-blue-900'
            }`}
          >
            Published ({publishedCount})
          </button>
          <button
            onClick={() => setFilter('draft')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'draft'
                ? 'bg-stats-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-stats-blue-900'
            }`}
          >
            Drafts ({draftCount})
          </button>
        </div>

        {/* Articles Table */}
        {loading ? (
          <div className="bg-white dark:bg-stats-blue-950 rounded-lg border border-gray-200 dark:border-stats-blue-800 p-12 text-center">
            <div className="text-gray-600 dark:text-gray-400">Loading articles...</div>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white dark:bg-stats-blue-950 rounded-lg border border-gray-200 dark:border-stats-blue-800 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No articles found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Get started by creating your first article
            </p>
            <Link
              href="/admin/posts/new"
              className="inline-flex items-center gap-2 bg-stats-blue-600 hover:bg-stats-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Article
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-stats-blue-950 rounded-lg border border-gray-200 dark:border-stats-blue-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-stats-blue-800">
                <thead className="bg-gray-50 dark:bg-stats-blue-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Article
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-stats-blue-950 divide-y divide-gray-200 dark:divide-stats-blue-800">
                  {posts.map((post) => (
                    <tr
                      key={post.id}
                      className="hover:bg-gray-50 dark:hover:bg-stats-blue-900 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          {post.coverImage && (
                            <img
                              src={post.coverImage}
                              alt={post.title}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {post.title}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              /{post.slug}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            post.published
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                          }`}
                        >
                          {post.published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(post.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/posts/${post.id}/edit`}
                            className="text-stats-blue-600 hover:text-stats-blue-700 dark:text-stats-blue-400 dark:hover:text-stats-blue-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-stats-blue-900 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() =>
                              post.published ? handleUnpublish(post.id) : handlePublish(post.id)
                            }
                            className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-stats-blue-900 transition-colors"
                            title={post.published ? 'Unpublish' : 'Publish'}
                          >
                            {post.published ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-stats-blue-900 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPostsPage
