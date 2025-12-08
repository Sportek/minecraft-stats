'use client'

import { useAuth } from '@/contexts/auth'
import { getAdminPosts, deletePost, publishPost, unpublishPost } from '@/http/post'
import { Post } from '@/types/post'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Pencil, Trash2, Eye, EyeOff, Plus } from 'lucide-react'

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
    return <div className="p-8">Loading...</div>
  }

  if (user.role !== 'admin') {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-500">Access Denied</h1>
        <p>You must be an administrator to access this page.</p>
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

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Articles</h1>
        <Link
          href="/admin/posts/new"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Article
        </Link>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md ${
            filter === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          All ({posts.length})
        </button>
        <button
          onClick={() => setFilter('published')}
          className={`px-4 py-2 rounded-md ${
            filter === 'published'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Published
        </button>
        <button
          onClick={() => setFilter('draft')}
          className={`px-4 py-2 rounded-md ${
            filter === 'draft'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Drafts
        </button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No articles found. Create your first article!
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Created Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {posts.map((post) => (
                <tr key={post.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {post.title}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{post.slug}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        post.published
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {post.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/posts/${post.id}/edit`}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() =>
                          post.published ? handleUnpublish(post.id) : handlePublish(post.id)
                        }
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
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
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
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
      )}
    </div>
  )
}

export default AdminPostsPage
