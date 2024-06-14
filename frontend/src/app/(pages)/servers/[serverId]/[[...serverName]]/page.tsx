"use client";
import { fetcher, getBaseUrl } from "@/app/_cheatcode";
import { getServerStats } from "@/http/server";
import { Category, Server, ServerStat } from "@/types/server";

import Chart from 'react-apexcharts'

import Loader from "@/components/loader";
import ServerCard from "@/components/serveur/card";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";
import ImprovedCard from "@/components/serveur/improved-card";

const ServerPage = () => {
  const { serverId } = useParams();
  const server = useSWR<{ server: Server; stat: ServerStat; categories: Category[] }, Error>(
    `${getBaseUrl()}/servers/${serverId}`,
    fetcher,
    {
      refreshInterval: 1000 * 60 * 2,
    }
  );

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
  // const [options, setOptions] = useState<AgChartOptions>({});
  const [data, setData] = useState<{ playerCount: number, date: string}[]>([]);

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
    setData(stats.map((stat) => ({
      playerCount: stat.playerCount,
      date: stat.createdAt as unknown as string,
    })));

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

  const options: ApexCharts.ApexOptions = {
    chart: {
      height: 350,
      type: "line",
      zoom: {
        enabled: true,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "straight",
    },
    title: {
      text: "Player Count",
      align: "center",
    },
    grid: {
      row: {
        colors: ["#f3f3f3", "transparent"], // takes an array which will be repeated on columns
        opacity: 0.5,
      },
    },
    xaxis: {
      categories: data.map((d) => d.date),
    },
  };

  const state = {
    options,
    series: [
      {
        name: "Desktops",
        data: data.map((d) => d.playerCount),
      },
    ],
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
              <div style={{ height: "400px" }}>
                {/* <AgChartsReact options={options} /> */}
                <Chart options={state.options} series={state.series} type="line" width="500" height="auto" />
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
