"use client";

import { fetcher, getBaseUrl } from "@/app/_cheatcode";
import Loader from "@/components/loader";
import ServerCard from "@/components/serveur/card";
import { Server, ServerStat } from "@/types/server";
import useSWR from "swr";

const Home = () => {
  const { data, error, isLoading } = useSWR<{ server: Server; stat: ServerStat | null }[], Error>(
    `${getBaseUrl()}/servers`,
    fetcher,
    {
      refreshInterval: 1000 * 60 * 2,
    }
  );

  return (
    <div className="w-full h-full flex flex-col flex-1 py-4 gap-4">
      {isLoading && <Loader message="Loading..." />}
      {error && <div>{error.message}</div>}
      {data && (
        <div className="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 py-4 w-full truncate">
          {data.map((server) => (
            <ServerCard key={server.server.id} server={server.server} stat={server.stat} />
          ))}
        </div>
      )}
    </div>
  );
};
export default Home;
