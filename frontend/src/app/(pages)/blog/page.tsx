import { getPosts } from '@/http/post'
import Link from 'next/link'
import { Metadata } from 'next'
import { Calendar, User, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Blog - Minecraft Stats',
  description: 'Discover the latest articles and news about Minecraft Stats',
}

export default async function BlogPage() {
  const posts = await getPosts(1, 20)
  const featuredPost = posts.data[0] // First post as featured

  return (
    <div className="min-h-screen bg-stats-blue-0 dark:bg-stats-blue-1050">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Blog
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Discover the latest articles, updates, and news about Minecraft Stats
          </p>
        </div>

        {posts.data.length === 0 ? (
          <div className="bg-white dark:bg-stats-blue-950 rounded-lg border border-gray-200 dark:border-stats-blue-800 p-16 text-center">
            <div className="max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                No Articles Yet
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Check back soon to discover our latest articles and updates!
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Featured Article */}
            {featuredPost && (
              <Link
                href={`/blog/${featuredPost.slug}`}
                className="block mb-12 group"
              >
                <div className="bg-white dark:bg-stats-blue-950 rounded-lg border border-gray-200 dark:border-stats-blue-800 overflow-hidden shadow-lg hover:shadow-xl transition-all">
                  <div className="grid md:grid-cols-2 gap-0">
                    {featuredPost.coverImage && (
                      <div className="aspect-video md:aspect-auto overflow-hidden">
                        <img
                          src={featuredPost.coverImage}
                          alt={featuredPost.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-8 flex flex-col justify-center">
                      <div className="inline-flex items-center gap-2 text-stats-blue-600 dark:text-stats-blue-400 text-sm font-medium mb-4">
                        <span className="px-3 py-1 bg-stats-blue-100 dark:bg-stats-blue-900 rounded-full">
                          Featured
                        </span>
                      </div>
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-stats-blue-600 dark:group-hover:text-stats-blue-400 transition-colors">
                        {featuredPost.title}
                      </h2>
                      {featuredPost.excerpt && (
                        <p className="text-gray-600 dark:text-gray-400 mb-6 line-clamp-3">
                          {featuredPost.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{featuredPost.author.username}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(featuredPost.publishedAt!).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="mt-6 inline-flex items-center gap-2 text-stats-blue-600 dark:text-stats-blue-400 font-medium group-hover:gap-3 transition-all">
                        Read More
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Article Grid */}
            {posts.data.length > 1 && (
              <>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Latest Articles
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.data.slice(1).map((post) => (
                    <Link
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      className="group bg-white dark:bg-stats-blue-950 rounded-lg border border-gray-200 dark:border-stats-blue-800 overflow-hidden shadow-sm hover:shadow-lg transition-all"
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
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-stats-blue-600 dark:group-hover:text-stats-blue-400 transition-colors">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 text-sm">
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
              </>
            )}

            {/* Pagination */}
            {posts.meta.lastPage > 1 && (
              <div className="mt-12 flex justify-center gap-2">
                {Array.from({ length: posts.meta.lastPage }, (_, i) => i + 1).map((page) => (
                  <Link
                    key={page}
                    href={`/blog?page=${page}`}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      page === posts.meta.currentPage
                        ? 'bg-stats-blue-600 text-white shadow-lg'
                        : 'bg-white dark:bg-stats-blue-950 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-stats-blue-800 hover:border-stats-blue-600 dark:hover:border-stats-blue-400'
                    }`}
                  >
                    {page}
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
