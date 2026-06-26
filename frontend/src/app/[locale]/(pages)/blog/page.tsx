import PostCard from "@/components/blog/post-card";
import { Button } from "@/components/ui/button";
import { getPosts } from "@/http/post";
import { getAlternateLanguages, getDomainConfig } from "@/lib/domain-server";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Metadata } from "next";
import { Link } from "@/i18n/navigation";

const PAGE_SIZE = 12;

// ISR — la page est rebuild en arrière-plan toutes les heures (P.4.3)
export const revalidate = 3600;

type Props = {
  searchParams: Promise<{ page?: string }>;
};

function parsePage(value?: string): number {
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { baseUrl } = await getDomainConfig();
  const page = parsePage((await searchParams).page);
  const path = page > 1 ? `/blog?page=${page}` : "/blog";

  return {
    title: "Blog",
    description: "Latest news, server spotlights, and development updates.",
    alternates: {
      canonical: `${baseUrl}${path}`,
      languages: getAlternateLanguages(path),
      types: {
        "application/rss+xml": `${baseUrl}/feed.xml`,
      },
    },
  };
}

export default async function BlogPage({ searchParams }: Readonly<Props>) {
  const page = parsePage((await searchParams).page);
  const posts = await getPosts(page, PAGE_SIZE);
  const articles = posts.data;
  const { currentPage, lastPage } = posts.meta;

  // The featured hero only makes sense on the first page.
  const featuredArticle = currentPage === 1 ? articles[0] : undefined;
  const remainingArticles = currentPage === 1 ? articles.slice(1) : articles;

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

        {articles.length === 0 ? (
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
                {currentPage === 1 && (
                  <h2 className="text-xl font-bold tracking-tight text-foreground">Recent Stories</h2>
                )}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {remainingArticles.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              </section>
            )}

            {/* Pagination */}
            {lastPage > 1 && (
              <nav className="flex items-center justify-between border-t border-border pt-6" aria-label="Blog pagination">
                {currentPage > 1 ? (
                  <Button asChild variant="outline">
                    <Link href={currentPage === 2 ? "/blog" : `/blog?page=${currentPage - 1}`} rel="prev">
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Previous
                    </Link>
                  </Button>
                ) : (
                  <span />
                )}
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {lastPage}
                </span>
                {currentPage < lastPage ? (
                  <Button asChild variant="outline">
                    <Link href={`/blog?page=${currentPage + 1}`} rel="next">
                      Next
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <span />
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
