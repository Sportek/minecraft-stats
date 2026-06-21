"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useAuth } from "@/contexts/auth";
import { deleteServer, getMyServers, MyServerItem } from "@/http/server";
import DashboardLayout from "@/components/account/dashboard-layout";
import DashboardHero from "@/components/account/dashboard-hero";
import DashboardStatTile from "@/components/account/dashboard-stat-tile";
import ServerImage from "@/components/serveur/card/server-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

const ONLINE_WINDOW_MS = 1000 * 60 * 30;
const formatNumber = (value: number) => new Intl.NumberFormat("en-US").format(value);

const isOnline = (lastOnlineAt: Date | null) =>
  lastOnlineAt ? Date.now() - new Date(lastOnlineAt).getTime() < ONLINE_WINDOW_MS : false;

const MyServersPage = () => {
  const { user, getToken } = useAuth();
  const token = getToken();
  const isAdmin = user?.role === "admin";
  const { toast } = useToast();

  const {
    data: servers,
    isLoading,
    mutate,
  } = useSWR<MyServerItem[]>(token ? ["my-servers", token] : null, () => getMyServers(token ?? ""));

  const [pendingDelete, setPendingDelete] = useState<MyServerItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await deleteServer(pendingDelete.server.id, token ?? "");
      toast({ title: "Server removed", description: `${pendingDelete.server.name} is no longer tracked.`, variant: "success" });
      await mutate();
      setPendingDelete(null);
    } catch (error) {
      toast({
        title: "Could not remove server",
        description: error instanceof Error ? error.message : "An error occurred.",
        variant: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const list = servers ?? [];
  const onlineCount = list.filter((item) => isOnline(item.server.lastOnlineAt)).length;
  const playersTracked = list.reduce((total, item) => total + (item.server.lastPlayerCount ?? 0), 0);

  return (
    <DashboardLayout>
      <DashboardHero
        title="My Servers"
        subtitle="Servers you own and track live stats for."
        badge={`${list.length} tracked`}
        action={
          <Link href="/account/add-server">
            <Button variant="accent" size="sm">
              <Icon icon="material-symbols:add-rounded" className="mr-1 h-4 w-4" />
              Add Server
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DashboardStatTile label="Total Servers" value={formatNumber(list.length)} />
        <DashboardStatTile label="Online Now" value={formatNumber(onlineCount)} dot="success" />
        <DashboardStatTile label="Offline" value={formatNumber(list.length - onlineCount)} dot="muted" />
        <DashboardStatTile label="Players Tracked" value={formatNumber(playersTracked)} />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">Tracked servers</h2>
        </div>

        {isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="h-10 w-10 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <Icon icon="mynaui:servers" className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">No servers yet</p>
              <p className="text-xs text-muted-foreground">Add a server to start tracking its player count.</p>
            </div>
            <Link href="/account/add-server">
              <Button variant="accent" size="sm">
                <Icon icon="material-symbols:add-rounded" className="mr-1 h-4 w-4" />
                Add your first server
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {list.map((item) => {
              const { server } = item;
              const online = isOnline(server.lastOnlineAt);
              return (
                <div key={server.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4 transition-colors hover:bg-secondary/40">
                  <ServerImage imageUrl={server.imageUrl} name={server.name} className="h-10 w-10" />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/servers/${server.id}/${server.name}`}
                      className="block truncate text-sm font-semibold text-foreground transition-colors hover:text-accent"
                    >
                      {server.name}
                    </Link>
                    <div className="truncate font-mono text-xs text-muted-foreground">{server.address}</div>
                  </div>
                  <Badge variant={online ? "success" : "secondary"} className="gap-1.5">
                    <span className={online ? "h-1.5 w-1.5 rounded-full bg-current" : "h-1.5 w-1.5 rounded-full bg-muted-foreground"} />
                    {online ? "Online" : "Offline"}
                  </Badge>
                  <div className="w-20 text-right">
                    <div className="text-sm font-bold tabular-nums text-foreground">
                      {formatNumber(server.lastPlayerCount ?? 0)}
                    </div>
                    <div className="text-[11px] text-muted-foreground">peak {formatNumber(server.lastMaxCount ?? 0)}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/servers/${server.id}/${server.name}`}
                      aria-label="View server"
                      title="View"
                      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      <Icon icon="material-symbols:visibility-outline" className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/servers/${server.id}/edit`}
                      aria-label="Edit server"
                      title="Edit"
                      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      <Icon icon="material-symbols:edit-outline" className="h-4 w-4" />
                    </Link>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setPendingDelete(item)}
                        aria-label="Delete server"
                        title="Delete"
                        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Icon icon="material-symbols:delete-outline" className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stop tracking this server?</DialogTitle>
            <DialogDescription>
              {pendingDelete ? (
                <>
                  <span className="font-medium text-foreground">{pendingDelete.server.name}</span> will be removed
                  from your dashboard along with its tracking. This action cannot be undone.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? "Removing…" : "Remove server"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default MyServersPage;
