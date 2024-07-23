"use client";

import { fetcher } from "@/app/_cheatcode";
import Loader from "@/components/loader";
import { ResearchInput } from "@/components/research";
import ServerCard from "@/components/serveur/card";
import StatCard from "@/components/serveur/stat-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FancyMultiSelect } from "@/components/ui/multi-select";
import { useFavorite } from "@/contexts/favorite";
import { getServerStats } from "@/http/server";
import { Category, Server, ServerStat } from "@/types/server";
import { Icon } from "@iconify/react/dist/iconify.js";
import { AgChartOptions } from "ag-charts-community";
import { AgChartsReact } from "ag-charts-react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";

export interface ServerData {
  server: Server;
  stat: ServerStat | null;
  categories: Category[];
}

const DATA_AGGREGATION_INTERVAL_TYPES = {
  "30 Minutes": "30 minutes",
  "1 Hour": "1 hour",
  "2 Hours": "2 hours",
  "6 Hours": "6 hours",
  "1 Day": "1 day",
  "1 Week": "1 week",
};

const Home = () => {
  const { data, error, isLoading } = useSWR<ServerData[], Error>(
    `${process.env.NEXT_PUBLIC_API_URL}/servers`,
    fetcher,
    {
      refreshInterval: 1000 * 60 * 2,
    }
  );

  const generalWebsiteStats = useSWR<{ totalRecords: number }>(
    `${process.env.NEXT_PUBLIC_API_URL}/website-stats`,
    fetcher,
    {
      refreshInterval: 1000 * 60 * 2,
    }
  );

  const categories = useSWR<Category[], Error>(`${process.env.NEXT_PUBLIC_API_URL}/categories`, fetcher);

  const searchRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [serversToShow, setServersToShow] = useState<ServerData[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const [serverToDisplayInGraph, setServerToDisplayInGraph] = useState<ServerData[]>([]);

  const [showZeroPlayer, setShowZeroPlayer] = useState<boolean>(false);

  const handleShowZeroPlayerChange = (checked: boolean) => {
    setShowZeroPlayer(checked);
  };

  const { favorites } = useFavorite();

  // On filtre les serveurs en fonction de différents paramètres :
  // - La recherche
  // - Les catégories
  // - Le nombre de joueurs
  // - Les serveurs favoris
  useEffect(() => {
    if (data) {
      const filteredData = data
        ?.filter(
          (server) =>
            server.server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            server.server.address.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .filter((server) => {
          return (
            selectedCategories.length === 0 ||
            server.categories.some((category) => selectedCategories.includes(category.id.toString()))
          );
        })
        .filter((server) => {
          return showZeroPlayer ? true : server.stat?.playerCount !== 0 || server.stat?.playerCount !== null;
        });

      const sortedData = filteredData?.toSorted((b, a) => {
        return (a.stat?.playerCount ?? 0) - (b.stat?.playerCount ?? 0);
      });

      const favoriteServers = sortedData.filter((server) => favorites.includes(server.server.id));
      const nonFavoriteServers = sortedData.filter((server) => !favorites.includes(server.server.id));

      setServersToShow([...favoriteServers, ...nonFavoriteServers]);
    }
  }, [data, searchTerm, selectedCategories, favorites, showZeroPlayer]);

  const [options, setOptions] = useState<AgChartOptions>();
  const [serverStatistics, setServerStatistics] = useState<
    {
      serverName: string;
      serverId: number;
      stat: ServerStat[];
    }[]
  >([]);

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

  const [dataRangeInterval, setDataRangeInterval] = useState<keyof typeof dataRangeIntervalTypes>("1 Day");
  const [dataAggregationInterval, setDataAggregationInterval] =
    useState<keyof typeof DATA_AGGREGATION_INTERVAL_TYPES>("1 Hour");

  // On récupère les stats des serveurs sélectionnés
  useEffect(() => {
    async function fetchServerStats(serverId: number, serverName: string) {
      const stats = await getServerStats(
        serverId,
        dataRangeIntervalTypes[dataRangeInterval],
        Date.now(),
        DATA_AGGREGATION_INTERVAL_TYPES[dataAggregationInterval]
      );
      return { serverName: serverName, serverId: serverId, stat: stats };
    }

    (async () => {
      const statsData = await Promise.all(
        serverToDisplayInGraph.map(async (server) => await fetchServerStats(server.server.id, server.server.name))
      );
      setServerStatistics(statsData);
    })();
  }, [serverToDisplayInGraph, dataRangeInterval, dataAggregationInterval, dataRangeIntervalTypes]);

  // On récupère les serveurs à afficher dans le graphique
  useEffect(() => {
    if (!data) return;
    const servers =
      favorites.length > 0 ? favorites : data.slice(0, Math.min(data.length, 5)).map((server) => server.server.id);
    setServerToDisplayInGraph(data.filter((server) => servers.includes(server.server.id)));
  }, [favorites, data]);

  const { resolvedTheme } = useTheme();

  // On crée les différentes options du graphique
  useEffect(() => {
    if (!serverStatistics) return;

    setOptions({
      title: {
        text: "Multiple server statistics",
      },
      series: serverStatistics.map((server) => ({
        type: "line",
        marker: {
          enabled: false,
        },
        xKey: "time",
        yKey: "playerCount",
        connectMissingData: false,
        yName: server.serverName,
        data: server.stat.map((stat) => ({
          time: new Date(stat.createdAt),
          playerCount: stat.playerCount,
        })),
      })),
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
      theme: resolvedTheme === "dark" ? "ag-default-dark" : "ag-default",
      background: {
        fill: resolvedTheme === "dark" ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.5)",
      },
      legend: {
        enabled: false,
      },
    });
  }, [serverStatistics, resolvedTheme]);

  return (
    <main className="w-full h-full flex flex-col flex-1 py-4 gap-4">
      {isLoading || categories.isLoading || generalWebsiteStats.isLoading ? (
        <Loader message="Loading..." className="min-h-screen flex items-center justify-center" />
      ) : null}
      {error && <div>{error.message}</div>}
      {data && (
        <>
          <div className="w-full flex flex-col sm:flex-row gap-2 justify-around">
            <StatCard
              title="Total amount of online players"
              value={data.reduce((acc, curr) => acc + (curr.stat?.playerCount ?? 0), 0).toString()}
              icon={<Icon icon="mdi:account-multiple" className="text-blue-700 dark:text-blue-300 w-6 h-6" />}
            />
            <StatCard
              title="Amount of rows data"
              value={generalWebsiteStats.data?.totalRecords.toString() ?? "0"}
              icon={<Icon icon="material-symbols:database" className="text-red-700 dark:text-red-300 w-6 h-6" />}
            />
            <StatCard
              title="Amount of monitored servers"
              value={data.length.toString()}
              icon={<Icon icon="mdi:server" className="text-green-700 dark:text-green-300 w-6 h-6" />}
            />
          </div>
          <div className="flex flex-row gap-2 flex-wrap">
            <Button
              className="py-1 px-2 h-fit"
              onClick={() => {
                setDataRangeInterval("1 Day");
                setDataAggregationInterval("30 Minutes");
              }}
              variant={dataRangeInterval === "1 Day" ? "default" : "outline"}
            >
              Last 24h
            </Button>
            <Button
              className="py-1 px-2 h-fit"
              onClick={() => {
                setDataRangeInterval("1 Week");
                setDataAggregationInterval("2 Hours");
              }}
              variant={dataRangeInterval === "1 Week" ? "default" : "outline"}
            >
              Last 7 days
            </Button>
            <Button
              className="py-1 px-2 h-fit"
              onClick={() => {
                setDataRangeInterval("1 Month");
                setDataAggregationInterval("6 Hours");
              }}
              variant={dataRangeInterval === "1 Month" ? "default" : "outline"}
            >
              Last 30 days
            </Button>
          </div>
          <div style={{ height: "400px" }} className="shadow-md rounded-md">
            {options && <AgChartsReact options={options} />}
          </div>
          <div className="flex flex-col gap-2 bg-zinc-200 dark:bg-zinc-800 p-4 rounded-lg w-full">
            <div className="flex lg:flex-row flex-col gap-2 items-stretch">
              <ResearchInput placeholder="Search a server" ref={searchRef} onChange={handleSearchChange} />
              <div className="flex flex-row gap-2 w-full items-center bg-white dark:bg-zinc-900 rounded-md px-3">
                <Icon icon="material-symbols:filter-alt-outline" className="w-6 h-6" />
                <FancyMultiSelect
                  title="Filter by categories"
                  elements={
                    categories.data?.map((category) => ({ value: category.id.toString(), label: category.name })) ?? []
                  }
                  onSelectionChange={setSelectedCategories}
                />
              </div>
            </div>
            <div className="flex flex-row gap-2 items-center justify-center">
              <Checkbox
                id="showZeroPlayer"
                checked={showZeroPlayer}
                onCheckedChange={handleShowZeroPlayerChange}
                aria-labelledby="showZeroPlayerLabel"
              />
              <label id="showZeroPlayerLabel" htmlFor="showZeroPlayer">
                Show servers with no players
              </label>
            </div>
          </div>
          <div className="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            {serversToShow.length > 0 ? (
              serversToShow.map((server) => (
                <ServerCard
                  key={server.server.id}
                  server={server.server}
                  stat={server.stat}
                  categories={server.categories}
                  isFull={false}
                />
              ))
            ) : (
              <div className="w-full text-center md:col-span-2 lg:col-span-3">No servers found</div>
            )}
          </div>
        </>
      )}
    </main>
  );
};
export default Home;
