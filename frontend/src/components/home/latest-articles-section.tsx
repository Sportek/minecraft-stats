"use client";

import { getPosts } from "@/http/post";
import { Icon } from "@iconify/react/dist/iconify.js";
import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";

const LatestArticlesSection = () => {
  const { data, isLoading } = useSWR(["posts", 1, 2], () => getPosts(1, 2));
  const posts = data?.data ?? [];

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-foreground/10" />
          ))}
        </div>
      </section>
    );
  }

  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/10 text-accent">
            <Icon icon="material-symbols:article-outline" className="h-4 w-4" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">From the blog</h2>
        </div>
        <Link
          href="/blog"
          className="text-xs font-medium text-muted-foreground hover:text-accent transition-colors"
        >
          See all →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group flex items-center gap-4 overflow-hidden rounded-xl border border-border bg-card p-3 text-card-foreground shadow-xs transition-all hover:border-accent/50 hover:shadow-md"
          >
            <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
              <Image
                src={post.coverImage || `https://picsum.photos/seed/${post.slug}/800/400`}
                alt=""
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="80px"
                fill
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                <span className="text-accent">News</span>
                <span>·</span>
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
              <h3 className="truncate text-sm font-bold leading-tight text-foreground transition-colors group-hover:text-accent">
                {post.title}
              </h3>
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{post.excerpt}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default LatestArticlesSection;
