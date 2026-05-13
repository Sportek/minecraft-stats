"use client";

import { ServerStat } from "@/types/server";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { TimeRangeSelect, TimeRangeType } from "./selects/time-range-select";
import { AggregationSelect, AggregationType } from "./selects/aggregation-select";
import { GlobalStatsChart } from "./charts/global-stats-chart";
import { Server, ServerSelect } from "./selects/server-select";
import { CategorySelect } from "./selects/category-select";
import { LanguageSelect } from "./selects/language-select";
import { getClientApiUrl } from "@/lib/domain";

const TIME_RANGE_OFFSETS: Record<TimeRangeType, number> = {
  "1 Day": 1000 * 60 * 60 * 24,
  "1 Week": 1000 * 60 * 60 * 24 * 7,
  "1 Month": 1000 * 60 * 60 * 24 * 30,
  "6 Months": 1000 * 60 * 60 * 24 * 30 * 6,
  "1 Year": 1000 * 60 * 60 * 24 * 30 * 12,
};

const AGGREGATION_INTERVALS: Record<AggregationType, string> = {
  "30 Minutes": "30 minutes",
  "1 Hour": "1 hour",
  "2 Hours": "2 hours",
  "6 Hours": "6 hours",
  "1 Day": "1 day",
  "1 Week": "1 week",
};

const GlobalInsightSection = () => {
  const [globalStats, setGlobalStats] = useState<ServerStat[]>([]);
  const [serverStats, setServerStats] = useState<{ server: Server; stats: ServerStat[] }[]>([]);
  const [selectedServers, setSelectedServers] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const apiUrl = getClientApiUrl();

  const [dataRangeInterval, setDataRangeInterval] = useState<TimeRangeType>("1 Week");
  const [dataAggregationInterval, setDataAggregationInterval] = useState<AggregationType>("30 Minutes");

  const fetchStats = useCallback(
    async (signal: AbortSignal) => {
      setIsLoading(true);
      try {
        const now = Date.now();
        const interval = dataAggregationInterval ? AGGREGATION_INTERVALS[dataAggregationInterval] : undefined;
        const fromDate = now - TIME_RANGE_OFFSETS[dataRangeInterval];
        const toDate = now;

        if (selectedServers.length === 0) {
          let url = `${apiUrl}/global-stats?fromDate=${fromDate}&toDate=${toDate}&interval=${interval}`;
          if (selectedCategory) {
            url += `&categoryId=${selectedCategory}`;
          }
          if (selectedLanguage) {
            url += `&languageId=${selectedLanguage}`;
          }
          const response = await fetch(url, { signal });

          if (!response.ok) {
            throw new Error("Failed to fetch global stats");
          }

          const data = await response.json();
          if (signal.aborted) return;
          setGlobalStats(data);
          setServerStats([]);
        } else {
          const promises = selectedServers.map(async (serverId) => {
            const response = await fetch(
              `${apiUrl}/servers/${serverId}/stats?fromDate=${fromDate}&toDate=${toDate}&interval=${interval}`,
              { signal }
            );

            if (!response.ok) {
              throw new Error(`Failed to fetch stats for server ${serverId}`);
            }

            const stats = await response.json();
            const serverResponse = await fetch(`${apiUrl}/servers/${serverId}`, { signal });

            if (!serverResponse.ok) {
              throw new Error(`Failed to fetch server ${serverId}`);
            }

            const serverData = await serverResponse.json();

            return {
              server: serverData.server,
              stats: stats,
            };
          });

          const results = await Promise.all(promises);
          if (signal.aborted) return;
          setGlobalStats([]);
          setServerStats(results);
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        console.error("Error fetching stats:", error);
      } finally {
        if (!signal.aborted) setIsLoading(false);
      }
    },
    [apiUrl, dataAggregationInterval, dataRangeInterval, selectedCategory, selectedLanguage, selectedServers]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchStats(controller.signal);
    return () => controller.abort();
  }, [fetchStats]);

  return (
    <section className="w-full rounded-xl border border-border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col gap-2 border-b border-border px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/10 text-accent">
            <Icon icon="material-symbols:analytics-outline" className="h-4 w-4" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Global Insight</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Compare aggregated player counts across servers, categories, and languages.
        </p>
      </div>

      <div className="flex flex-col gap-4 p-6">
        <div className="flex flex-row flex-wrap gap-2">
          <CategorySelect
            value={selectedCategory}
            onChange={setSelectedCategory}
            disabled={isLoading || selectedServers.length > 0}
          />
          <LanguageSelect
            value={selectedLanguage}
            onChange={setSelectedLanguage}
            disabled={isLoading || selectedServers.length > 0}
          />
          <TimeRangeSelect value={dataRangeInterval} onChange={setDataRangeInterval} disabled={isLoading} />
          <AggregationSelect
            value={dataAggregationInterval}
            onChange={setDataAggregationInterval}
            disabled={isLoading}
          />
        </div>
        <ServerSelect selectedServers={selectedServers} onChange={setSelectedServers} disabled={isLoading} />
        <GlobalStatsChart globalStats={globalStats} serverStats={serverStats} isLoading={isLoading} />
      </div>
    </section>
  );
};

export default GlobalInsightSection;
