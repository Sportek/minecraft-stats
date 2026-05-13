"use client";

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
      refreshInterval: 1000 * 60 * 5,
    }
  );

  const { data: websiteStats, error: websiteStatsError, isLoading: isWebsiteStatsLoading } = useSWR<{
    totalRecords: number;
  }>(`${apiUrl}/website-stats`, fetcher, {
    refreshInterval: 1000 * 60 * 5,
  });

  if (isServersLoading || isWebsiteStatsLoading) {
    return (
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-md" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="mt-3 h-8 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (serversError || websiteStatsError) {
    return (
      <div className="w-full text-center text-sm text-destructive">
        {serversError?.message ?? websiteStatsError?.message ?? "Error loading stats"}
      </div>
    );
  }

  if (!servers || !websiteStats) {
    return null;
  }

  return (
    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
      <StatCard
        title="Total Data Rows"
        value={new Intl.NumberFormat("en-US").format(websiteStats.totalRecords)}
        icon={<Icon icon="material-symbols:database-sharp" className="h-5 w-5" />}
      />
      <StatCard
        title="Monitored Servers"
        value={new Intl.NumberFormat("en-US").format(servers.length)}
        icon={<Icon icon="mynaui:servers-solid" className="h-5 w-5" />}
      />
    </div>
  );
};

export default StatsSection;
