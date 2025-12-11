'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getPosts } from '@/http/post'
import { Post } from '@/types/post'

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
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Articles</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-stats-blue-1000 border border-gray-200 dark:border-slate-800 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (posts.length === 0) {
    return null
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Articles</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group relative bg-white dark:bg-stats-blue-1000 border border-gray-200 dark:border-slate-800 hover:border-stats-blue-500 dark:hover:border-blue-500/50 rounded-xl p-3 cursor-pointer transition-all hover:shadow-lg hover:shadow-stats-blue-900/10 dark:hover:shadow-blue-900/10 flex items-center gap-4 overflow-hidden"
          >
            <div className="w-20 h-16 rounded-lg bg-gray-100 dark:bg-slate-800 overflow-hidden shrink-0 relative border border-gray-200 dark:border-slate-700/50">
              <img
                src={post.coverImage || 'https://picsum.photos/seed/default/800/400'}
                alt=""
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-stats-blue-600 dark:text-blue-400 uppercase tracking-wide">
                  News
                </span>
                <span className="text-[10px] text-gray-500 dark:text-slate-500">
                  • {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-stats-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
                {post.title}
              </h4>
              <p className="text-xs text-gray-600 dark:text-slate-400 mt-1 line-clamp-1 opacity-80">
                {post.excerpt}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default LatestArticlesSection
