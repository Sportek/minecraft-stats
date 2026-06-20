"use client";
import { fetcher, getBaseUrl } from "@/app/_cheatcode";
import EditServerForm from "@/components/form/edit-server-form";
import Loader from "@/components/loader";
import { Category, Server, ServerStat } from "@/types/server";
import { useParams } from "next/navigation";
import useSWR from "swr";

const ServerEditPage = () => {
  const { serverId } = useParams();

  const { data: server, isLoading, mutate } = useSWR<{ server: Server; stats: ServerStat[]; categories: Category[] }>(
    `${getBaseUrl()}/servers/${serverId}`,
    fetcher
  );

  return isLoading ? (
    <div className="flex flex-col items-center justify-center h-full flex-1 py-8">
      <Loader message="Loading server..." />
    </div>
  ) : (
    server && (
      <div className="flex flex-col items-center justify-center h-full flex-1 py-8">
        <div className="bg-zinc-100 dark:bg-zinc-800 shadow-md rounded-md p-4 w-full sm:w-fit gap-4 flex flex-col">
          <h1 className="text-2xl font-bold">Edit Server</h1>
          <div className="flex flex-col gap-2">
            <div className="flex flex-row gap-4">
              <div className="w-screen max-w-2xl">
                <EditServerForm server={server.server} serverCategories={server.categories} updateServer={mutate} />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  );
};

export default ServerEditPage;
