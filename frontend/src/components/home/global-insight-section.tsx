import { ServerStat } from "@/types/server";
import { useCallback, useEffect, useState } from "react";
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

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const now = Date.now();
      const interval = dataAggregationInterval ? AGGREGATION_INTERVALS[dataAggregationInterval] : undefined;
      const fromDate = now - TIME_RANGE_OFFSETS[dataRangeInterval];
      const toDate = now;

      // Récupérer les stats globales si aucun serveur n'est sélectionné
      if (selectedServers.length === 0) {
        let url = `${apiUrl}/global-stats?fromDate=${fromDate}&toDate=${toDate}&interval=${interval}`;
        if (selectedCategory) {
          url += `&categoryId=${selectedCategory}`;
        }
        if (selectedLanguage) {
          url += `&languageId=${selectedLanguage}`;
        }
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Failed to fetch global stats");
        }

        const data = await response.json();
        setGlobalStats(data);
        setServerStats([]);
      } else {
        // Récupérer les stats pour chaque serveur sélectionné
        const promises = selectedServers.map(async (serverId) => {
          const response = await fetch(
            `${apiUrl}/servers/${serverId}/stats?fromDate=${fromDate}&toDate=${toDate}&interval=${interval}`
          );

          if (!response.ok) {
            throw new Error(`Failed to fetch stats for server ${serverId}`);
          }

          const stats = await response.json();

          // Récupérer les informations du serveur
          const serverResponse = await fetch(`${apiUrl}/servers/${serverId}`);
          
          if (!serverResponse.ok) {
            throw new Error(`Failed to fetch server ${serverId}`);
          }
          
          const serverData = await serverResponse.json();
          
          return { 
            server: serverData.server,
            stats: stats 
          };
        });

        const results = await Promise.all(promises);
        setGlobalStats([]);
        setServerStats(results);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, dataAggregationInterval, dataRangeInterval, selectedCategory, selectedLanguage, selectedServers]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="w-full bg-white dark:bg-zinc-950 p-6 rounded-lg shadow-md">
      <div className="flex flex-col gap-4">
        <div className="flex flex-row justify-between items-center">
          <h2 className="text-xl font-semibold">Global Insight</h2>
          <div className="flex flex-row gap-4 flex-wrap">
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
            <TimeRangeSelect
              value={dataRangeInterval}
              onChange={setDataRangeInterval}
              disabled={isLoading}
            />
            <AggregationSelect
              value={dataAggregationInterval}
              onChange={setDataAggregationInterval}
              disabled={isLoading}
            />
          </div>
        </div>
        <ServerSelect
          selectedServers={selectedServers}
          onChange={setSelectedServers}
          disabled={isLoading}
        />
        <GlobalStatsChart
          globalStats={globalStats}
          serverStats={serverStats}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default GlobalInsightSection;

