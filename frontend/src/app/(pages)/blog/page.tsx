import PostCard from "@/components/blog/post-card";
import { getPosts } from "@/http/post";
import { Metadata } from "next";

// ISR — la page est rebuild en arrière-plan toutes les heures (P.4.3)
export const revalidate = 3600;

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
      <div className="container mx-auto max-w-6xl animate-in space-y-8 px-4 py-8 duration-500 fade-in md:space-y-10 md:py-10">
        {/* Page header */}
        <header className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-[0.12em] text-accent">News</div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">Blog</h1>
          <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
            Latest news, server spotlights, and development updates.
          </p>
        </header>

        {publishedArticles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card py-20 text-center">
            <p className="text-lg text-muted-foreground">No articles found.</p>
          </div>
        ) : (
          <>
            {/* Featured article */}
            {featuredArticle && <PostCard post={featuredArticle} featured />}

            {/* Recent stories grid */}
            {remainingArticles.length > 0 && (
              <section className="space-y-5">
                <h2 className="text-xl font-bold tracking-tight text-foreground">Recent Stories</h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {remainingArticles.map((post) => (
                    <PostCard key={post.id} post={post} />
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
