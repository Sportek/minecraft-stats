"use client";
import { fetcher, getBaseUrl } from "@/app/_cheatcode";
import { generateTooltipHtml } from "@/components/serveur/card/tooltip-chart";
import { getServerStats } from "@/http/server";
import { ServerStat } from "@/types/server";
import "@/lib/ag-charts";
import {
  AgAreaSeriesOptions,
  AgCartesianAxisOptions,
  AgCartesianChartOptions,
  AgTimeAxisOptions,
} from "ag-charts-community";
import { AgCharts } from "ag-charts-react";

import { ServerData } from "@/app/(pages)/(index)/page";
import { AggregationSelect, AggregationType } from "@/components/home/selects/aggregation-select";
import { TimeRangeSelect, TimeRangeType } from "@/components/home/selects/time-range-select";
import { ServerFAQStructuredData, ServerStructuredData } from "@/components/seo/structured-data";
import ServerCard from "@/components/serveur/card";
import ImprovedCard from "@/components/serveur/improved-card";
import AdSlot from "@/components/ads/ad-slot";
import { Spinner } from "@/components/ui/spinner";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useParams } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";
import useSWR from "swr";

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

const BASE_AXES: { x: AgTimeAxisOptions; y: AgCartesianAxisOptions } = {
  x: {
    type: "time",
    position: "bottom",
    label: {
      format: "%d/%m %H:%M",
    },
    nice: false,
    min: undefined,
    max: undefined,
  },
  y: {
    type: "number",
    position: "left",
  },
};

const BASE_CHART_OPTIONS: Partial<AgCartesianChartOptions> = {
  container: undefined,
  axes: { x: BASE_AXES.x, y: BASE_AXES.y },
  legend: {
    enabled: false,
  },
  tooltip: {
    position: {
      anchorTo: "pointer",
      placement: "top",
    },
  },
  background: {
    fill: "transparent",
  },
  padding: {
    top: 10,
    right: 10,
    bottom: 0,
    left: 10,
  },
};

const createAreaSeries = (
  xKey: string,
  yKey: string,
  yName: string,
  theme: string | undefined
): AgAreaSeriesOptions => ({
  type: "area",
  xKey,
  yKey,
  yName,
  stroke: theme === "dark" ? "#60A5FA" : "#2563EB",
  strokeWidth: 2,
  marker: {
    enabled: false,
  },
  fillOpacity: 0.1,
  fill: theme === "dark" ? "#60A5FA" : "#2563EB",
  interpolation: {
    type: "smooth",
  },
  tooltip: {
    enabled: true,
    position: {
      anchorTo: "pointer",
      placement: "top",
    },
    renderer: ({ datum }: { datum: { time: string | number | Date; playerCount: number } }) => {
      return generateTooltipHtml(
        { time: new Date(datum.time), playerCount: datum.playerCount },
        { isDarkMode: theme === "dark" }
      );
    },
  },
});

const ServerNotFound = () => {
  return (
    <main className="flex-1 space-y-4 py-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="bg-card text-card-foreground border border-border rounded-lg shadow-xs p-8 space-y-6 max-w-md w-full">
            <div className="space-y-2 text-center">
              <div className="w-16 h-16 mx-auto bg-accent/10 text-accent rounded-full flex items-center justify-center">
                <Icon icon="mdi:server-off" className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Server Not Found</h2>
              <p className="text-sm text-muted-foreground">
                The server you&apos;re looking for doesn&apos;t exist or has been removed.
              </p>
            </div>
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-accent-foreground bg-accent hover:bg-accent/90 rounded-md transition-colors"
            >
              <Icon icon="mdi:home" className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

const ServerPage = () => {
  const { serverId } = useParams();
  const {
    data: serverData,
    error: serverError,
    isLoading: isServerLoading,
  } = useSWR<ServerData, Error>(`${getBaseUrl()}/servers/${serverId}`, fetcher, {
    // Aligné sur le TTL Redis backend (300s) — cf. P.2.1
    refreshInterval: 1000 * 60 * 5,
  });

  const [dataRangeInterval, setDataRangeInterval] = useState<TimeRangeType>("1 Week");
  const [dataAggregationInterval, setDataAggregationInterval] = useState<AggregationType>("1 Hour");
  const [isStatsLoading, setIsStatsLoading] = useState<boolean>(false);
  const [stats, setStats] = useState<ServerStat[]>([]);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    async function fetchServerStats() {
      const now = Date.now();
      const fromDate = now - TIME_RANGE_OFFSETS[dataRangeInterval];
      const interval = dataAggregationInterval ? AGGREGATION_INTERVALS[dataAggregationInterval] : undefined;
      const newStats = await getServerStats(
        Number(serverId),
        fromDate,
        now,
        interval
      );
      setStats(newStats);
    }

    startTransition(() => {
      setIsStatsLoading(true);
    });
    fetchServerStats().finally(() => setIsStatsLoading(false));

    const intervalId = setInterval(fetchServerStats, 1000 * 60 * 2);
    return () => clearInterval(intervalId);
  }, [serverId, dataRangeInterval, dataAggregationInterval]);

  const options = useMemo((): AgCartesianChartOptions => {
    const data = stats.map((stat) => ({
      time: new Date(stat.createdAt),
      playerCount: stat.playerCount,
    }));

    const dates = data.map((d) => d.time);
    const minDate = dates.length > 0 ? Math.min(...dates.map((d) => d.getTime())) : undefined;
    const maxDate = dates.length > 0 ? Math.max(...dates.map((d) => d.getTime())) : undefined;

    return {
      ...BASE_CHART_OPTIONS,
      data,
      series: [createAreaSeries("time", "playerCount", "Online players", resolvedTheme)],
      theme: resolvedTheme === "dark" ? "ag-default-dark" : "ag-default",
      axes: {
        x: { ...BASE_AXES.x, min: minDate, max: maxDate },
        y: BASE_AXES.y,
      },
    };
  }, [stats, resolvedTheme]);

  if (isServerLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner size="md" />
          <p className="text-sm">Loading server data...</p>
        </div>
      </div>
    );
  }

  if (serverError) {
    if (serverError.message.includes("404")) {
      return <ServerNotFound />;
    }
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-destructive">{serverError.message}</div>
      </div>
    );
  }

  if (!serverData?.server) {
    return <ServerNotFound />;
  }

  return (
    <main className="flex-1 space-y-6 py-6">
      <ServerStructuredData
        server={serverData.server}
        categories={serverData.categories}
        playerCount={serverData.lastPlayerCount ?? 0}
        maxPlayers={serverData.lastMaxCount ?? undefined}
      />
      <ServerFAQStructuredData
        server={serverData.server}
        currentPlayers={serverData.lastPlayerCount ?? 0}
        maxPlayers={serverData.lastMaxCount ?? 0}
      />

      <ServerCard
        server={serverData.server}
        stats={serverData.stats}
        categories={serverData.categories}
        growthStat={serverData.growthStat}
        isFull={true}
        showChart={false}
      />

      <AdSlot
        placement="server"
        serverId={Number(serverId)}
        serverCategoryIds={serverData.categories.map((category) => category.id)}
      />

      <section className="rounded-xl border border-border bg-card text-card-foreground shadow-xs">
        <div className="flex flex-col gap-2 border-b border-border px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/10 text-accent">
              <Icon icon="material-symbols:show-chart" className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Player Count History</h2>
              <p className="text-xs text-muted-foreground">Online players over time.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <TimeRangeSelect value={dataRangeInterval} onChange={setDataRangeInterval} disabled={isStatsLoading} />
            <AggregationSelect
              value={dataAggregationInterval}
              onChange={setDataAggregationInterval}
              disabled={isStatsLoading}
            />
          </div>
        </div>

        <div className="relative p-4">
          {isStatsLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-xs rounded-b-xl">
              <Spinner size="md" />
            </div>
          )}
          <AgCharts options={options} />
        </div>
      </section>

      <ImprovedCard
        isLoading={isStatsLoading}
        server={serverData.server}
        stats={stats}
        categories={serverData.categories}
      />
    </main>
  );
};

export default ServerPage;
