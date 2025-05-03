import Link from "next/link";
import { Category, Server, ServerGrowthStat, ServerStat } from "@/types/server";
import ServerImage from "./server-image";
import ServerInfo from "./server-info";
import ServerStatus from "./server-status";
import ServerCategories from "./server-category";
import ServerActions from "./server-action";
import ServerChart from "./server-chart";

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
      className="relative flex flex-col shadow-md bg-white dark:bg-zinc-950 p-4 w-full rounded-md h-full justify-between transition-all duration-50 ease-in-out group hover:bg-zinc-50 dark:hover:bg-zinc-900"
    >
      <ServerActions server={server} />
      <div className="flex flex-col gap-4 w-full h-full min-w-0">
        <div className="flex flex-row gap-4 w-full">
          <div className="flex-shrink-0">
            <ServerImage imageUrl={server.imageUrl} name={server.name} />
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
            {showChart && <ServerChart stats={stats} />}
          </div>
        </div>
        <div className="flex flex-row justify-between w-full">
          <ServerCategories categories={categories} version={server.version ?? undefined} isFull={isFull} />
        </div>
      </div>
    </Link>
  );
};

export default ServerCard;
