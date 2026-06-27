"use client";

import DashboardHero from "@/components/account/dashboard-hero";
import DashboardLayout from "@/components/account/dashboard-layout";
import DashboardStatTile from "@/components/account/dashboard-stat-tile";
import { AdminBackLink } from "@/components/admin/admin-back-link";
import { AdminLoadingState, AdminMessageState } from "@/components/admin/admin-states";
import ServerImage from "@/components/serveur/card/server-image";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth";
import { AdminUserDetailResponse, getAdminUserDetail } from "@/http/user";
import { RegistrationProvider } from "@/types/auth";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const ONLINE_WINDOW_MS = 1000 * 60 * 30;

const isOnline = (lastOnlineAt: string | Date | null) =>
  lastOnlineAt ? Date.now() - new Date(lastOnlineAt).getTime() < ONLINE_WINDOW_MS : false;

const getRoleBadgeVariant = (role: string): BadgeProps["variant"] => {
  switch (role) {
    case "admin":
      return "destructive";
    case "writer":
      return "accent";
    default:
      return "secondary";
  }
};

/** Human-readable registration method derived from the OAuth provider (null = email & password). */
const getRegistration = (provider: RegistrationProvider, emailPasswordLabel: string) => {
  switch (provider) {
    case "discord":
      return { label: "Discord", icon: "ic:baseline-discord" };
    case "google":
      return { label: "Google", icon: "logos:google-icon" };
    default:
      return { label: emailPasswordLabel, icon: "material-symbols:mail-outline" };
  }
};

const InfoRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
    <span className="text-sm text-foreground">{children}</span>
  </div>
);

const AdminUserDetailPage = () => {
  const { user, getToken } = useAuth();
  const t = useTranslations("Admin");
  const formatter = useFormatter();
  const formatNumber = (value: number) => formatter.number(value);
  const formatDate = (value: string | Date) =>
    formatter.dateTime(new Date(value), { year: "numeric", month: "short", day: "numeric" });
  const token = getToken();
  const params = useParams();
  const userId = Number(params.id);

  const [detail, setDetail] = useState<AdminUserDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !Number.isFinite(userId)) return;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        setDetail(await getAdminUserDetail(userId, token));
      } catch (err) {
        setError(err instanceof Error ? err.message : t("users.detail.loadError"));
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [token, userId, t]);

  if (!user) {
    return <AdminLoadingState label={t("states.loading")} />;
  }

  if (user.role !== "admin") {
    return (
      <AdminMessageState
        tone="destructive"
        title={t("states.accessDenied")}
        description={t("states.adminOnly")}
      />
    );
  }

  const profile = detail?.user;
  const servers = detail?.servers ?? [];
  const duplicates = detail?.duplicates ?? [];
  const registration = profile
    ? getRegistration(profile.provider, t("users.detail.emailPassword"))
    : null;
  const onlineCount = servers.filter((s) => isOnline(s.lastOnlineAt)).length;
  const playersTracked = servers.reduce((total, s) => total + (s.lastPlayerCount ?? 0), 0);

  return (
    <DashboardLayout>
      <div>
        <AdminBackLink href="/admin/users" label={t("users.backToUsers")} />
      </div>

      <DashboardHero
        title={profile ? profile.username : t("users.detail.fallbackTitle")}
        subtitle={profile ? t("users.detail.subtitle") : t("users.detail.loadingSubtitle")}
        badge={profile ? t(`users.roles.${profile.role}`) : undefined}
        avatar={profile ? { name: profile.username, src: profile.avatarUrl } : undefined}
      />

      {error ? (
        <AdminMessageState tone="destructive" title={t("users.detail.couldNotLoad")} description={error} />
      ) : loading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : !profile ? (
        <AdminMessageState
          tone="destructive"
          title={t("users.detail.notFoundTitle")}
          description={t("users.detail.notFoundDescription")}
        />
      ) : (
        <>
          {/* Stat tiles */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <DashboardStatTile label={t("users.detail.tiles.servers")} value={formatNumber(detail?.stats.serverCount ?? 0)} />
            <DashboardStatTile label={t("users.detail.tiles.onlineNow")} value={formatNumber(onlineCount)} dot="success" />
            <DashboardStatTile label={t("users.detail.tiles.offline")} value={formatNumber(servers.length - onlineCount)} dot="muted" />
            <DashboardStatTile label={t("users.detail.tiles.playersTracked")} value={formatNumber(playersTracked)} />
          </div>

          {/* Account info */}
          <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold text-foreground">{t("users.detail.accountInfo")}</h2>
            </div>
            <div className="divide-y divide-border">
              <InfoRow label={t("users.detail.userId")}>
                <span className="font-mono">{profile.id}</span>
              </InfoRow>
              <InfoRow label={t("users.detail.username")}>{profile.username}</InfoRow>
              <InfoRow label={t("users.detail.email")}>
                <a href={`mailto:${profile.email}`} className="text-accent hover:underline">
                  {profile.email}
                </a>
              </InfoRow>
              <InfoRow label={t("users.detail.role")}>
                <Badge variant={getRoleBadgeVariant(profile.role)}>
                  {t(`users.roles.${profile.role}`)}
                </Badge>
              </InfoRow>
              <InfoRow label={t("users.detail.registration")}>
                <span className="inline-flex items-center gap-2">
                  {registration && <Icon icon={registration.icon} className="h-4 w-4" />}
                  {registration?.label}
                </span>
              </InfoRow>
              <InfoRow label={t("users.detail.emailVerified")}>
                <Badge variant={profile.verified ? "success" : "secondary"}>
                  {profile.verified ? t("users.detail.verified") : t("users.detail.notVerified")}
                </Badge>
              </InfoRow>
              <InfoRow label={t("users.detail.joined")}>{formatDate(profile.createdAt)}</InfoRow>
              <InfoRow label={t("users.detail.lastUpdated")}>{formatDate(profile.updatedAt)}</InfoRow>
            </div>
          </div>

          {/* Possible duplicate accounts */}
          <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold text-foreground">
                {t("users.detail.duplicatesTitle")}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({duplicates.length})
                </span>
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">{t("users.detail.duplicatesHelp")}</p>
            </div>

            {duplicates.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                  <Icon icon="material-symbols:fingerprint" className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">{t("users.detail.noDuplicatesTitle")}</p>
                  <p className="text-xs text-muted-foreground">{t("users.detail.noDuplicatesDescription")}</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {duplicates.map((dup) => (
                  <div
                    key={dup.id}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 transition-colors hover:bg-secondary/40"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/users/${dup.id}`}
                        className="block truncate text-sm font-semibold text-foreground transition-colors hover:text-accent"
                      >
                        {dup.username}
                      </Link>
                      <div className="truncate text-xs text-muted-foreground">{dup.email}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {dup.signals.sameDevice && (
                        <Badge variant="destructive" className="gap-1.5">
                          <Icon icon="material-symbols:devices" className="h-3.5 w-3.5" />
                          {t("users.detail.sameDevice")}
                        </Badge>
                      )}
                      {dup.signals.sameIp && (
                        <Badge variant="secondary" className="gap-1.5">
                          <Icon icon="material-symbols:lan-outline" className="h-3.5 w-3.5" />
                          {t("users.detail.sameIp")}
                        </Badge>
                      )}
                    </div>
                    <div className="hidden w-24 text-right text-xs text-muted-foreground sm:block">
                      {formatDate(dup.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Uploaded servers */}
          <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold text-foreground">
                {t("users.detail.uploadedServers")}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({servers.length})
                </span>
              </h2>
            </div>

            {servers.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                  <Icon icon="mynaui:servers" className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">{t("users.detail.noServersTitle")}</p>
                  <p className="text-xs text-muted-foreground">{t("users.detail.noServersDescription")}</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {servers.map((server) => {
                  const online = isOnline(server.lastOnlineAt);
                  return (
                    <div
                      key={server.id}
                      className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4 transition-colors hover:bg-secondary/40"
                    >
                      <ServerImage imageUrl={server.imageUrl ?? ""} name={server.name} className="h-10 w-10" />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/servers/${server.id}/${server.name}`}
                          className="block truncate text-sm font-semibold text-foreground transition-colors hover:text-accent"
                        >
                          {server.name}
                        </Link>
                        <div className="truncate font-mono text-xs text-muted-foreground">
                          {server.address}
                          {server.port !== 25565 ? `:${server.port}` : ""}
                        </div>
                      </div>
                      <Badge variant={online ? "success" : "secondary"} className="gap-1.5">
                        <span
                          className={
                            online
                              ? "h-1.5 w-1.5 rounded-full bg-current"
                              : "h-1.5 w-1.5 rounded-full bg-muted-foreground"
                          }
                        />
                        {online ? t("users.detail.online") : t("users.detail.offlineStatus")}
                      </Badge>
                      <div className="w-20 text-right">
                        <div className="text-sm font-bold tabular-nums text-foreground">
                          {formatNumber(server.lastPlayerCount ?? 0)}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {t("users.detail.peak", { count: formatNumber(server.peakPlayerCount ?? 0) })}
                        </div>
                      </div>
                      <div className="hidden w-24 text-right text-xs text-muted-foreground sm:block">
                        {formatDate(server.createdAt)}
                      </div>
                      <Link
                        href={`/servers/${server.id}/${server.name}`}
                        aria-label={t("users.detail.viewServer")}
                        title={t("users.detail.view")}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        <Icon icon="material-symbols:visibility-outline" className="h-4 w-4" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default AdminUserDetailPage;
