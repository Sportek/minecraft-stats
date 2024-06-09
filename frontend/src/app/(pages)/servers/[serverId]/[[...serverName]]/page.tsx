"use client";
import { fetcher, getBaseUrl } from "@/app/_cheatcode";
import { getServerStats } from "@/http/server";
import { Category, Server, ServerStat } from "@/types/server";
import { AgChartsReact } from "ag-charts-react";

import Loader from "@/components/loader";
import ServerCard from "@/components/serveur/card";
import { AgChartOptions } from "ag-charts-community";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";

const ServerPage = () => {
  const { serverId } = useParams();
  const server = useSWR<{ server: Server; stat: ServerStat; categories: Category[] }, Error>(`${getBaseUrl()}/servers/${serverId}`, fetcher, {
    refreshInterval: 1000 * 60 * 2,
  });

  const intervalType = {
    "1 Day": Date.now() - 1000 * 60 * 60 * 24,
    "1 Week": Date.now() - 1000 * 60 * 60 * 24 * 7,
    "1 Month": Date.now() - 1000 * 60 * 60 * 24 * 30,
    "6 Months": Date.now() - 1000 * 60 * 60 * 24 * 30 * 6,
    "1 Year": Date.now() - 1000 * 60 * 60 * 24 * 30 * 12,
  };

  const [intervalChoice, setIntervalChoice] = useState<number>(intervalType["1 Week"]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [stats, setStats] = useState<ServerStat[]>([]);
  const [options, setOptions] = useState<AgChartOptions>({});

  useEffect(() => {

    function fetchServerStats() {
      getServerStats(Number(serverId), intervalChoice, Date.now()).then((stats) => {
        setStats(stats);
      });
    }

    setIsLoading(true);
    fetchServerStats();
    setIsLoading(false);

    setInterval(() => {
      fetchServerStats();
    }, 1000 * 60 * 2);
  }, [serverId, intervalChoice]);

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
      <ServerCard key={server.data?.server.id} server={server.data.server} stat={server.data.stat} categories={server.data.categories} />
    ) : null;
  };

  return server.isLoading ? (
    <Loader message="Querying server..." />
  ) : (
    <div className="flex flex-1 flex-col">
      {server.error ? <div className="text-red-500">{server.error.message}</div> : null}
      {isLoading ? (
        <Loader message="Querying server stats..." />
      ) : (
        <div className="w-full h-full flex flex-col flex-1 py-4 gap-4">
          {getServerInformations()}
          <div style={{ height: "400px" }}>
            <AgChartsReact options={options} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ServerPage;
