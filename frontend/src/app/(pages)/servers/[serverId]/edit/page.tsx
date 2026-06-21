"use client";
import { fetcher, getBaseUrl } from "@/app/_cheatcode";
import EditServerForm from "@/components/form/edit-server-form";
import Loader from "@/components/loader";
import { Category, Server, ServerStat } from "@/types/server";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useParams } from "next/navigation";
import useSWR from "swr";

const ServerEditPage = () => {
  const { serverId } = useParams();

  const { data: server, isLoading, mutate } = useSWR<{ server: Server; stats: ServerStat[]; categories: Category[] }>(
    `${getBaseUrl()}/servers/${serverId}`,
    fetcher
  );

  return isLoading ? (
    <div className="flex flex-1 flex-col items-center justify-center py-10">
      <Loader message="Loading server..." />
    </div>
  ) : (
    server && (
      <div className="flex flex-1 flex-col items-center justify-center py-10">
        <div className="w-full max-w-2xl rounded-lg border border-border bg-card text-card-foreground shadow-xs">
          <div className="flex flex-col gap-2 border-b border-border px-6 py-5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/10 text-accent">
                <Icon icon="material-symbols:edit-outline" className="h-4 w-4" />
              </div>
              <h1 className="text-lg font-semibold text-foreground">Edit server</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Update your server&apos;s details, categories, and languages.
            </p>
          </div>

          <div className="p-6">
            <EditServerForm server={server.server} serverCategories={server.categories} updateServer={mutate} />
          </div>
        </div>
      </div>
    )
  );
};

export default ServerEditPage;
