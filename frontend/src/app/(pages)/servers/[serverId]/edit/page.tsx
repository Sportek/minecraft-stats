"use client";
import EditServerForm from "@/components/form/edit-server-form";
import Loader from "@/components/loader";
import { getServer } from "@/http/server";
import { Category, Server, ServerStat } from "@/types/server";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const ServerEditPage = () => {
  const { serverId } = useParams();

  const [server, setServer] = useState<{ server: Server; stat: ServerStat; categories: Category[] }>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);


  const updateServer = useCallback(async () => {
    try {
      const server = await getServer(Number(serverId));
      setServer(server);
    } catch (error) {
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [serverId]);

  useEffect(() => {
    updateServer();
  }, [updateServer]);


  return isLoading ? (
    <div className="flex flex-col items-center justify-center h-full flex-1 py-8">
      <Loader message="Loading server..." />
    </div>
  ) : (
    server && (
      <div className="flex flex-col items-center justify-center h-full flex-1 py-8">
        <div className="bg-zinc-100 shadow-md rounded-md p-4 w-full sm:w-fit gap-4 flex flex-col">
          <h1 className="text-2xl font-bold">Edit Server</h1>
          <div className="flex flex-col gap-2">
            <div className="flex flex-row gap-4">
              <div className="w-screen max-w-2xl">
                <EditServerForm server={server.server} serverCategories={server.categories} updateServer={updateServer} />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  );
};

export default ServerEditPage;