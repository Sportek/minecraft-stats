import PostCard from "@/components/blog/post-card";
import { Button } from "@/components/ui/button";
import { getPosts } from "@/http/post";
import { PostLocale } from "@/types/post";
import { buildAlternates, getDomainConfig } from "@/lib/domain-server";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const PAGE_SIZE = 12;

// ISR — la page est rebuild en arrière-plan toutes les heures (P.4.3)
export const revalidate = 3600;

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
};

function parsePage(value?: string): number {
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params;
  const { baseUrl } = await getDomainConfig();
  const t = await getTranslations({ locale, namespace: "Blog" });
  const page = parsePage((await searchParams).page);
  const path = page > 1 ? `/blog?page=${page}` : "/blog";

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      ...buildAlternates(locale, path),
      types: {
        "application/rss+xml": `${baseUrl}/feed.xml`,
      },
    },
  };
}

export default async function BlogPage({ params, searchParams }: Readonly<Props>) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Blog" });
  const page = parsePage((await searchParams).page);
  const posts = await getPosts(page, PAGE_SIZE, locale as PostLocale);
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
          <div className="text-xs font-bold uppercase tracking-[0.12em] text-accent">{t("news")}</div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">{t("title")}</h1>
          <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
            {t("description")}
          </p>
        </header>

        {articles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card py-20 text-center">
            <p className="text-lg text-muted-foreground">{t("empty")}</p>
          </div>
        ) : (
          <>
            {/* Featured article */}
            {featuredArticle && <PostCard post={featuredArticle} featured locale={locale} />}

            {/* Recent stories grid */}
            {remainingArticles.length > 0 && (
              <section className="space-y-5">
                {currentPage === 1 && (
                  <h2 className="text-xl font-bold tracking-tight text-foreground">{t("recentStories")}</h2>
                )}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {remainingArticles.map((post) => (
                    <PostCard key={post.id} post={post} locale={locale} />
                  ))}
                </div>
              </section>
            )}

            {/* Pagination */}
            {lastPage > 1 && (
              <nav className="flex items-center justify-between border-t border-border pt-6" aria-label={t("pagination.label")}>
                {currentPage > 1 ? (
                  <Button asChild variant="outline">
                    <Link href={currentPage === 2 ? "/blog" : `/blog?page=${currentPage - 1}`} rel="prev">
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      {t("pagination.previous")}
                    </Link>
                  </Button>
                ) : (
                  <span />
                )}
                <span className="text-sm text-muted-foreground">
                  {t("pagination.pageOf", { currentPage, lastPage })}
                </span>
                {currentPage < lastPage ? (
                  <Button asChild variant="outline">
                    <Link href={`/blog?page=${currentPage + 1}`} rel="next">
                      {t("pagination.next")}
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
