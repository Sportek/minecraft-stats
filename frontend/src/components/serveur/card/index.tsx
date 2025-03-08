import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/auth";
import { useFavorite } from "@/contexts/favorite";
import { cn } from "@/lib/utils";
import { Category, Server, ServerGrowthStat, ServerStat } from "@/types/server";
import { extractVersions, formatVersion } from "@/utils/server-version";
import { Icon } from "@iconify/react/dist/iconify.js";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import NotFound from "../not-found";

interface ServerCardProps {
  server: Server;
  stat: ServerStat | null;
  categories: Category[];
  growthStat: ServerGrowthStat | null;
  isFull?: boolean;
}
const ServerCard = ({ server, stat, categories, growthStat, isFull }: ServerCardProps) => {
  const { user } = useAuth();
  const router = useRouter();

  const canEdit = () => user?.role === "admin" || server.user?.id === user?.id;

  const { addFavorite, removeFavorite, favorites } = useFavorite();

  const isFavorite = favorites.includes(server.id);

  const getFormattedTimeSinceLastOnline = useCallback(() => {
    if (server?.lastOnlineAt) {
      const millisecondsInADay = 1000 * 60 * 60 * 24;
      const millisecondsInAWeek = millisecondsInADay * 7;
      const millisecondsInAMonth = millisecondsInADay * 30;

      const elapsedTime = Date.now() - new Date(server.lastOnlineAt).getTime();

      if (elapsedTime >= millisecondsInAMonth) {
        const months = Math.floor(elapsedTime / millisecondsInAMonth);
        return `${months} months`;
      } else if (elapsedTime >= millisecondsInAWeek) {
        const weeks = Math.floor(elapsedTime / millisecondsInAWeek);
        return `${weeks} weeks`;
      } else {
        const days = Math.floor(elapsedTime / millisecondsInADay);
        return `${days} days`;
      }
    }
    return "never";
  }, [server.lastOnlineAt]);

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
  };

  const getFormattedGrowth = (growth: number | null) => {
    if (growth == null) {
      return null;
    }
    if (growth >= 0) {
      return `+${Math.round(growth * 100)}%`;
    }
    return `${Math.round((growth * 100))}%`;
  };

  const imageUrlPng = `${process.env.NEXT_PUBLIC_BACKEND_URL}${server.imageUrl}.png`;
  const imageUrlWebP = `${process.env.NEXT_PUBLIC_BACKEND_URL}${server.imageUrl}.webp`;

  const [imageUrl, setImageUrl] = useState(imageUrlWebP);

  return (
    <Link
      href={`/servers/${server.id}/${server.name}`}
      className="relative flex flex-row items-center gap-4 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 p-4 w-full rounded-md shadow-sm h-full justify-between transition-all duration-50 ease-in-out group"
    >
      {canEdit() ? (
        <button
          className="group-hover:flex hidden absolute top-[-5px] right-[-5px] h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-800 items-center justify-center hover:bg-zinc-400 dark:hover:bg-zinc-600 hover:cursor-pointer"
          onClick={handleEdit}
        >
          <Icon icon="material-symbols:edit-outline" className="text-zinc-700 dark:text-zinc-300" />
        </button>
      ) : null}
      <div className="flex flex-col items-center gap-2 w-full h-full flex-grow justify-between min-w-0">
        <div className="flex flex-row items-center gap-4 w-full">
          {server.imageUrl ? (
            <Image
              src={imageUrl}
              alt={server.name}
              width={48}
              height={48}
              quality={75}
              priority={false}
              loading="lazy"
              sizes="48px"
              onError={() => setImageUrl(imageUrlPng)}
              className="object-cover rounded-md"
            />
          ) : (
            <NotFound className="text-stats-blue-950 dark:text-stats-blue-50 w-12 h-12" />
          )}
          <div className="flex flex-col flex-grow truncate">
            <div className="text-xl font-semibold truncate flex gap-2">
              <div>{server.name}</div>
            </div>
            <div className="text-sm text-zinc-700 dark:text-zinc-300 truncate">{server?.address?.toUpperCase()}</div>
          </div>
          {stat?.playerCount != null ? (
            <div className="flex flex-col items-end">
              <div className="flex flex-row items-center gap-2">
                <div className="w-3 h-3 bg-green-300 dark:bg-green-700 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 dark:bg-green-500 rounded-full" />
                </div>
                <div className="flex flex-col justify-center items-center">
                  <div>{new Intl.NumberFormat("en-US").format(stat.playerCount)}</div>
                </div>
              </div>
              {growthStat?.monthlyGrowth ? (
                <div className="flex flex-row items-center gap-1">
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Icon
                            icon="material-symbols:info-outline"
                            className="text-zinc-700 dark:text-zinc-300 w-3 h-3"
                          />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-60">
                        <div>
                          This shows how the average player count this week compares to the average for the past 30
                          days. Positive values indicate growth.
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <div
                    className={cn(
                      growthStat.monthlyGrowth != null && growthStat.monthlyGrowth >= 0
                        ? "text-green-500"
                        : "text-red-500",
                      "text-xs"
                    )}
                  >
                    {getFormattedGrowth(growthStat.monthlyGrowth)}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="flex flex-row items-center gap-2">
                      <div className="w-3 h-3 bg-red-300 dark:bg-red-700 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-red-500 dark:bg-red-500 rounded-full" />
                      </div>
                      <div className="text-red-500 dark:text-red-300">Offline</div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div>Last activity {getFormattedTimeSinceLastOnline()}</div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
        <div className="flex flex-row justify-between w-full">
          <div className="flex flex-row items-center gap-1 truncate">
            <Badge
              variant="secondary"
              className="bg-stats-blue-900 dark:bg-stats-blue-950 text-white hover:bg-stats-blue-800 dark:hover:bg-stats-blue-800/80"
            >
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
            className="flex items-center justify-center p-1 group hover:bg-yellow-50 dark:hover:bg-yellow-900 rounded-full transition-all duration-50 ease-in-out"
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            id={`favorite-button-${server.name}-${server.id}`}
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
