'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getPosts } from '@/http/post'
import { Post } from '@/types/post'
import { Calendar, User, ArrowRight, FileText } from 'lucide-react'

const LatestArticlesSection = () => {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await getPosts(1, 3)
        setPosts(response.data)
      } catch (error) {
        console.error('Failed to fetch posts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  if (loading) {
    return (
      <section className="w-full bg-white dark:bg-stats-blue-950 rounded-lg border border-gray-200 dark:border-stats-blue-800 p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-stats-blue-900 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-40 bg-gray-200 dark:bg-stats-blue-900 rounded"></div>
                <div className="h-6 bg-gray-200 dark:bg-stats-blue-900 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-stats-blue-900 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (posts.length === 0) {
    return null
  }

  return (
    <section className="w-full bg-white dark:bg-stats-blue-950 rounded-lg border border-gray-200 dark:border-stats-blue-800 p-8 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-stats-blue-100 dark:bg-stats-blue-900 p-2 rounded-lg">
            <FileText className="w-6 h-6 text-stats-blue-600 dark:text-stats-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Latest Articles</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Stay updated with our latest news and insights
            </p>
          </div>
        </div>
        <Link
          href="/blog"
          className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-stats-blue-100 hover:bg-stats-blue-200 dark:bg-stats-blue-900 dark:hover:bg-stats-blue-800 text-stats-blue-700 dark:text-stats-blue-300 rounded-lg transition-colors"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group bg-gray-50 dark:bg-stats-blue-900 rounded-lg border border-gray-200 dark:border-stats-blue-800 overflow-hidden hover:shadow-lg transition-all"
          >
            {post.coverImage && (
              <div className="aspect-video w-full overflow-hidden">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            <div className="p-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-stats-blue-600 dark:group-hover:text-stats-blue-400 transition-colors">
                {post.title}
              </h3>
              {post.excerpt && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {post.excerpt}
                </p>
              )}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>{post.author.username}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {new Date(post.publishedAt!).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Mobile View All Button */}
      <Link
        href="/blog"
        className="sm:hidden flex items-center justify-center gap-2 mt-6 px-4 py-2 bg-stats-blue-100 hover:bg-stats-blue-200 dark:bg-stats-blue-900 dark:hover:bg-stats-blue-800 text-stats-blue-700 dark:text-stats-blue-300 rounded-lg transition-colors"
      >
        View All Articles
        <ArrowRight className="w-4 h-4" />
      </Link>
    </section>
  )
}

export default LatestArticlesSection
