import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { MAX_FAVORITES, useFavorite } from "@/contexts/favorite";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  serverId: number;
  serverName: string;
}

const FavoriteButton = ({ serverId, serverName }: FavoriteButtonProps) => {
  const t = useTranslations("Servers");
  const { isFavorite, toggleFavorite } = useFavorite();
  const { toast } = useToast();
  const active = isFavorite(serverId);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    const applied = toggleFavorite(serverId);
    if (!applied) {
      toast({
        title: t("card.favorite.limitTitle"),
        description: t("card.favorite.limitDescription", { max: MAX_FAVORITES }),
        variant: "error",
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? t("card.favorite.remove") : t("card.favorite.add")}
      aria-pressed={active}
      title={active ? t("card.favorite.remove") : t("card.favorite.add")}
      id={`favorite-button-${serverName}-${serverId}`}
      className={cn(
        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors",
        "hover:bg-secondary focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
        active ? "text-accent" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Star className={cn("h-4 w-4", active && "fill-current")} />
    </button>
  );
};

export default FavoriteButton;
