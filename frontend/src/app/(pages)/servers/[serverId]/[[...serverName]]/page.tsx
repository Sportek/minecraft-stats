"use client";
import { fetcher, getBaseUrl } from "@/app/_cheatcode";
import { getServerStats } from "@/http/server";
import { Category, Server, ServerStat } from "@/types/server";

import Chart from "react-apexcharts";

import Loader from "@/components/loader";
import ServerCard from "@/components/serveur/card";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";
import ImprovedCard from "@/components/serveur/improved-card";
import Head from "next/head";

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

  const [data, setData] = useState<{ playerCount: number; date: string }[]>([]);

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
    setData(
      stats.map((stat) => ({
        playerCount: stat.playerCount,
        date: new Date(stat.createdAt).toLocaleDateString(),
      }))
    );
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
      id: "area-datetime",
      type: "area",
      height: 350,
      zoom: {
        autoScaleYaxis: true,
      },
    },
    colors: ["#0099FF"],
    grid: {
      strokeDashArray: 1,
      borderColor: "#000F1A",
      show: true,
    },
    annotations: {
      xaxis: [
        {
          x: new Date(stats[0]?.createdAt).getTime(),
          borderColor: "#999",
          label: {
            text: "Start",
            orientation: "top",
            style: {
              color: "#fff",
              fontWeight: "bold",
              background: "#0099FF",
              fontSize: "12px",
            },
          },
        },
      ],
    },
    dataLabels: {
      enabled: false,
    },
    markers: {
      size: 0,
    },
    xaxis: {
      type: "datetime",
      min: new Date(stats[0]?.createdAt).getTime(),
      tickAmount: 6,
    },
    tooltip: { 
      x: {
        format: "dd MMM yyyy HH:mm",
      },
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.9,
        stops: [0, 100],
      },
    },
  };

  const state = {
    options,
    series: [
      {
        name: "Player Count",
        data: stats.map((stat) => [new Date(stat.createdAt).getTime(), stat.playerCount]),
      },
    ],
  };

  
  return (
    <>
      <Head>
        <title>{server.data?.server.name} - Statistics</title>
        <meta
          name="description"
          content={`Discover the statistics and tracking details of the server ${server.data?.server.name}.`}
        />
        <meta property="og:title" content={`${server.data?.server.name} - Statistics`} />
        <meta
          property="og:description"
          content={`Discover the statistics and tracking details of the server ${server.data?.server.name}.`}
        />
        <meta property="og:image" content={`${process.env.NEXT_PUBLIC_BACKEND_URL}${server.data?.server.imageUrl}`} />
        <meta property="og:type" content="website" />
      </Head>
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
                <Chart options={state.options} series={state.series} type="area" width="500" height="auto" />
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
