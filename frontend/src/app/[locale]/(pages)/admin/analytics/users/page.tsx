"use client";

import DashboardHero from "@/components/account/dashboard-hero";
import DashboardLayout from "@/components/account/dashboard-layout";
import DashboardStatTile from "@/components/account/dashboard-stat-tile";
import { ActivityDuration } from "@/components/admin/activity-duration";
import { AdminBackLink } from "@/components/admin/admin-back-link";
import { AdminFilterTabs } from "@/components/admin/admin-filter-tabs";
import { AdminLoadingState, AdminMessageState } from "@/components/admin/admin-states";
import { AvatarTile } from "@/components/ui/avatar-tile";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/auth";
import { getActiveUsers } from "@/http/analytics";
import { Link } from "@/i18n/navigation";
import { ActiveUser, ActiveUsersResponse, ActiveUsersSort } from "@/types/analytics";
import { Search } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const PAGE_SIZE = 20;

type RangeKey = "7d" | "30d" | "90d";

const RANGES: Record<RangeKey, number> = {
  "7d": 7 * 86400000,
  "30d": 30 * 86400000,
  "90d": 90 * 86400000,
};

const SORTS: ActiveUsersSort[] = ["connections", "pageViews", "timeSpent", "lastSeen"];

const EMPTY_TOTALS: ActiveUsersResponse["totals"] = {
  activeUsers: 0,
  connections: 0,
  pageViews: 0,
  connectionsPerUser: 0,
};

/** Colonne chiffrée d'une ligne du classement (masquée sur mobile sauf la première). */
const MetricCell = ({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`w-20 shrink-0 text-right ${className}`}>
    <div className="text-sm font-bold tabular-nums text-foreground">{children}</div>
    <div className="text-[11px] text-muted-foreground">{label}</div>
  </div>
);

const AdminActiveUsersPage = () => {
  const { user, getToken } = useAuth();
  const t = useTranslations("Admin");
  const formatter = useFormatter();
  const formatNumber = (value: number) => formatter.number(value);
  const token = getToken();

  const [data, setData] = useState<ActiveUsersResponse | null>(null);
  const [range, setRange] = useState<RangeKey>("30d");
  const [sort, setSort] = useState<ActiveUsersSort>("connections");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchActiveUsers = async () => {
      try {
        setLoading(true);
        const now = Date.now();
        setData(
          await getActiveUsers(token, {
            fromDate: now - RANGES[range],
            toDate: now,
            page,
            limit: PAGE_SIZE,
            search,
            sort,
          })
        );
      } catch (error) {
        console.error("Failed to fetch active users:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchActiveUsers, 300);
    return () => clearTimeout(debounce);
  }, [token, range, sort, search, page]);

  // Tout changement de filtre repart de la première page : la ligne cherchée est
  // en tête du nouveau tri, pas à l'ancienne position.
  const updateRange = (value: RangeKey) => {
    setRange(value);
    setPage(1);
  };

  const updateSort = (value: ActiveUsersSort) => {
    setSort(value);
    setPage(1);
  };

  const updateSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

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

  const rows: ActiveUser[] = data?.data ?? [];
  const totals = data?.totals ?? EMPTY_TOTALS;
  const lastPage = data?.meta.lastPage ?? 1;

  return (
    <DashboardLayout>
      <div>
        <AdminBackLink href="/admin/analytics" label={t("analytics.activeUsers.backToAnalytics")} />
      </div>

      <DashboardHero
        title={t("analytics.activeUsers.title")}
        subtitle={t("analytics.activeUsers.subtitle")}
        badge={t("analytics.activeUsers.badge", { count: formatNumber(totals.activeUsers) })}
      />

      <AdminFilterTabs
        value={range}
        onChange={updateRange}
        tabs={(Object.keys(RANGES) as RangeKey[]).map((key) => ({
          value: key,
          label: t(`analytics.ranges.${key}`),
        }))}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DashboardStatTile
          label={t("analytics.activeUsers.tiles.activeUsers")}
          value={formatNumber(totals.activeUsers)}
        />
        <DashboardStatTile
          label={t("analytics.activeUsers.tiles.connections")}
          value={formatNumber(totals.connections)}
        />
        <DashboardStatTile
          label={t("analytics.activeUsers.tiles.pageViews")}
          value={formatNumber(totals.pageViews)}
        />
        <DashboardStatTile
          label={t("analytics.activeUsers.tiles.perUser")}
          value={formatNumber(totals.connectionsPerUser)}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {t("analytics.activeUsers.cardTitle")}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("analytics.activeUsers.cardSubtitle")}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={sort} onValueChange={(value) => updateSort(value as ActiveUsersSort)}>
              <SelectTrigger className="h-9 w-full sm:w-[190px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(`analytics.activeUsers.sort.${option}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={search}
                onChange={(e) => updateSearch(e.target.value)}
                placeholder={t("analytics.activeUsers.searchPlaceholder")}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-muted-foreground">
            {t("analytics.activeUsers.loading")}
          </div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
              <Search className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              {t("analytics.activeUsers.emptyTitle")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("analytics.activeUsers.emptyDescription")}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((row, index) => (
              <li
                key={row.id}
                className="flex items-center gap-4 p-4 transition-colors hover:bg-secondary/40"
              >
                <span className="w-6 text-sm font-bold tabular-nums text-muted-foreground">
                  {(page - 1) * PAGE_SIZE + index + 1}
                </span>
                <Link
                  href={`/admin/users/${row.id}`}
                  className="group flex min-w-0 flex-1 items-center gap-3"
                >
                  <AvatarTile
                    name={row.username}
                    src={row.avatarUrl ?? undefined}
                    className="h-10 w-10 rounded-md text-sm"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground transition-colors group-hover:text-accent">
                      {row.username}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{row.email}</p>
                  </div>
                </Link>

                {row.role !== "user" && (
                  <Badge variant={row.role === "admin" ? "destructive" : "accent"} className="shrink-0">
                    {t(`users.roles.${row.role}`)}
                  </Badge>
                )}

                <MetricCell label={t("analytics.activeUsers.columns.connections")}>
                  {formatNumber(row.connections)}
                </MetricCell>
                <MetricCell
                  label={t("analytics.activeUsers.columns.pageViews")}
                  className="hidden md:block"
                >
                  {formatNumber(row.pageViews)}
                </MetricCell>
                <MetricCell
                  label={t("analytics.activeUsers.columns.activeDays")}
                  className="hidden lg:block"
                >
                  {formatNumber(row.activeDays)}
                </MetricCell>
                <MetricCell
                  label={t("analytics.activeUsers.columns.devices")}
                  className="hidden xl:block"
                >
                  {formatNumber(row.devices)}
                </MetricCell>
                <MetricCell
                  label={t("analytics.activeUsers.columns.timeSpent")}
                  className="hidden xl:block"
                >
                  <ActivityDuration ms={row.timeSpentMs} />
                </MetricCell>
                <div className="hidden w-28 shrink-0 text-right text-xs text-muted-foreground 2xl:block">
                  <div>{t("analytics.activeUsers.columns.lastSeen")}</div>
                  <div>
                    {row.lastSeenAt
                      ? formatter.dateTime(new Date(row.lastSeenAt), {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : t("analytics.activeUsers.duration.none")}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!loading && rows.length > 0 && lastPage > 1 && (
        <Pagination currentPage={page} totalPages={lastPage} onPageChange={setPage} />
      )}
    </DashboardLayout>
  );
};

export default AdminActiveUsersPage;
