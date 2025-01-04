"use client";
import { fetcher, getBaseUrl } from "@/app/_cheatcode";
import { getServerStats } from "@/http/server";
import { ServerStat } from "@/types/server";
import { AgChartsReact } from "ag-charts-react";

import { ServerData } from "@/app/(pages)/(index)/page";
import Loader from "@/components/loader";
import ServerCard from "@/components/serveur/card";
import ImprovedCard from "@/components/serveur/improved-card";
import { Button } from "@/components/ui/button";
import { AgChartOptions } from "ag-charts-community";
import { useTheme } from "next-themes";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

const ServerPage = () => {
  const { serverId } = useParams();
  const server = useSWR<ServerData, Error>(
    `${getBaseUrl()}/servers/${serverId}`,
    fetcher,
    {
      refreshInterval: 1000 * 60 * 2,
    }
  );

  const dataRangeIntervalTypes = useMemo(() => {
    return {
      "1 Day": Date.now() - 1000 * 60 * 60 * 24,
      "1 Week": Date.now() - 1000 * 60 * 60 * 24 * 7,
      "1 Month": Date.now() - 1000 * 60 * 60 * 24 * 30,
      "6 Months": Date.now() - 1000 * 60 * 60 * 24 * 30 * 6,
      "1 Year": Date.now() - 1000 * 60 * 60 * 24 * 30 * 12,
      Everything: Date.now() - 1000 * 60 * 60 * 24 * 30 * 12 * 5,
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

  const [dataRangeInterval, setDataRangeInterval] = useState<keyof typeof dataRangeIntervalTypes>("1 Week");
  const [dataAggregationInterval, setDataAggregationInterval] = useState<
    keyof typeof dataAggregationIntervalTypes | undefined
  >(undefined);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [stats, setStats] = useState<ServerStat[]>([]);
  const [options, setOptions] = useState<AgChartOptions>({});
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    function fetchServerStats() {
      const interval = dataAggregationInterval ? dataAggregationIntervalTypes[dataAggregationInterval] : undefined;
      getServerStats(Number(serverId), dataRangeIntervalTypes[dataRangeInterval], Date.now(), interval).then(
        (stats) => {
          setStats(stats);
        }
      );
    }

    setIsLoading(true);
    fetchServerStats();
    setIsLoading(false);

    const interval = setInterval(() => {
      fetchServerStats();
    }, 1000 * 60 * 2);

    return () => {
      clearInterval(interval);
    };
  }, [serverId, dataRangeInterval, dataRangeIntervalTypes, dataAggregationInterval, dataAggregationIntervalTypes]);

  useEffect(() => {
    setOptions({
      title: {
        text: server.data?.server.name,
      },
      data: stats.map((stat) => ({
        time: new Date(stat.createdAt),
        playerCount: stat.playerCount,
      })),
      series: [
        {
          marker: {
            enabled: false,
          },
          xKey: "time",
          yKey: "playerCount",
          connectMissingData: false,
        },
      ],
      theme: resolvedTheme === "dark" ? "ag-default-dark" : "ag-default",
      background: {
        fill: resolvedTheme === "dark" ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.5)",
      },
      axes: [
        {
          type: "time",
          position: "bottom",
        },
        {
          type: "number",
          position: "left",
        },
      ],
    });
  }, [stats, server.data?.server.name]);

  const getServerInformations = () => {
    return server?.data ? (
      <div className="flex flex-row flex-wrap gap-4 w-full">
        <ServerCard
          key={server.data?.server.id}
          server={server.data.server}
          stat={server.data.stat}
          categories={server.data.categories}
          growthStat={server.data.growthStat}
          isFull={true}
        />
      </div>
    ) : null;
  };

  return (
    <>
      {server.isLoading ? (
        <Loader message="Querying server..." className="min-h-screen" />
      ) : (
        <div className="flex flex-1 flex-col">
          {server.error ? <div className="text-red-500">{server.error.message}</div> : null}
          {isLoading ? (
            <Loader message="Querying server stats..." />
          ) : (
            <div className="w-full h-full flex flex-col flex-1 py-4 gap-4">
              {getServerInformations()}
              <div className="flex flex-col gap-2">
                <div className="flex flex-row gap-2 flex-wrap">
                  <Button
                    className="py-1 px-2 h-fit"
                    onClick={() => setDataRangeInterval("1 Day")}
                    variant={dataRangeInterval === "1 Day" ? "default" : "outline"}
                  >
                    Last 24h
                  </Button>
                  <Button
                    className="py-1 px-2 h-fit"
                    onClick={() => setDataRangeInterval("1 Week")}
                    variant={dataRangeInterval === "1 Week" ? "default" : "outline"}
                  >
                    Last 7 days
                  </Button>
                  <Button
                    className="py-1 px-2 h-fit"
                    onClick={() => setDataRangeInterval("1 Month")}
                    variant={dataRangeInterval === "1 Month" ? "default" : "outline"}
                  >
                    Last 30 days
                  </Button>
                  <Button
                    className="py-1 px-2 h-fit"
                    onClick={() => setDataRangeInterval("6 Months")}
                    variant={dataRangeInterval === "6 Months" ? "default" : "outline"}
                  >
                    Last 6 months
                  </Button>
                  <Button
                    className="py-1 px-2 h-fit"
                    onClick={() => setDataRangeInterval("1 Year")}
                    variant={dataRangeInterval === "1 Year" ? "default" : "outline"}
                  >
                    Last 1 year
                  </Button>
                  <Button
                    className="py-1 px-2 h-fit"
                    onClick={() => setDataRangeInterval("Everything")}
                    variant={dataRangeInterval === "Everything" ? "default" : "outline"}
                  >
                    Everything
                  </Button>
                </div>
                <div className="flex flex-row gap-4 flex-wrap">
                  <Button
                    className="py-1 px-2 h-fit"
                    onClick={() => setDataAggregationInterval(undefined)}
                    variant={dataAggregationInterval === undefined ? "default" : "outline"}
                  >
                    None
                  </Button>
                  <Button
                    className="py-1 px-2 h-fit"
                    onClick={() => setDataAggregationInterval("30 Minutes")}
                    variant={dataAggregationInterval === "30 Minutes" ? "default" : "outline"}
                  >
                    30 Minutes
                  </Button>
                  <Button
                    className="py-1 px-2 h-fit"
                    onClick={() => setDataAggregationInterval("1 Hour")}
                    variant={dataAggregationInterval === "1 Hour" ? "default" : "outline"}
                  >
                    1 Hour
                  </Button>
                  <Button
                    className="py-1 px-2 h-fit"
                    onClick={() => setDataAggregationInterval("2 Hours")}
                    variant={dataAggregationInterval === "2 Hours" ? "default" : "outline"}
                  >
                    2 Hours
                  </Button>
                  <Button
                    className="py-1 px-2 h-fit"
                    onClick={() => setDataAggregationInterval("6 Hours")}
                    variant={dataAggregationInterval === "6 Hours" ? "default" : "outline"}
                  >
                    6 Hours
                  </Button>
                  <Button
                    className="py-1 px-2 h-fit"
                    onClick={() => setDataAggregationInterval("1 Day")}
                    variant={dataAggregationInterval === "1 Day" ? "default" : "outline"}
                  >
                    1 Day
                  </Button>
                </div>
                <div style={{ height: "400px" }} className="shadow-md rounded-md">
                  <AgChartsReact options={options} />
                </div>
              </div>
              {server.data ? (
                <ImprovedCard
                  isLoading={isLoading}
                  key={server.data?.server.name}
                  server={server.data.server}
                  stats={stats}
                  categories={server.data.categories}
                />
              ) : null}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ServerPage;
