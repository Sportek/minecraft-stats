"use client";

import { fetcher, getBaseUrl } from "@/app/_cheatcode";
import Loader from "@/components/loader";
import { ResearchInput } from "@/components/research";
import ServerCard from "@/components/serveur/card";
import { Category, Server, ServerStat } from "@/types/server";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";

const Home = () => {
  const { data, error, isLoading } = useSWR<{ server: Server; stat: ServerStat | null; categories: Category[] }[], Error>(
    `${getBaseUrl()}/servers`,
    fetcher,
    {
      refreshInterval: 1000 * 60 * 2,
    }
  );

  const searchRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [serversToShow, setServersToShow] = useState<{ server: Server; stat: ServerStat | null; categories: Category[] }[]>([]);
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  useEffect(() => {
    if (data) {
      const filteredData = data?.filter(
        (server) =>
          server.server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          server.server.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setServersToShow(filteredData ?? []);
      console.log(filteredData);
    }
  }, [data, searchTerm]);

  return (
    <div className="w-full h-full flex flex-col flex-1 py-4 gap-4">
      {isLoading && <Loader message="Loading..." />}
      {error && <div>{error.message}</div>}
      {data && (
        <>
          <div className="bg-zinc-200 p-4 rounded-lg w-full flex gap-4">
            <ResearchInput placeholder="Search a server" ref={searchRef} onChange={handleSearchChange} />
            <div>Show only online</div>
          </div>
          <div className="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 w-full truncate">
            {serversToShow.length > 0 ? (
              serversToShow.map((server) => (
                <ServerCard key={server.server.id} server={server.server} stat={server.stat} categories={server.categories} />
              ))
            ) : (
              <div className="w-full text-center md:col-span-2 lg:col-span-3">No servers found</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
export default Home;
