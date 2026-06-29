"use client";

import { useState } from "react";
import useSWR from "swr";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useAuth } from "@/contexts/auth";
import { deleteServer, getMyServers, MyServerItem } from "@/http/server";
import { serverPath } from "@/lib/server-url";
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

const isOnline = (lastOnlineAt: Date | null) =>
  lastOnlineAt ? Date.now() - new Date(lastOnlineAt).getTime() < ONLINE_WINDOW_MS : false;

const MyServersPage = () => {
  const t = useTranslations("Account");
  const { user, getToken } = useAuth();
  const formatter = useFormatter();
  const formatNumber = (value: number) => formatter.number(value);
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
      toast({ title: t("myServers.removedTitle"), description: t("myServers.removedDescription", { name: pendingDelete.server.name }), variant: "success" });
      await mutate();
      setPendingDelete(null);
    } catch (error) {
      toast({
        title: t("myServers.removeErrorTitle"),
        description: error instanceof Error ? error.message : t("myServers.removeErrorDescription"),
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
        title={t("myServers.title")}
        subtitle={t("myServers.subtitle")}
        badge={t("myServers.badge", { count: list.length })}
        action={
          <Link href="/account/add-server">
            <Button variant="accent" size="sm">
              <Icon icon="material-symbols:add-rounded" className="mr-1 h-4 w-4" />
              {t("myServers.addServer")}
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DashboardStatTile label={t("myServers.totalServers")} value={formatNumber(list.length)} />
        <DashboardStatTile label={t("myServers.onlineNow")} value={formatNumber(onlineCount)} dot="success" />
        <DashboardStatTile label={t("myServers.offline")} value={formatNumber(list.length - onlineCount)} dot="muted" />
        <DashboardStatTile label={t("myServers.playersTracked")} value={formatNumber(playersTracked)} />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">{t("myServers.trackedServers")}</h2>
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
              <p className="text-sm font-semibold text-foreground">{t("myServers.emptyTitle")}</p>
              <p className="text-xs text-muted-foreground">{t("myServers.emptyDescription")}</p>
            </div>
            <Link href="/account/add-server">
              <Button variant="accent" size="sm">
                <Icon icon="material-symbols:add-rounded" className="mr-1 h-4 w-4" />
                {t("myServers.addFirst")}
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
                      href={serverPath(server.id, server.name)}
                      className="block truncate text-sm font-semibold text-foreground transition-colors hover:text-accent"
                    >
                      {server.name}
                    </Link>
                    <div className="truncate font-mono text-xs text-muted-foreground">{server.address}</div>
                  </div>
                  <Badge variant={online ? "success" : "secondary"} className="gap-1.5">
                    <span className={online ? "h-1.5 w-1.5 rounded-full bg-current" : "h-1.5 w-1.5 rounded-full bg-muted-foreground"} />
                    {online ? t("myServers.online") : t("myServers.offlineStatus")}
                  </Badge>
                  <div className="w-20 text-right">
                    <div className="text-sm font-bold tabular-nums text-foreground">
                      {formatNumber(server.lastPlayerCount ?? 0)}
                    </div>
                    <div className="text-[11px] text-muted-foreground">{t("myServers.peak", { count: formatNumber(server.peakPlayerCount ?? 0) })}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link
                      href={serverPath(server.id, server.name)}
                      aria-label={t("myServers.view")}
                      title={t("myServers.viewTitle")}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      <Icon icon="material-symbols:visibility-outline" className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/servers/${server.id}/edit`}
                      aria-label={t("myServers.edit")}
                      title={t("myServers.editTitle")}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      <Icon icon="material-symbols:edit-outline" className="h-4 w-4" />
                    </Link>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setPendingDelete(item)}
                        aria-label={t("myServers.delete")}
                        title={t("myServers.deleteTitle")}
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
            <DialogTitle>{t("myServers.dialogTitle")}</DialogTitle>
            <DialogDescription>
              {pendingDelete
                ? t.rich("myServers.dialogDescription", {
                    name: pendingDelete.server.name,
                    b: (chunks) => <span className="font-medium text-foreground">{chunks}</span>,
                  })
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)} disabled={isDeleting}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? t("myServers.removing") : t("myServers.remove")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default MyServersPage;
