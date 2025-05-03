import { ServerStat } from "@/types/server";
import { useEffect, useMemo, useState } from "react";
import { TimeRangeSelect, TimeRangeType } from "./selects/time-range-select";
import { AggregationSelect, AggregationType } from "./selects/aggregation-select";
import { GlobalStatsChart } from "./charts/global-stats-chart";
import { Server, ServerSelect } from "./selects/server-select";

const GlobalInsightSection = () => {
  const [globalStats, setGlobalStats] = useState<ServerStat[]>([]);
  const [serverStats, setServerStats] = useState<{ server: Server; stats: ServerStat[] }[]>([]);
  const [selectedServers, setSelectedServers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const dataRangeIntervalTypes = useMemo(() => {
    return {
      "1 Day": Date.now() - 1000 * 60 * 60 * 24,
      "1 Week": Date.now() - 1000 * 60 * 60 * 24 * 7,
      "1 Month": Date.now() - 1000 * 60 * 60 * 24 * 30,
      "6 Months": Date.now() - 1000 * 60 * 60 * 24 * 30 * 6,
      "1 Year": Date.now() - 1000 * 60 * 60 * 24 * 30 * 12,
    };
  }, []);

  const dataAggregationIntervalTypes = useMemo(() => {
    return {
      "30 Minutes": "30 minutes",
      "1 Hour": "1 hour",
      "2 Hours": "2 hours",
      "6 Hours": "6 hours",
      "1 Day": "1 day",
      "1 Week": "1 week",
    };
  }, []);

  const [dataRangeInterval, setDataRangeInterval] = useState<TimeRangeType>("1 Week");
  const [dataAggregationInterval, setDataAggregationInterval] = useState<AggregationType>("2 Hours");

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const interval = dataAggregationInterval ? dataAggregationIntervalTypes[dataAggregationInterval] : undefined;
      const fromDate = dataRangeIntervalTypes[dataRangeInterval];
      const toDate = Date.now();

      // Récupérer les stats globales si aucun serveur n'est sélectionné
      if (selectedServers.length === 0) {
        const response = await fetch(
          `http://localhost:9000/api/v1/global-stats?fromDate=${fromDate}&toDate=${toDate}&interval=${interval}`
        );
        
        if (!response.ok) {
          throw new Error("Failed to fetch global stats");
        }
        
        const data = await response.json();
        setGlobalStats(data);
        setServerStats([]);
      } else {
        // Récupérer les stats pour chaque serveur sélectionné
        const promises = selectedServers.map(async (serverId) => {
          console.log('Fetching stats for server:', serverId);
          const response = await fetch(
            `http://localhost:9000/api/v1/servers/${serverId}/stats?fromDate=${fromDate}&toDate=${toDate}&interval=${interval}`
          );
          
          if (!response.ok) {
            throw new Error(`Failed to fetch stats for server ${serverId}`);
          }
          
          const stats = await response.json();
          console.log('Stats for server', serverId, ':', stats);
          
          // Récupérer les informations du serveur
          const serverResponse = await fetch(`http://localhost:9000/api/v1/servers/${serverId}`);
          
          if (!serverResponse.ok) {
            throw new Error(`Failed to fetch server ${serverId}`);
          }
          
          const serverData = await serverResponse.json();
          console.log('Server data:', serverData);
          
          return { 
            server: serverData.server,
            stats: stats 
          };
        });

        const results = await Promise.all(promises);
        console.log('All server stats results:', results);
        setGlobalStats([]);
        setServerStats(results);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [dataRangeInterval, dataAggregationInterval, selectedServers]);

  return (
    <div className="w-full bg-white dark:bg-zinc-950 p-6 rounded-lg shadow-md">
      <div className="flex flex-col gap-4">
        <div className="flex flex-row justify-between items-center">
          <h2 className="text-xl font-semibold">Overall Stats</h2>
          <div className="flex flex-row gap-4">
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

