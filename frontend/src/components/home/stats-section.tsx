"use client";

import { Icon } from "@iconify/react/dist/iconify.js";
import { useFormatter, useTranslations } from "next-intl";
import StatCard from "../serveur/stat-card";
import { fetcher } from "@/app/_cheatcode";
import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import { getClientApiUrl } from "@/lib/domain";

interface WebsiteStats {
  totalRecords: number;
  totalServers: number;
  playersOnline: number;
}

const StatsSection = () => {
  const apiUrl = getClientApiUrl();
  const formatter = useFormatter();
  const t = useTranslations("Home");

  // Toutes les agrégations (serveurs surveillés, joueurs en ligne, lignes de
  // données) sont calculées côté backend : un seul endpoint léger plutôt que de
  // rapatrier la liste complète des serveurs juste pour la sommer côté client.
  const {
    data: websiteStats,
    error: websiteStatsError,
    isLoading: isWebsiteStatsLoading,
  } = useSWR<WebsiteStats>(`${apiUrl}/website-stats`, fetcher, {
    refreshInterval: 1000 * 60 * 5,
  });

  if (isWebsiteStatsLoading) {
    return (
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4 shadow-xs">
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

  if (websiteStatsError) {
    return (
      <div className="w-full text-center text-sm text-destructive">
        {websiteStatsError?.message ?? t("stats.error")}
      </div>
    );
  }

  if (!websiteStats) {
    return null;
  }

  const format = (value: number) => formatter.number(value);

  return (
    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard
        title={t("stats.monitoredServers")}
        value={format(websiteStats.totalServers)}
        icon={<Icon icon="mynaui:servers-solid" className="h-5 w-5" />}
      />
      <StatCard
        title={t("stats.playersOnlineNow")}
        value={format(websiteStats.playersOnline)}
        icon={<Icon icon="mdi:account-multiple" className="h-5 w-5" />}
      />
      <StatCard
        title={t("stats.totalDataRows")}
        value={format(websiteStats.totalRecords)}
        icon={<Icon icon="material-symbols:database-sharp" className="h-5 w-5" />}
      />
    </div>
  );
};

export default StatsSection;
