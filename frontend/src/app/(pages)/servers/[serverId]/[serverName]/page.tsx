"use client";
import { fetcher, getBaseUrl } from "@/app/_cheatcode";
import { getServerStats } from "@/http/server";
import { Server, ServerStat } from "@/types/server";
import { AgChartsReact } from "ag-charts-react";

import Loader from "@/components/loader";
import { AgChartOptions } from "ag-charts-community";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";

const ServerPage = () => {
  const { serverId } = useParams();
  const server = useSWR<Server, Error>(`${getBaseUrl()}/servers/${serverId}`, fetcher);

  const intervalType = {
    "1 Day": Date.now() - 1000 * 60 * 60 * 24,
    "1 Week": Date.now() - 1000 * 60 * 60 * 24 * 7,
    "1 Month": Date.now() - 1000 * 60 * 60 * 24 * 30,
    "6 Months": Date.now() - 1000 * 60 * 60 * 24 * 30 * 6,
    "1 Year": Date.now() - 1000 * 60 * 60 * 24 * 30 * 12,
  };

  const [intervalChoice, setIntervalChoice] = useState<number>(intervalType["1 Day"]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [stats, setStats] = useState<ServerStat[]>([]);
  const [options, setOptions] = useState<AgChartOptions>({});

  useEffect(() => {
    setIsLoading(true);
    getServerStats(Number(serverId), intervalChoice, Date.now()).then((stats) => {
      setStats(stats);
      setIsLoading(false);
    });
  }, [serverId, intervalChoice]);

  useEffect(() => {
    setOptions({
      title: {
        text: server.data?.name,
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
  }, [stats, server.data?.name]);

  const getServerInformations = () => {
    return (
      <div className="bg-zinc-200 p-4 rounded-lg">
        <div className="flex flex-col">
          <h1>{server.data?.name}</h1>
          <p>{server.data?.address}</p>
          <p>{server.data?.port}</p>
          <p>{server.data?.user?.username}</p>
        </div>
      </div>
    );
  };

  return server.isLoading ? (
    <Loader message="Querying server..." />
  ) : (
    <div className="flex flex-1 flex-col">
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
