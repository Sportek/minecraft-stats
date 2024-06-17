"use client";
import { fetcher, getBaseUrl } from "@/app/_cheatcode";
import { getServerStats } from "@/http/server";
import { Category, Server, ServerStat } from "@/types/server";
import { AgChartsReact } from "ag-charts-react";

import Loader from "@/components/loader";
import ServerCard from "@/components/serveur/card";
import { AgChartOptions } from "ag-charts-community";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import ImprovedCard from "@/components/serveur/improved-card";
import { Button } from "@/components/ui/button";


const ServerPage = () => {
  const { serverId } = useParams();
  const server = useSWR<{ server: Server; stat: ServerStat; categories: Category[] }, Error>(
    `${getBaseUrl()}/servers/${serverId}`,
    fetcher,
    {
      refreshInterval: 1000 * 60 * 2,
    }
  );

  const intervalType = useMemo(() => {
    return {
      "1 Day": Date.now() - 1000 * 60 * 60 * 24,
      "1 Week": Date.now() - 1000 * 60 * 60 * 24 * 7,
      "1 Month": Date.now() - 1000 * 60 * 60 * 24 * 30,
      "6 Months": Date.now() - 1000 * 60 * 60 * 24 * 30 * 6,
      "1 Year": Date.now() - 1000 * 60 * 60 * 24 * 30 * 12,
      "Everything": Date.now() - 1000 * 60 * 60 * 24 * 30 * 12 * 5,
    };
  }, [])

  const [intervalChoice, setIntervalChoice] = useState<keyof typeof intervalType>("1 Week");

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [stats, setStats] = useState<ServerStat[]>([]);
  const [options, setOptions] = useState<AgChartOptions>({});

  useEffect(() => {
    function fetchServerStats() {
      getServerStats(Number(serverId), intervalType[intervalChoice], Date.now()).then((stats) => {
        setStats(stats);
      });
    }

    setIsLoading(true);
    fetchServerStats();
    setIsLoading(false);

    setInterval(() => {
      fetchServerStats();
    }, 1000 * 60 * 2);
  }, [serverId, intervalChoice, intervalType]);

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
          xKey: "time",
          yKey: "playerCount",
        },
      ],
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
        />
      </div>
    ) : null;
  };

  return (
    <>
      {server.isLoading ? (
        <Loader message="Querying server..." />
      ) : (
        <div className="flex flex-1 flex-col">
          {server.error ? <div className="text-red-500">{server.error.message}</div> : null}
          {isLoading ? (
            <Loader message="Querying server stats..." />
          ) : (
            <div className="w-full h-full flex flex-col flex-1 py-4 gap-4">
              {getServerInformations()}
              <div className="flex flex-col gap-4">
                <div className="flex flex-row gap-4 flex-wrap">
                  <Button onClick={() => setIntervalChoice("1 Day")} variant={intervalChoice === "1 Day" ? "default" : "outline"}>Last 24h</Button>
                  <Button onClick={() => setIntervalChoice("1 Week")} variant={intervalChoice === "1 Week" ? "default" : "outline"}>Last 7 days</Button>
                  <Button onClick={() => setIntervalChoice("1 Month")} variant={intervalChoice === "1 Month" ? "default" : "outline"}>Last 30 days</Button>
                  <Button onClick={() => setIntervalChoice("6 Months")} variant={intervalChoice === "6 Months" ? "default" : "outline"}>Last 6 months</Button>
                  <Button onClick={() => setIntervalChoice("1 Year")} variant={intervalChoice === "1 Year" ? "default" : "outline"}>Last 1 year</Button>
                  <Button onClick={() => setIntervalChoice("Everything")} variant={intervalChoice === "Everything" ? "default" : "outline"}>Everything</Button>
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
