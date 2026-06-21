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
      <div className="container mx-auto animate-in space-y-10 px-4 py-8 duration-500 fade-in">
        {/* Page Header */}
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-accent">News</div>
            <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground">Blog</h1>
            <p className="max-w-xl text-muted-foreground">
              Latest news, server spotlights, and development updates.
            </p>
          </div>
        </div>

        {publishedArticles.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card py-20 text-center">
            <p className="text-lg text-muted-foreground">No articles found.</p>
          </div>
        ) : (
          <>
            {/* Featured Article */}
            {featuredArticle && <PostCard post={featuredArticle} featured />}

            {/* Grid for other articles */}
            {remainingArticles.length > 0 && (
              <section>
                <h2 className="mb-6 text-xl font-bold tracking-tight text-foreground">Recent Stories</h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
