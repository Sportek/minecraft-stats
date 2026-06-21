"use client";
import { fetcher, getBaseUrl } from "@/app/_cheatcode";
import DashboardHero from "@/components/account/dashboard-hero";
import DashboardLayout from "@/components/account/dashboard-layout";
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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-1 flex-col items-center justify-center py-10">
          <Loader message="Loading server..." />
        </div>
      </DashboardLayout>
    );
  }

  if (!server) {
    return null;
  }

  return (
    <DashboardLayout>
      <DashboardHero
        title="Edit Server"
        badge="Edit"
        subtitle="Update your server's details and tracking settings."
      />

      {/* Server details */}
      <section className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
        <div className="flex items-center gap-3 border-b border-border px-6 py-4">
          <Icon icon="material-symbols:edit-outline" className="h-5 w-5 shrink-0 text-foreground" />
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-foreground">Server details</h2>
            <p className="text-sm text-muted-foreground">
              Update your server&apos;s details, categories, and languages.
            </p>
          </div>
        </div>
        <div className="px-6 py-5">
          <EditServerForm server={server.server} serverCategories={server.categories} updateServer={mutate} />
        </div>
      </section>
    </DashboardLayout>
  );
};

export default ServerEditPage;
