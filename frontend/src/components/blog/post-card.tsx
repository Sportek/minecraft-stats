import { PostAuthor, PostEyebrow, PostViews } from "@/components/blog/post-meta";
import { resolveAssetUrl } from "@/lib/domain";
import { Post } from "@/types/post";
import Image from "next/image";
import { Link } from "@/i18n/navigation";

interface PostCardProps {
  post: Post;
  featured?: boolean;
  locale: string;
}

const PostCard = ({ post, featured = false, locale }: PostCardProps) => {
  const date = post.publishedAt ?? post.createdAt;

  if (featured) {
    return (
      <Link
        href={`/blog/${post.slug}`}
        className="group grid grid-cols-1 overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs transition-all hover:border-accent/50 hover:shadow-md md:grid-cols-2"
      >
        <div className="relative aspect-video w-full overflow-hidden bg-secondary md:aspect-auto md:h-full md:min-h-[18rem]">
          {post.coverImage ? (
            <Image
              src={resolveAssetUrl(post.coverImage)}
              alt={post.title}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized
              fill
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-6xl font-black text-accent/30">
              {post.title.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 p-6 md:p-8">
          <div className="flex items-center justify-between gap-2">
            <PostEyebrow date={date} locale={locale} />
            <PostViews count={post.viewCount} locale={locale} />
          </div>
          <h2 className="text-2xl font-bold leading-tight tracking-tight text-foreground transition-colors group-hover:text-accent md:text-3xl">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="line-clamp-3 text-sm text-muted-foreground md:text-base">{post.excerpt}</p>
          )}
          <div className="mt-auto flex items-center justify-between pt-2">
            <PostAuthor username={post.author.username} avatarUrl={post.author.avatarUrl} />
            <span className="text-sm font-semibold text-accent transition-transform group-hover:translate-x-1">
              Read article &rarr;
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs transition-all hover:border-accent/50 hover:shadow-md"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-secondary">
        {post.coverImage ? (
          <Image
            src={resolveAssetUrl(post.coverImage)}
            alt={post.title}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized
            fill
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl font-black text-accent/30">
            {post.title.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-2">
          <PostEyebrow date={date} locale={locale} />
          <PostViews count={post.viewCount} locale={locale} />
        </div>
        <h3 className="line-clamp-2 text-lg font-bold leading-snug tracking-tight text-foreground transition-colors group-hover:text-accent">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
        )}
        <div className="mt-auto pt-2">
          <PostAuthor username={post.author.username} avatarUrl={post.author.avatarUrl} />
        </div>
      </div>
    </Link>
  );
};

export default PostCard;
