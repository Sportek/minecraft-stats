import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { letterTileGradient } from "@/components/ui/letter-tile";
import { resolveAssetUrl } from "@/lib/domain";

export const formatPostDate = (value: Date | string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export const PostEyebrow = ({ date }: { date: Date | string }) => (
  <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
    News · {formatPostDate(date)}
  </div>
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
