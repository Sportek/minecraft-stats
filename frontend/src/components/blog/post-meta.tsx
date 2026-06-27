import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { letterTileGradient } from "@/components/ui/letter-tile";
import { resolveAssetUrl } from "@/lib/domain";
import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";
import { useTranslations } from "next-intl";

// `locale` is threaded in as a prop because these helpers render in both server
// and client trees, so they can't read it from a hook.
export const formatPostDate = (value: Date | string, locale: string) =>
  new Date(value).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const formatViews = (value: number, locale: string) => new Intl.NumberFormat(locale).format(value);

export const PostEyebrow = ({ date, locale }: { date: Date | string; locale: string }) => {
  const t = useTranslations("Blog");
  return (
    <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
      {t("news")} · {formatPostDate(date, locale)}
    </div>
  );
};

/** Compact "eye + count" view tally, shared by the article header and post cards. */
export const PostViews = ({ count, locale, className }: { count: number; locale: string; className?: string }) => {
  const t = useTranslations("Blog");
  return (
    <span
      className={cn("inline-flex items-center gap-1 text-xs text-muted-foreground", className)}
      title={t("viewsCount", { count })}
    >
      <Eye className="h-3.5 w-3.5" />
      {formatViews(count, locale)}
    </span>
  );
};

export const PostAuthor = ({
  username,
  avatarUrl,
}: {
  username: string;
  avatarUrl?: string | null;
}) => (
  <div className="flex items-center gap-2 text-xs text-muted-foreground">
    <Avatar className="h-6 w-6">
      {avatarUrl && <AvatarImage src={resolveAssetUrl(avatarUrl)} alt={username} />}
      <AvatarFallback
        className="text-[10px] font-bold text-white"
        style={{ background: letterTileGradient(username) }}
      >
        {username.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
    <span className="font-medium text-foreground">{username}</span>
  </div>
);
