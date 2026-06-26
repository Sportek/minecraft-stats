import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { letterTileGradient } from "@/components/ui/letter-tile";
import { resolveAssetUrl } from "@/lib/domain";
import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";

export const formatPostDate = (value: Date | string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const formatViews = (value: number) => new Intl.NumberFormat("en-US").format(value);

export const PostEyebrow = ({ date }: { date: Date | string }) => (
  <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
    News · {formatPostDate(date)}
  </div>
);

/** Compact "eye + count" view tally, shared by the article header and post cards. */
export const PostViews = ({ count, className }: { count: number; className?: string }) => (
  <span
    className={cn("inline-flex items-center gap-1 text-xs text-muted-foreground", className)}
    title={`${formatViews(count)} ${count === 1 ? "view" : "views"}`}
  >
    <Eye className="h-3.5 w-3.5" />
    {formatViews(count)}
  </span>
);

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
