import Link from "next/link";
import { Category, Server, ServerGrowthStat, ServerStat } from "@/types/server";
import ServerImage from "./server-image";
import ServerInfo from "./server-info";
import ServerStatus from "./server-status";
import ServerCategories from "./server-category";
import ServerActions from "./server-action";
import ServerChart from "./server-chart";
import ServerLanguages from "./server-languages";
import FavoriteButton from "./favorite-button";

interface ServerCardProps {
  server: Server;
  stats: ServerStat[];
  categories: Category[];
  growthStat: ServerGrowthStat | null;
  isFull?: boolean;
  showChart?: boolean;
}

const ServerCard = ({ server, stats, categories, growthStat, isFull, showChart = true }: ServerCardProps) => {
  return (
    <Link
      href={`/servers/${server.id}/${server.name}`}
      className="relative flex flex-col shadow-sm border border-border bg-card text-card-foreground p-4 w-full rounded-md h-full justify-between transition-all duration-150 ease-in-out group hover:border-accent/50 hover:shadow-md"
    >
      <ServerActions server={server} />
      <div className="flex flex-col gap-4 w-full h-full min-w-0">
        <div className="flex flex-row gap-4 w-full">
          <div className="flex-shrink-0 flex flex-col gap-2 items-center justify-center">
            <ServerImage imageUrl={server.imageUrl} name={server.name} />
            <ServerLanguages languages={server.languages} className="flex flex-row gap-2 items-center justify-center" />
          </div>
          <div className="flex flex-col flex-grow gap-2 min-w-0">
            <div className="flex flex-row items-center w-full min-w-0">
              <div className="flex-grow min-w-0">
                <ServerInfo name={server.name} address={server.address} />
              </div>
              <div className="flex-shrink-0">
                <ServerStatus 
                  stats={stats} 
                  growthStat={growthStat} 
                  lastOnlineAt={server.lastOnlineAt ? new Date(server.lastOnlineAt).toISOString() : null} 
                />
              </div>
            </div>
            {showChart && (
                <ServerChart stats={stats} />
            )}
          </div>
        </div>
        <div className="flex flex-row items-center justify-between gap-2 w-full">
          <ServerCategories categories={categories} version={server.version ?? undefined} isFull={isFull} />
          <FavoriteButton serverId={server.id} serverName={server.name} />
        </div>
      </div>
    </Link>
  );
};

export default ServerCard;
