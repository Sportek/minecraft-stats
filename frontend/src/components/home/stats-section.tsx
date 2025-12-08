import { Icon } from "@iconify/react/dist/iconify.js";
import StatCard from "../serveur/stat-card";
import { Server, ServerStat, Category, ServerGrowthStat } from "@/types/server";
import { fetcher } from "@/app/_cheatcode";
import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import { getClientApiUrl } from "@/lib/domain";

interface ServerData {
  server: Server;
  stats: ServerStat[];
  categories: Category[];
  growthStat: ServerGrowthStat | null;
  lastOnlineAt: string | null;
  lastPlayerCount: number | null;
  lastStatsAt: string | null;
  lastMaxCount: number | null;
}

const StatsSection = () => {
  const apiUrl = getClientApiUrl();

  const { data: servers, error: serversError, isLoading: isServersLoading } = useSWR<ServerData[]>(
    `${apiUrl}/servers`,
    fetcher,
    {
      refreshInterval: 1000 * 60 * 2, // Rafraîchir toutes les 2 minutes
    }
  );

  const { data: websiteStats, error: websiteStatsError, isLoading: isWebsiteStatsLoading } = useSWR<{ totalRecords: number }>(
    `${apiUrl}/website-stats`,
    fetcher,
    {
      refreshInterval: 1000 * 60 * 2,
    }
  );

  if (isServersLoading || isWebsiteStatsLoading) {
    return (
      <div className="w-full flex flex-col sm:flex-row gap-4 justify-around">
        <div className="bg-white dark:bg-zinc-950 p-4 rounded-md shadow-md w-full flex flex-col gap-2">
          <div className="flex flex-row gap-2 items-center">
            <Skeleton className="w-6 h-6 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-7 w-20" />
        </div>
        <div className="bg-white dark:bg-zinc-950 p-4 rounded-md shadow-md w-full flex flex-col gap-2">
          <div className="flex flex-row gap-2 items-center">
            <Skeleton className="w-6 h-6 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-7 w-20" />
        </div>
      </div>
    );
  }

  if (serversError || websiteStatsError) {
    return (
      <div className="w-full text-center text-red-500">
        {serversError?.message ?? websiteStatsError?.message ?? "Error loading stats"}
      </div>
    );
  }

  if (!servers || !websiteStats) {
    return null;
  }

  return (
    <div className="w-full flex flex-col sm:flex-row gap-4 justify-around">
      <StatCard
        title="Total Data Rows"
        value={new Intl.NumberFormat("en-US").format(websiteStats.totalRecords)}
        icon={
          <Icon
            icon="material-symbols:database-sharp"
            className="w-6 h-6 text-stats-blue-600 dark:text-stats-blue-400"
          />
        }
      />
      <StatCard
        title="Monitored Servers"
        value={new Intl.NumberFormat("en-US").format(servers.length)}
        icon={<Icon icon="mynaui:servers-solid" className="w-6 h-6 text-stats-blue-600 dark:text-stats-blue-400" />}
      />
    </div>
  );
};

export default StatsSection; 