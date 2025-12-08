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
      <article className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link
            href="/blog"
            className="text-blue-500 hover:text-blue-600 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
        </div>

        {post.coverImage && (
          <div className="aspect-video w-full overflow-hidden rounded-lg mb-8">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>
          <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              {post.author.avatarUrl && (
                <img
                  src={post.author.avatarUrl}
                  alt={post.author.username}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="font-medium">{post.author.username}</span>
            </div>
            <span>•</span>
            <time dateTime={post.publishedAt?.toString()}>
              {new Date(post.publishedAt!).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          </div>
        </header>

        <div
          className="prose prose-lg dark:prose-invert max-w-none
            prose-headings:font-bold
            prose-h1:text-4xl prose-h1:mb-4
            prose-h2:text-3xl prose-h2:mb-3 prose-h2:mt-8
            prose-h3:text-2xl prose-h3:mb-2 prose-h3:mt-6
            prose-p:mb-4
            prose-a:text-blue-500 prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-lg
            prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
            prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-pre:p-4 prose-pre:rounded-lg
            prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic
            prose-ul:list-disc prose-ul:pl-6
            prose-ol:list-decimal prose-ol:pl-6"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <footer className="mt-12 pt-8 border-t dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Published on {new Date(post.publishedAt!).toLocaleDateString('en-US')}
              </p>
            </div>
            <Link
              href="/blog"
              className="text-blue-500 hover:text-blue-600 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              All Articles
            </Link>
          </div>
        </footer>
      </article>
    )
  } catch (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Article Not Found</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          The article you are looking for does not exist or has been deleted.
        </p>
        <Link
          href="/blog"
          className="text-blue-500 hover:text-blue-600 flex items-center gap-2 justify-center"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>
      </div>
    )
  }
}
