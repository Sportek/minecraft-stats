import { Star } from "lucide-react";
import { useFavorite } from "@/contexts/favorite";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  serverId: number;
  serverName: string;
}

const FavoriteButton = ({ serverId, serverName }: FavoriteButtonProps) => {
  const { isFavorite, toggleFavorite } = useFavorite();
  const active = isFavorite(serverId);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    toggleFavorite(serverId);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={active}
      title={active ? "Remove from favorites" : "Add to favorites"}
      id={`favorite-button-${serverName}-${serverId}`}
      className={cn(
        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors",
        "hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active ? "text-accent" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Star className={cn("h-4 w-4", active && "fill-current")} />
    </button>
  );
};

export default FavoriteButton;
