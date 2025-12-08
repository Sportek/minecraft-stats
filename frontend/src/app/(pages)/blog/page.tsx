import { getPosts } from '@/http/post'
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog - Minecraft Stats',
  description: 'Découvrez les derniers articles et actualités sur Minecraft Stats',
}

export default async function BlogPage() {
  const posts = await getPosts(1, 20)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Blog</h1>

      {posts.data.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-xl">Aucun article pour le moment.</p>
          <p className="mt-2">Revenez bientôt pour découvrir nos articles !</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.data.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {post.coverImage && (
                <div className="aspect-video w-full overflow-hidden">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
              )}
              <div className="p-6">
                <h2 className="text-xl font-bold mb-2 line-clamp-2">{post.title}</h2>
                {post.excerpt && (
                  <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>Par {post.author.username}</span>
                  <span>{new Date(post.publishedAt!).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {posts.meta.lastPage > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: posts.meta.lastPage }, (_, i) => i + 1).map((page) => (
            <Link
              key={page}
              href={`/blog?page=${page}`}
              className={`px-4 py-2 rounded-md ${
                page === posts.meta.currentPage
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {page}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
