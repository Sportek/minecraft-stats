import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Category, Server, ServerStat } from "@/types/server";
import Link from "next/link";
import NotFound from "../not-found";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useAuth } from "@/contexts/auth";
import { useRouter } from "next/navigation";
import { extractVersions, formatVersion } from "@/utils/server-version";
import { useFavorite } from "@/contexts/favorite";

interface ServerCardProps {
  server: Server;
  stat: ServerStat | null;
  categories: Category[];
  isFull?: boolean;
}
const ServerCard = ({ server, stat, categories, isFull }: ServerCardProps) => {

  const { user } = useAuth();
  const router = useRouter();

  const canEdit = () => user?.role === "admin" || server.user?.id === user?.id;

  const { addFavorite, removeFavorite, favorites } = useFavorite();

  const isFavorite = favorites.includes(server.id);

  const toggleFavorite = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    if (isFavorite) {
      removeFavorite(server.id);
    } else {
      addFavorite(server.id);
    }
  };

  const handleEdit = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    router.push(`/servers/${server.id}/edit`);
  }

  return (
    <Link
      href={`/servers/${server.id}/${server.name}`}
      className="relative flex flex-row items-center gap-4 bg-zinc-200 hover:bg-zinc-300 p-4 w-full rounded-md shadow-sm h-full justify-between transition-all duration-50 ease-in-out group"
    >
      {canEdit() ? (
        <button
          className="group-hover:flex hidden absolute top-[-5px] right-[-5px] h-7 w-7 rounded-full bg-zinc-200 items-center justify-center hover:bg-zinc-400 hover:cursor-pointer"
          onClick={handleEdit}
        >
          <Icon icon="material-symbols:edit-outline" className="text-zinc-700" />
        </button>
      ) : null}
      <div className="flex flex-col items-center gap-2 w-full h-full flex-grow justify-between min-w-0">
        <div className="flex flex-row items-center gap-4 w-full">
          <Avatar>
            <AvatarImage
              src={server.imageUrl ? `${process.env.NEXT_PUBLIC_BACKEND_URL}${server.imageUrl}` : ""}
              alt={server.name}
            />
            <AvatarFallback>
              <NotFound className="text-stats-blue-950" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-grow truncate">
            <div className="text-xl font-semibold truncate flex gap-2">
              <div>{server.name}</div>
            </div>
            <div className="text-sm text-zinc-700 truncate">{server?.address?.toUpperCase()}</div>
          </div>
          {stat ? (
            <div className="flex flex-row items-center gap-2">
              <div className="w-3 h-3 bg-green-300 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
              </div>
              <div className="flex flex-col justify-center items-center">
                <div>{stat.playerCount}</div>
              </div>
            </div>
          ) : (
            <div className="flex flex-row items-center gap-2">
              <div className="w-3 h-3 bg-red-300 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
              </div>
              <div className="text-red-500">Offline</div>
            </div>
          )}
        </div>
        <div className="flex flex-row justify-between w-full">
          <div className="flex flex-row items-center gap-1 truncate">
            <Badge variant="secondary" className="bg-stats-blue-900 text-white hover:bg-stats-blue-950">
              {formatVersion(extractVersions(server.version ?? ""))}
            </Badge>
            {categories
              .map((category) => (
                <Badge key={category.id} className="text-xs text-nowrap" variant="secondary">
                  {category.name}
                </Badge>
              ))
              .slice(0, isFull ? categories.length : 2)}
            {!isFull && categories.length > 2 ? (
              <Badge className="text-xs text-nowrap" variant="secondary">
                +{categories.length - 2}
              </Badge>
            ) : null}
          </div>
          <button
            className="flex items-center justify-center p-1 group hover:bg-yellow-50 rounded-full transition-all duration-50 ease-in-out"
            onClick={toggleFavorite}
          >
            <Icon
              icon={isFavorite ? "material-symbols:kid-star" : "material-symbols:kid-star-outline"}
              className="text-yellow-500 w-5 h-5"
            />
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ServerCard;
