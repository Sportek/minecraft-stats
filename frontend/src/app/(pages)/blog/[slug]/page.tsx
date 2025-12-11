import { getPostBySlug } from '@/http/post'
import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  try {
    const post = await getPostBySlug(slug)

    return {
      title: `${post.title} - Minecraft Stats Blog`,
      description: post.excerpt || post.title,
      openGraph: {
        title: post.title,
        description: post.excerpt || post.title,
        type: 'article',
        publishedTime: post.publishedAt?.toString(),
        authors: [post.author.username],
        images: post.coverImage ? [post.coverImage] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: post.excerpt || post.title,
        images: post.coverImage ? [post.coverImage] : [],
      },
    }
  } catch (error) {
    return {
      title: 'Article not found - Minecraft Stats',
      description: 'The requested article does not exist',
    }
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params

  try {
    const post = await getPostBySlug(slug)

    return (
      <div className="min-h-screen bg-stats-blue-0 dark:bg-stats-blue-1050">
        <article className="container mx-auto px-4 py-12 max-w-4xl">
          {/* Back Button */}
          <div className="mb-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-stats-blue-600 hover:text-stats-blue-700 dark:text-stats-blue-400 dark:hover:text-stats-blue-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Link>
          </div>

          {/* Cover Image */}
          {post.coverImage && (
            <div className="aspect-video w-full overflow-hidden rounded-lg mb-8 shadow-lg">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Article Header */}
          <header className="mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Author & Date */}
            <div className="flex items-center gap-4 pb-6 border-b border-gray-200 dark:border-stats-blue-800">
              <div className="flex items-center gap-3">
                {post.author.avatarUrl && (
                  <img
                    src={post.author.avatarUrl}
                    alt={post.author.username}
                    className="w-12 h-12 rounded-full ring-2 ring-stats-blue-600 dark:ring-stats-blue-400"
                  />
                )}
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {post.author.username}
                  </p>
                  <time
                    dateTime={post.publishedAt?.toString()}
                    className="text-sm text-gray-500 dark:text-gray-400"
                  >
                    {new Date(post.publishedAt!).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                </div>
              </div>
            </div>
          </header>

          {/* Article Content */}
          <div className="bg-white dark:bg-stats-blue-950 rounded-lg border border-gray-200 dark:border-stats-blue-800 p-8 md:p-12 shadow-sm mb-8">
            <div
              className="prose prose-lg dark:prose-invert max-w-none
                prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white
                prose-h1:text-4xl prose-h1:mb-6 prose-h1:mt-8
                prose-h2:text-3xl prose-h2:mb-4 prose-h2:mt-10 prose-h2:border-b prose-h2:border-gray-200 dark:prose-h2:border-stats-blue-800 prose-h2:pb-2
                prose-h3:text-2xl prose-h3:mb-3 prose-h3:mt-8
                prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:mb-5 prose-p:leading-relaxed
                prose-a:text-stats-blue-600 dark:prose-a:text-stats-blue-400 prose-a:no-underline hover:prose-a:underline prose-a:font-medium
                prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-semibold
                prose-img:rounded-lg prose-img:shadow-md
                prose-code:bg-gray-100 dark:prose-code:bg-stats-blue-900 prose-code:text-stats-blue-600 dark:prose-code:text-stats-blue-400 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:font-mono prose-code:text-sm
                prose-pre:bg-gray-100 dark:prose-pre:bg-stats-blue-900 prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-stats-blue-800 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
                prose-blockquote:border-l-4 prose-blockquote:border-stats-blue-600 dark:prose-blockquote:border-stats-blue-400 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600 dark:prose-blockquote:text-gray-400 prose-blockquote:bg-stats-blue-50 dark:prose-blockquote:bg-stats-blue-900/30 prose-blockquote:py-2 prose-blockquote:rounded-r
                prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4
                prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-4
                prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-li:mb-2"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>

          {/* Article Footer */}
          <footer className="bg-white dark:bg-stats-blue-950 rounded-lg border border-gray-200 dark:border-stats-blue-800 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {post.author.avatarUrl && (
                  <img
                    src={post.author.avatarUrl}
                    alt={post.author.username}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div className="text-sm">
                  <p className="text-gray-500 dark:text-gray-400">Written by</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {post.author.username}
                  </p>
                </div>
              </div>
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 px-4 py-2 bg-stats-blue-100 hover:bg-stats-blue-200 dark:bg-stats-blue-900 dark:hover:bg-stats-blue-800 text-stats-blue-700 dark:text-stats-blue-300 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                All Articles
              </Link>
            </div>
          </footer>
        </article>
      </div>
    )
  } catch (error) {
    return (
      <div className="min-h-screen bg-stats-blue-0 dark:bg-stats-blue-1050 flex items-center justify-center">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="bg-white dark:bg-stats-blue-950 rounded-lg border border-gray-200 dark:border-stats-blue-800 p-12 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Article Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              The article you are looking for does not exist or has been deleted.
            </p>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-stats-blue-600 hover:bg-stats-blue-700 text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Link>
          </div>
        </div>
      </div>
    )
  }
}
