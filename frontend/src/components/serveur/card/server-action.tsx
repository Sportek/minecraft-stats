import { Icon } from "@iconify/react/dist/iconify.js";
import { useAuth } from "@/contexts/auth";
import { useFavorite } from "@/contexts/favorite";
import { Server } from "@/types/server";
import { useRouter } from "next/navigation";

interface ServerActionsProps {
  server: Server;
}

const ServerActions = ({ server }: ServerActionsProps) => {
  const { user } = useAuth();
  const router = useRouter();
  const { addFavorite, removeFavorite, favorites } = useFavorite();
  const isFavorite = favorites.includes(server.id);

  const canEdit = () => user?.role === "admin" || server.user?.id === user?.id;

  const handleEdit = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    router.push(`/servers/${server.id}/edit`);
  };

  const toggleFavorite = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    if (isFavorite) {
      removeFavorite(server.id);
    } else {
      addFavorite(server.id);
    }
  };

  return (
    <>
      {canEdit() ? (
        <button
          className="group-hover:flex hidden absolute top-[-5px] right-[-5px] h-7 w-7 rounded-full bg-secondary text-secondary-foreground items-center justify-center hover:bg-accent hover:text-accent-foreground hover:cursor-pointer transition-colors"
          onClick={handleEdit}
        >
          <Icon icon="material-symbols:edit-outline" className="w-4 h-4" />
        </button>
      ) : null}
      {/* <button
        className="flex items-center justify-center p-1 group hover:bg-yellow-50 dark:hover:bg-yellow-900 rounded-full transition-all duration-50 ease-in-out"
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        id={`favorite-button-${server.name}-${server.id}`}
        onClick={toggleFavorite}
      >
        <Icon
          icon={isFavorite ? "material-symbols:kid-star" : "material-symbols:kid-star-outline"}
          className="text-yellow-500 w-5 h-5"
        />
      </button> */}
    </>
  );
};

export default ServerActions; 