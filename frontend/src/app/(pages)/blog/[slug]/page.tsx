import { getPostBySlug } from '@/http/post'
import { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, Calendar } from 'lucide-react'

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
      <div className="min-h-screen bg-stats-blue-0 dark:bg-stats-blue-1050 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        {/* Navigation */}
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <Link
            href="/blog"
            className="flex items-center gap-2 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors group px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-stats-blue-900/50"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Blog</span>
          </Link>
        </div>

        <article className="container mx-auto px-4 max-w-5xl">
          {/* Header Section */}
          <header className="text-center mb-8 px-4 max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-6 leading-tight tracking-tight drop-shadow-lg">
              {post.title}
            </h1>

            {/* Metadata Line: Author - Date - Category */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-stats-blue-600 to-indigo-500 flex items-center justify-center text-[10px] font-bold text-white border border-white/10">
                  {post.author.username.charAt(0)}
                </div>
                <span className="font-medium text-gray-800 dark:text-slate-200">{post.author.username}</span>
              </div>

              <span className="text-gray-400 dark:text-slate-600">•</span>

              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-500 dark:text-slate-500" />
                <span>
                  {new Date(post.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>

              <span className="text-gray-400 dark:text-slate-600">•</span>

              <span className="bg-stats-blue-500/10 text-stats-blue-600 dark:text-stats-blue-400 px-2.5 py-0.5 rounded-full text-xs font-bold border border-stats-blue-500/20 uppercase tracking-wide">
                News
              </span>
            </div>
          </header>

          {/* Hero Image */}
          {post.coverImage && (
            <div className="mb-12 relative px-4 md:px-0">
              <div className="w-full h-[300px] md:h-[400px] rounded-2xl overflow-hidden border border-gray-200 dark:border-stats-blue-800/50 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative group bg-gray-100 dark:bg-slate-900">
                <div className="absolute inset-0 bg-gradient-to-t from-stats-blue-1050 via-transparent to-transparent opacity-10 pointer-events-none z-10 dark:from-[#0B1221]" />
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Content Body */}
          <div className="px-4 md:px-8">
            <div className="max-w-prose mx-auto">
              {/* Summary / Lead */}
              {post.excerpt && (
                <p className="text-lg md:text-xl text-gray-700 dark:text-slate-200 font-medium leading-relaxed mb-10 font-sans border-l-4 border-stats-blue-500 pl-6 py-1 italic relative">
                  {post.excerpt}
                </p>
              )}

              {/* Article Content */}
              <div
                className="prose prose-invert prose-lg max-w-none
                prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white prose-headings:tracking-tight
                prose-p:text-gray-700 dark:prose-p:text-slate-400 prose-p:leading-8 prose-p:mb-6
                prose-a:text-stats-blue-600 dark:prose-a:text-stats-blue-400 prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                prose-strong:text-gray-900 dark:prose-strong:text-slate-200 prose-strong:font-bold
                prose-li:text-gray-700 dark:prose-li:text-slate-400
                prose-img:rounded-xl prose-img:shadow-xl prose-img:border prose-img:border-gray-200 dark:prose-img:border-stats-blue-800
                prose-blockquote:border-l-stats-blue-500 prose-blockquote:bg-gray-50 dark:prose-blockquote:bg-slate-900/30 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
              "
              >
                <div
                  className="whitespace-pre-wrap font-sans"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              </div>

              {/* Footer Divider */}
              <div className="mt-16 pt-8 border-t border-gray-200 dark:border-stats-blue-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-gray-500 dark:text-slate-500 text-sm font-medium">
                    Share this article:
                  </span>
                  <button className="text-gray-400 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </button>
                  <button className="text-gray-400 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.468 2.373c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
                <Link
                  href="/blog"
                  className="text-stats-blue-600 dark:text-stats-blue-400 text-sm font-bold hover:text-stats-blue-500 dark:hover:text-stats-blue-300 transition-colors"
                >
                  Read more articles &rarr;
                </Link>
              </div>
            </div>
          </div>
        </article>
      </div>
    )
  } catch (error) {
    return (
      <div className="min-h-screen bg-stats-blue-0 dark:bg-stats-blue-1050 flex items-center justify-center">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="bg-white dark:bg-stats-blue-950 rounded-lg border border-gray-200 dark:border-stats-blue-800 p-12 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Article Not Found</h1>
            <p className="text-gray-600 dark:text-slate-400 mb-8">
              The article you are looking for does not exist or has been deleted.
            </p>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-stats-blue-600 hover:bg-stats-blue-700 text-white rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Blog
            </Link>
          </div>
        </div>
      </div>
    )
  }
}
