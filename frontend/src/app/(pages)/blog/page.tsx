import { getPosts } from "@/http/post";
import { Calendar } from "lucide-react";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog - Minecraft Stats",
  description: "Latest news, server spotlights, and development updates.",
};

export default async function BlogPage() {
  const posts = await getPosts(1, 20);
  const publishedArticles = posts.data;
  const featuredArticle = publishedArticles[0];
  const remainingArticles = publishedArticles.slice(1);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 animate-in fade-in duration-500 space-y-10">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">Blog</h1>
            <p className="text-gray-600 dark:text-slate-400 max-w-xl">
              Latest news, server spotlights, and development updates.
            </p>
          </div>
        </div>

        {publishedArticles.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-stats-blue-1000/50 border border-gray-200 dark:border-stats-blue-800 rounded-xl border-dashed">
            <p className="text-gray-500 dark:text-slate-500 text-lg">No articles found.</p>
          </div>
        ) : (
          <>
            {/* Featured Article - Immersive Hero Style */}
            {featuredArticle && (
              <section className="group relative h-[450px] w-full rounded-2xl overflow-hidden cursor-pointer shadow-2xl">
                <Link href={`/blog/${featuredArticle.slug}`} className="block h-full">
                  {/* Background Image */}
                  <div className="absolute inset-0">
                    <Image
                      src={featuredArticle.coverImage || `https://picsum.photos/seed/${featuredArticle.slug}/800/400`}
                      alt={featuredArticle.title}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                      unoptimized
                      fill
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-stats-blue-1050 via-stats-blue-1050/60 to-transparent dark:from-[#0B1221] dark:via-[#0B1221]/60" />
                  </div>

                  {/* Content Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 flex flex-col items-start">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="bg-stats-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-stats-blue-900/20">
                        Featured
                      </span>
                      <span className="text-gray-200 dark:text-slate-300 text-xs flex items-center gap-2 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(featuredArticle.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h2 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight max-w-4xl">
                      {featuredArticle.title}
                    </h2>

                    <p className="text-gray-100 dark:text-slate-200 text-base md:text-lg mb-6 line-clamp-2 max-w-3xl drop-shadow-md">
                      {featuredArticle.excerpt}
                    </p>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-700 dark:bg-slate-800 border-2 border-white/10 flex items-center justify-center text-sm font-bold text-white">
                          {featuredArticle.author.username.charAt(0)}
                        </div>
                        <div className="text-left">
                          <p className="text-white text-sm font-bold">{featuredArticle.author.username}</p>
                        </div>
                      </div>
                      <span className="text-gray-300 dark:text-slate-400">•</span>
                      <span className="text-stats-blue-400 text-sm font-bold group-hover:translate-x-1 transition-transform">
                        Read Article &rarr;
                      </span>
                    </div>
                  </div>
                </Link>
              </section>
            )}

            {/* Grid for other articles */}
            {remainingArticles.length > 0 && (
              <section>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Recent Stories</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {remainingArticles.map((post) => (
                    <Link
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      className="group bg-white dark:bg-stats-blue-1000 rounded-lg overflow-hidden hover:shadow-xl transition-all"
                    >
                      {post.coverImage && (
                        <div className="aspect-video w-full overflow-hidden">
                          <Image
                            src={post.coverImage}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            unoptimized
                            width={800}
                            height={400}
                          />
                        </div>
                      )}
                      <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-stats-blue-600 dark:group-hover:text-stats-blue-400 transition-colors">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="text-gray-600 dark:text-slate-400 mb-4 line-clamp-2 text-sm">{post.excerpt}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-stats-blue-900 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-white">
                              {post.author.username.charAt(0)}
                            </div>
                            <span>{post.author.username}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {new Date(post.publishedAt!).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
