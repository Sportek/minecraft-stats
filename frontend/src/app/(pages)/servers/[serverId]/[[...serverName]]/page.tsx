"use client";
import { fetcher, getBaseUrl } from "@/app/_cheatcode";
import { getServerStats } from "@/http/server";
import { ServerStat } from "@/types/server";
import { AgCharts } from "ag-charts-react";
import { AgAreaSeriesOptions, AgCartesianAxisOptions, AgCartesianChartOptions, AgTimeAxisOptions } from "ag-charts-community";

import { ServerData } from "@/app/(pages)/(index)/page";
import Loader from "@/components/loader";
import ServerCard from "@/components/serveur/card";
import ImprovedCard from "@/components/serveur/improved-card";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { TimeRangeSelect, TimeRangeType } from "@/components/home/selects/time-range-select";
import { AggregationSelect, AggregationType } from "@/components/home/selects/aggregation-select";

const BASE_AXES: AgCartesianAxisOptions[] = [
  {
    type: 'time',
    position: 'bottom',
    label: {
      format: '%d/%m %H:%M',
    },
    nice: false,
    min: undefined,
    max: undefined
  } as AgTimeAxisOptions,
  {
    type: 'number',
    position: 'left',
  },
];

const BASE_CHART_OPTIONS: Partial<AgCartesianChartOptions> = {
  container: undefined,
  axes: BASE_AXES,
  legend: {
    enabled: false,
  },
  tooltip: {
    position: {
      anchorTo: 'pointer',
      placement: 'top'
    }
  },
  background: {
    fill: 'transparent',
  },
  padding: {
    top: 10,
    right: 10,
    bottom: 0,
    left: 10
  }
};

const createAreaSeries = (
  xKey: string,
  yKey: string,
  yName: string,
  theme: string | undefined
): AgAreaSeriesOptions => ({
  type: 'area',
  xKey,
  yKey,
  yName,
  stroke: theme === 'dark' ? '#60A5FA' : '#2563EB',
  strokeWidth: 2,
  marker: {
    enabled: false,
  },
  fillOpacity: 0.1,
  fill: theme === 'dark' ? '#60A5FA' : '#2563EB',
  interpolation: {
    type: 'smooth'
  },
});

const ServerPage = () => {
  const { serverId } = useParams();
  const { data: serverData, error: serverError, isLoading: isServerLoading } = useSWR<ServerData, Error>(
    `${getBaseUrl()}/servers/${serverId}`,
    fetcher,
    {
      refreshInterval: 1000 * 60 * 2,
    }
  );

  const dataRangeIntervalTypes = useMemo(() => ({
    "1 Day": Date.now() - 1000 * 60 * 60 * 24,
    "1 Week": Date.now() - 1000 * 60 * 60 * 24 * 7,
    "1 Month": Date.now() - 1000 * 60 * 60 * 24 * 30,
    "6 Months": Date.now() - 1000 * 60 * 60 * 24 * 30 * 6,
    "1 Year": Date.now() - 1000 * 60 * 60 * 24 * 30 * 12,
  } as const), []);

  const dataAggregationIntervalTypes = useMemo(() => ({
    "30 Minutes": "30 minutes",
    "1 Hour": "1 hour",
    "2 Hours": "2 hours",
    "6 Hours": "6 hours",
    "1 Day": "1 day",
    "1 Week": "1 week",
  } as const), []);

  const [dataRangeInterval, setDataRangeInterval] = useState<TimeRangeType>("1 Week");
  const [dataAggregationInterval, setDataAggregationInterval] = useState<AggregationType>("1 Hour");
  const [isStatsLoading, setIsStatsLoading] = useState<boolean>(false);
  const [stats, setStats] = useState<ServerStat[]>([]);
  const [options, setOptions] = useState<AgCartesianChartOptions>({});
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    async function fetchServerStats() {
      const interval = dataAggregationInterval ? dataAggregationIntervalTypes[dataAggregationInterval] : undefined;
      const newStats = await getServerStats(
        Number(serverId), 
        dataRangeIntervalTypes[dataRangeInterval], 
        Date.now(), 
        interval
      );
      setStats(newStats);
    }

    setIsStatsLoading(true);
    fetchServerStats().finally(() => setIsStatsLoading(false));

    const interval = setInterval(fetchServerStats, 1000 * 60 * 2);
    return () => clearInterval(interval);
  }, [serverId, dataRangeInterval, dataRangeIntervalTypes, dataAggregationInterval, dataAggregationIntervalTypes]);

  useEffect(() => {
    const data = stats.map((stat) => ({
      time: new Date(stat.createdAt),
      playerCount: stat.playerCount,
    }));

    // Calculer les dates min et max
    const dates = data.map(d => d.time);
    const minDate = dates.length > 0 ? Math.min(...dates.map(d => d.getTime())) : undefined;
    const maxDate = dates.length > 0 ? Math.max(...dates.map(d => d.getTime())) : undefined;

    setOptions({
      ...BASE_CHART_OPTIONS,
      data,
      series: [createAreaSeries('time', 'playerCount', 'Online players', resolvedTheme)],
      theme: resolvedTheme === "dark" ? "ag-default-dark" : "ag-default",
      axes: [
        {
          ...BASE_AXES[0],
          min: minDate,
          max: maxDate,
        } as AgTimeAxisOptions,
        BASE_AXES[1]
      ]
    });
  }, [stats, resolvedTheme]);

  if (isServerLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-500">Loading server data...</p>
        </div>
      </div>
    );
  }

  if (serverError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-500">{serverError.message}</div>
      </div>
    );
  }

  if (!serverData) {
    return null;
  }

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex flex-col gap-4">
        <ServerCard
          server={serverData.server}
          stats={serverData.stats}
          categories={serverData.categories}
          growthStat={serverData.growthStat}
          isFull={true}
          showChart={false}
        />

        <div className="bg-white dark:bg-zinc-950 rounded-lg shadow-md p-4 space-y-4">
          <div className="space-y-4">
            <div className="flex flex-row justify-between items-center">
              <h2 className="text-lg font-semibold">Player Count History</h2>
              <div className="flex flex-row gap-4">
                <TimeRangeSelect
                  value={dataRangeInterval}
                  onChange={setDataRangeInterval}
                  disabled={isStatsLoading}
                />
                <AggregationSelect
                  value={dataAggregationInterval}
                  onChange={setDataAggregationInterval}
                  disabled={isStatsLoading}
                />
              </div>
            </div>

            <div className="relative">
              {isStatsLoading && (
                <div className="absolute inset-0 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <AgCharts options={options} />
            </div>
          </div>
        </div>

        <ImprovedCard
          isLoading={isStatsLoading}
          server={serverData.server}
          stats={stats}
          categories={serverData.categories}
        />
      </div>
    </main>
  );
};

export default ServerPage;
