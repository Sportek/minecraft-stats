import { PostAuthor, formatPostDate } from "@/components/blog/post-meta";
import { Badge } from "@/components/ui/badge";
import { getPostBySlug } from "@/http/post";
import { ChevronLeft } from "lucide-react";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { BlogPostStructuredData } from "@/components/seo/structured-data";
import ArticleBody from "@/components/blog/article-body";
import { resolveAssetUrl } from "@/lib/domain";
import { getAlternateLanguages, getDomainConfig } from "@/lib/domain-server";
import { renderMarkdown } from "@/lib/markdown";

// ISR — chaque page d'article est rebuild en arrière-plan toutes les 10 minutes (P.4.3)
export const revalidate = 600;

// generateMetadata et le composant de page demandent le même article : on
// mémoïse l'appel sur la durée de la requête pour ne taper le backend qu'une fois.
const loadPost = cache(getPostBySlug);

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { baseUrl } = await getDomainConfig();

  try {
    const post = await loadPost(slug);

    const canonical = `${baseUrl}/blog/${post.slug}`;
    // Fall back to the site OG image so cover-less posts still get a social card.
    const image = post.coverImage
      ? resolveAssetUrl(post.coverImage)
      : `${baseUrl}/images/minecraft-stats/og-image.webp`;

    return {
      title: post.title,
      description: post.excerpt || post.title,
      alternates: {
        canonical,
        languages: getAlternateLanguages(`/blog/${post.slug}`),
      },
      openGraph: {
        title: post.title,
        description: post.excerpt || post.title,
        type: "article",
        url: canonical,
        publishedTime: post.publishedAt?.toString(),
        modifiedTime: post.updatedAt?.toString(),
        authors: [post.author.username],
        images: [image],
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description: post.excerpt || post.title,
        images: [image],
      },
    };
  } catch {
    return {
      title: "Article not found",
      description: "The requested article does not exist",
      robots: { index: false, follow: true },
    };
  }
}

export default async function BlogPostPage({ params }: Readonly<Props>) {
  const { slug } = await params;

  try {
    const post = await loadPost(slug);

    return (
      <div className="min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        {/* Structured Data for SEO */}
        <BlogPostStructuredData
          post={{
            id: post.id,
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt || undefined,
            content: post.content,
            coverImage: post.coverImage || undefined,
            publishedAt: post.publishedAt?.toString() || post.createdAt.toString(),
            updatedAt: post.updatedAt?.toString() || post.createdAt.toString(),
            author: {
              name: post.author.username,
            },
          }}
        />

        {/* Navigation */}
        <div className="container mx-auto max-w-3xl px-4 py-6">
          <Link
            href="/blog"
            className="group -ml-2 inline-flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Blog</span>
          </Link>
        </div>

        <article className="container mx-auto max-w-3xl px-4">
          {/* Header */}
          <header className="mb-8 text-center">
            <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
              News · {formatPostDate(post.publishedAt ?? post.createdAt)}
            </div>
            <h1 className="mb-6 text-3xl font-black leading-tight tracking-tight text-balance text-foreground sm:text-4xl md:text-5xl">
              {post.title}
            </h1>

            {/* Author + category meta */}
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
              <PostAuthor username={post.author.username} avatarUrl={post.author.avatarUrl} />
              <span className="text-border">•</span>
              <Badge variant="accent" className="uppercase tracking-wide">
                News
              </Badge>
            </div>
          </header>

          {/* Cover image */}
          {post.coverImage && (
            <div className="relative mb-10 h-[220px] w-full overflow-hidden rounded-xl border border-border bg-secondary sm:h-[320px] md:h-[400px]">
              <Image src={resolveAssetUrl(post.coverImage)} alt={post.title} className="h-full w-full object-cover" priority unoptimized fill />
            </div>
          )}

          {/* Content body */}
          <div>
            <div className="mx-auto max-w-prose">
              {/* Summary / Lead */}
              {post.excerpt && (
                <p className="relative mb-10 border-l-4 border-accent py-1 pl-6 font-sans text-lg font-medium italic leading-relaxed text-muted-foreground md:text-xl">
                  {post.excerpt}
                </p>
              )}

              {/* Article Content */}
              <ArticleBody
                html={renderMarkdown(post.content)}
                className="prose prose-lg dark:prose-invert max-w-none
                prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground
                prose-h1:text-3xl prose-h1:mt-8 prose-h1:mb-4
                prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border prose-h2:pb-2
                prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
                prose-p:leading-8 prose-p:mb-6 prose-p:text-foreground
                prose-a:text-accent prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                prose-strong:font-bold prose-strong:text-foreground
                prose-img:rounded-lg prose-img:shadow-xs prose-img:border prose-img:border-border
                prose-blockquote:border-l-accent prose-blockquote:bg-secondary prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-md prose-blockquote:not-italic prose-blockquote:text-muted-foreground
                prose-ul:list-disc prose-ul:pl-6
                prose-ol:list-decimal prose-ol:pl-6
                prose-li:mb-2 prose-li:text-foreground
                prose-code:bg-secondary prose-code:text-secondary-foreground prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-secondary prose-pre:border prose-pre:border-border prose-pre:rounded-md prose-pre:text-sm prose-pre:leading-relaxed prose-pre:text-secondary-foreground
                [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit [&_pre_code]:text-sm
              "
              />

              {/* Footer Divider */}
              <div className="mt-16 flex items-center justify-between border-t border-border pt-8">
                <div className="flex items-center gap-4"></div>
                <Link
                  href="/blog"
                  className="text-sm font-bold text-accent transition-colors hover:text-accent/80"
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
    // Return a real 404 (not a soft 200 page) so search engines drop missing posts.
    notFound();
  }
}
