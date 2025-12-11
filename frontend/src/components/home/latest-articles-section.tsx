'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getPosts } from '@/http/post'
import { Post } from '@/types/post'
import { Calendar, FileText, ArrowRight } from 'lucide-react'

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
      <section className="w-full bg-white dark:bg-stats-blue-1000 border border-gray-200 dark:border-stats-blue-800 rounded-xl p-6 relative overflow-hidden">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-stats-blue-900 rounded w-48 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-stats-blue-900 rounded"></div>
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
    <section className="w-full bg-white dark:bg-stats-blue-1000 border border-gray-200 dark:border-stats-blue-800 rounded-xl p-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-stats-blue-600 dark:text-stats-blue-500" />
            Latest Blog Posts
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">Recent articles and updates</p>
        </div>
        <Link
          href="/blog"
          className="text-stats-blue-600 dark:text-stats-blue-400 hover:text-stats-blue-500 dark:hover:text-stats-blue-300 text-sm font-bold flex items-center gap-1 transition-colors"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-4 relative z-10">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group block p-4 bg-gray-50 dark:bg-stats-blue-950 border border-gray-200 dark:border-stats-blue-800 rounded-lg hover:border-stats-blue-600 dark:hover:border-stats-blue-500 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 line-clamp-2 group-hover:text-stats-blue-600 dark:group-hover:text-stats-blue-400 transition-colors">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="text-xs text-gray-600 dark:text-slate-400 line-clamp-1 mb-2">
                    {post.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-slate-500">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-stats-blue-900 flex items-center justify-center text-[8px] font-bold text-gray-600 dark:text-white">
                      {post.author.username.charAt(0)}
                    </div>
                    <span>{post.author.username}</span>
                  </div>
                  <span>•</span>
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
              {post.coverImage && (
                <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default LatestArticlesSection
