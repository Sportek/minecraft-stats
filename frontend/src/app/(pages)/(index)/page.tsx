"use client";

import { fetcher, getBaseUrl } from "@/app/_cheatcode";
import Loader from "@/components/loader";
import ServerCard from "@/components/serveur/card";
import { Server, ServerStat } from "@/types/server";
import useSWR from "swr";

const Home = () => {
  const { data, error, isLoading } = useSWR<{ server: Server; stat: ServerStat | null }[], Error>(
    `${getBaseUrl()}/servers`,
    fetcher
  );

  return (
    <div className="w-full h-full flex-1 flex flex-col">
      {isLoading && <Loader message="Loading..." />}
      {error && <div>{error.message}</div>}
      {data && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 w-full py-4">
          {data.map((server) => (
            <ServerCard key={server.server.id} server={server.server} stat={server.stat} />
          ))}
        </div>
      )}
    </div>
  );
};
export default Home;
