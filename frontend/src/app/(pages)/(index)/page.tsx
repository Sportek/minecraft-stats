"use client";

import { fetcher } from "@/app/_cheatcode";
import Loader from "@/components/loader";
import { ResearchInput } from "@/components/research";
import ServerCard from "@/components/serveur/card";
import StatCard from "@/components/serveur/stat-card";
import { FancyMultiSelect } from "@/components/ui/multi-select";
import { Category, Server, ServerStat } from "@/types/server";
import { Icon } from "@iconify/react/dist/iconify.js";
import { AgChartsReact } from "ag-charts-react";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { AgChartOptions } from "ag-charts-community";
import { getServerStats } from "@/http/server";
import { useFavorite } from "@/contexts/favorite";

const Home = () => {
  const { data, error, isLoading } = useSWR<
    { server: Server; stat: ServerStat | null; categories: Category[] }[],
    Error
  >(`${process.env.NEXT_PUBLIC_API_URL}/servers`, fetcher, {
    refreshInterval: 1000 * 60 * 2,
  });

  const serversStats = useSWR<{totalRecords: number}>(`${process.env.NEXT_PUBLIC_API_URL}/website-stats`, fetcher, {
    refreshInterval: 1000 * 60 * 2,
  });

  const categories = useSWR<Category[], Error>(`${process.env.NEXT_PUBLIC_API_URL}/categories`, fetcher);

  const searchRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [serversToShow, setServersToShow] = useState<{ server: Server; stat: ServerStat | null; categories: Category[] }[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const { favorites } = useFavorite();

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
        });

      const sortedData = filteredData?.toSorted((b, a) => {
        return (a.stat?.playerCount ?? 0) - (b.stat?.playerCount ?? 0);
      });

      const favoriteServers = sortedData.filter((server) => favorites.includes(server.server.id));
      const nonFavoriteServers = sortedData.filter((server) => !favorites.includes(server.server.id));

      setServersToShow([...favoriteServers, ...nonFavoriteServers]);
    }
  }, [data, searchTerm, selectedCategories, favorites]);

  const [options, setOptions] = useState<AgChartOptions>();
  const [serverStatistics, setServerStatistics] = useState<{
    serverName: string;
    serverId: number;
    stat: ServerStat[];
  }[]>([]);
  const [serversLoading, setServersLoading] = useState<boolean>(false);
  const [serverStatisticsToShow, setServerStatisticsToShow] = useState<{
    serverName: string;
    serverId: number;
    stat: ServerStat[];
  }[]>([]);


   useEffect(() => {
     async function fetchServerStats(serverId: number, serverName: string) {
       const stats = await getServerStats(serverId, Date.now() - 1000 * 60 * 60 * 24, Date.now());
       return { serverName: serverName, serverId: serverId, stat: stats };
     }

     if (!data) return;

     setServersLoading(true);

     (async () => {
       const statsData = await Promise.all(
         data.map(async (server) => await fetchServerStats(server.server.id, server.server.name))
       );
       setServerStatistics(statsData);
       setServersLoading(false);
     })();
   }, [data]);

   useEffect(() => {

    const selectedServers =
      favorites.length > 0
        ? favorites
        : serverStatistics.slice(0, Math.min(serverStatistics.length, 5)).map((serv) => serv.serverId);

    setServerStatisticsToShow(serverStatistics.filter((server) => selectedServers.includes(server.serverId)));
   }, [serverStatistics, favorites]);

  useEffect(() => {
    if (!serverStatisticsToShow) return;


    setOptions({
      title: {
        text: "Multiple server statistics",
      },
      series: serverStatisticsToShow.map((server) => ({
        type: "line",
        marker: {
          enabled: false,
        },
        xKey: "time",
        yKey: "playerCount",
        lineDashOffset: 0,
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
      legend: {
        enabled: false,
      },
    });
  }, [serverStatisticsToShow]);

  return (
      <main className="w-full h-full flex flex-col flex-1 py-4 gap-4">
        {isLoading || categories.isLoading || serversStats.isLoading ? <Loader message="Loading..." /> : null}
        {error && <div>{error.message}</div>}
        {data && (
          <>
            <div className="w-full flex flex-col sm:flex-row gap-2 justify-around">
              <StatCard
                title="Total amount of players"
                value={data.reduce((acc, curr) => acc + (curr.stat?.playerCount ?? 0), 0).toString()}
                icon={<Icon icon="mdi:account-multiple" className="text-blue-700 w-6 h-6" />}
              />
              <StatCard
                title="Amount of data"
                value={serversStats.data?.totalRecords.toString() ?? "0"}
                icon={<Icon icon="material-symbols:database" className="text-red-700 w-6 h-6" />}
              />
            </div>
            <div style={{ height: "400px" }} className="shadow-md rounded-md">
              {options && <AgChartsReact options={options} />}
            </div>
            <div className="bg-zinc-200 p-4 rounded-lg w-full flex lg:flex-row flex-col gap-2 items-stretch">
              <ResearchInput placeholder="Search a server" ref={searchRef} onChange={handleSearchChange} />
              <div className="flex flex-row gap-2 w-full items-center bg-white rounded-md px-3">
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
