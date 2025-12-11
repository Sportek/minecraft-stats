import { getPostBySlug } from "@/http/post";
import { Calendar, ChevronLeft } from "lucide-react";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const post = await getPostBySlug(slug);

    return {
      title: `${post.title} - Minecraft Stats Blog`,
      description: post.excerpt || post.title,
      openGraph: {
        title: post.title,
        description: post.excerpt || post.title,
        type: "article",
        publishedTime: post.publishedAt?.toString(),
        authors: [post.author.username],
        images: post.coverImage ? [post.coverImage] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description: post.excerpt || post.title,
        images: post.coverImage ? [post.coverImage] : [],
      },
    };
  } catch {
    return {
      title: "Article not found - Minecraft Stats",
      description: "The requested article does not exist",
    };
  }
}

export default async function BlogPostPage({ params }: Readonly<Props>) {
  const { slug } = await params;

  try {
    const post = await getPostBySlug(slug);

    return (
      <div className="min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        {/* Navigation */}
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <Link
            href="/blog"
            className="flex items-center gap-2 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors group px-4 py-2 rounded-lg "
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Blog</span>
          </Link>
        </div>

        <article className="container mx-auto px-4 max-w-5xl">
          {/* Header Section */}
          <header className="text-center mb-8 px-4 max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-6 leading-tight tracking-tight">
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
                    year: "numeric",
                    month: "long",
                    day: "numeric",
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
              <div className="w-full h-[300px] md:h-[400px] rounded-2xl overflow-hidden relative group bg-gray-100 dark:bg-slate-900">
                <div className="absolute inset-0 bg-gradient-to-t from-stats-blue-1050 via-transparent to-transparent opacity-10 pointer-events-none z-10 dark:from-[#0B1221]" />
                <Image src={post.coverImage} alt={post.title} className="w-full h-full object-cover" unoptimized fill />
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
                className="prose prose-lg dark:prose-invert max-w-none
                prose-headings:font-bold prose-headings:tracking-tight
                prose-h1:text-3xl prose-h1:mt-8 prose-h1:mb-4
                prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-gray-200 dark:prose-h2:border-slate-700 prose-h2:pb-2
                prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
                prose-p:leading-8 prose-p:mb-6
                prose-a:text-stats-blue-600 dark:prose-a:text-stats-blue-400 prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                prose-strong:font-bold
                prose-img:rounded-xl prose-img:shadow-xl prose-img:border prose-img:border-gray-200 dark:prose-img:border-stats-blue-800
                prose-blockquote:border-l-stats-blue-500 prose-blockquote:bg-gray-50 dark:prose-blockquote:bg-slate-900/30 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
                prose-ul:list-disc prose-ul:pl-6
                prose-ol:list-decimal prose-ol:pl-6
                prose-li:mb-2
                prose-code:bg-gray-100 dark:prose-code:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-gray-100 dark:prose-pre:bg-slate-900 prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-slate-700 prose-pre:rounded-lg
              "
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Footer Divider */}
              <div className="mt-16 pt-8 border-t border-gray-200 dark:border-stats-blue-800 flex items-center justify-between">
                <div className="flex items-center gap-4"></div>
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
    );
  } catch {
    return (
      <div className="flex items-center justify-center">
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
    );
  }
}
