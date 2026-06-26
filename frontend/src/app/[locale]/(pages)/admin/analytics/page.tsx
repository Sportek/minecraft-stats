"use client";

import DashboardHero from "@/components/account/dashboard-hero";
import DashboardLayout from "@/components/account/dashboard-layout";
import DashboardStatTile from "@/components/account/dashboard-stat-tile";
import { AdminFilterTabs } from "@/components/admin/admin-filter-tabs";
import { AdminLoadingState, AdminMessageState } from "@/components/admin/admin-states";
import { useAuth } from "@/contexts/auth";
import { getAnalyticsDashboard } from "@/http/analytics";
import "@/lib/ag-charts";
import { AnalyticsDashboard } from "@/types/analytics";
import { AgCartesianChartOptions } from "ag-charts-community";
import { AgCharts } from "ag-charts-react";
import dynamic from "next/dynamic";
import { useFormatter, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";

// react-simple-maps fetches its geography at runtime, so it is client-only.
const WorldMap = dynamic(() => import("@/components/analytics/world-map"), { ssr: false });

type RangeKey = "7d" | "30d" | "90d";

const RANGES: Record<RangeKey, { ms: number }> = {
  "7d": { ms: 7 * 86400000 },
  "30d": { ms: 30 * 86400000 },
  "90d": { ms: 90 * 86400000 },
};

// Requests and unique visitors differ by orders of magnitude, so each gets its
// own single-axis chart rather than a shared (and unreadable) scale.
function buildLineChart(
  data: Array<{ time: Date }>,
  yKey: string,
  yName: string,
  stroke: string,
  isDark: boolean
): AgCartesianChartOptions {
  return {
    data,
    theme: isDark ? "ag-default-dark" : "ag-default",
    background: { fill: "transparent" },
    legend: { enabled: false },
    series: [{ type: "line", xKey: "time", yKey, yName, stroke, marker: { enabled: false } }],
    axes: {
      x: { type: "time", position: "bottom" },
      y: { type: "number", position: "left" },
    },
  };
}

const AnalyticsDashboardPage = () => {
  const { user, getToken } = useAuth();
  const t = useTranslations("Admin");
  const formatter = useFormatter();
  const formatNumber = (value: number) => formatter.number(value);
  const token = getToken();
  const { resolvedTheme } = useTheme();

  const [data, setData] = useState<AnalyticsDashboard | null>(null);
  const [range, setRange] = useState<RangeKey>("30d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const now = Date.now();
        setData(await getAnalyticsDashboard(token, { fromDate: now - RANGES[range].ms, toDate: now }));
      } catch (error) {
        console.error("Failed to fetch analytics dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, range]);

  const chartData = useMemo(
    () =>
      (data?.series ?? []).map((point) => ({
        time: new Date(point.time),
        requests: point.requests,
        uniqueVisitors: point.uniqueVisitors,
      })),
    [data]
  );

  const isDark = resolvedTheme === "dark";
  const requestsOptions = useMemo(
    () => buildLineChart(chartData, "requests", t("analytics.requestsChart"), "#2563EB", isDark),
    [chartData, isDark, t]
  );
  const visitorsOptions = useMemo(
    () => buildLineChart(chartData, "uniqueVisitors", t("analytics.visitorsChart"), "#16A34A", isDark),
    [chartData, isDark, t]
  );

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

  const totals = data?.totals ?? {
    httpRequests: 0,
    httpErrors: 0,
    uniqueVisitors: 0,
    uniqueVisitorsThisMonth: 0,
    pageViews: 0,
    loggedInViews: 0,
  };

  const statCards = [
    { label: t("analytics.cards.uniqueThisMonth"), value: formatNumber(totals.uniqueVisitorsThisMonth) },
    { label: t("analytics.cards.uniquePeriod"), value: formatNumber(totals.uniqueVisitors) },
    { label: t("analytics.cards.httpRequests"), value: formatNumber(totals.httpRequests) },
    { label: t("analytics.cards.pageViews"), value: formatNumber(totals.pageViews) },
  ];

  return (
    <DashboardLayout>
      <DashboardHero
        title={t("analytics.title")}
        subtitle={t("analytics.subtitle")}
        badge={t("analytics.visitorsBadge", { count: formatNumber(totals.uniqueVisitorsThisMonth) })}
      />

      <AdminFilterTabs
        value={range}
        onChange={setRange}
        tabs={(Object.keys(RANGES) as RangeKey[]).map((key) => ({
          value: key,
          label: t(`analytics.ranges.${key}`),
        }))}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((card) => (
          <DashboardStatTile key={card.label} label={card.label} value={card.value} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title={t("analytics.requestsChart")}
          loading={loading}
          empty={chartData.length === 0}
          loadingLabel={t("analytics.chartLoading")}
          emptyLabel={t("analytics.chartEmpty")}
        >
          <AgCharts options={requestsOptions} />
        </ChartCard>
        <ChartCard
          title={t("analytics.visitorsChart")}
          loading={loading}
          empty={chartData.length === 0}
          loadingLabel={t("analytics.chartLoading")}
          emptyLabel={t("analytics.chartEmpty")}
        >
          <AgCharts options={visitorsOptions} />
        </ChartCard>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-sm font-semibold text-foreground">{t("analytics.visitorsByCountry")}</h2>
        {(data?.countries ?? []).length === 0 ? (
          <div className="flex h-[320px] items-center justify-center text-muted-foreground">
            {t("analytics.noCountryData")}
          </div>
        ) : (
          <WorldMap countries={data?.countries ?? []} />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AnalyticsTable
          title={t("analytics.topPages")}
          subtitle={t("analytics.topPagesSubtitle")}
          emptyLabel={t("analytics.noPageViews")}
          topLabel={t("analytics.top")}
          rows={(data?.topPages ?? []).map((p) => ({
            key: p.path,
            label: p.path,
            value: t("analytics.pageRowValue", {
              views: formatNumber(p.views),
              unique: formatNumber(p.uniqueVisitors),
            }),
          }))}
        />
        <AnalyticsTable
          title={t("analytics.referrers")}
          emptyLabel={t("analytics.noReferrers")}
          topLabel={t("analytics.top")}
          rows={(data?.topReferrers ?? []).map((r) => ({
            key: r.referrer,
            label: r.referrer,
            value: t("analytics.referrerRowValue", { views: formatNumber(r.views) }),
          }))}
        />
      </div>
    </DashboardLayout>
  );
};

const ChartCard = ({
  title,
  loading,
  empty,
  loadingLabel,
  emptyLabel,
  children,
}: {
  title: string;
  loading: boolean;
  empty: boolean;
  loadingLabel: string;
  emptyLabel: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-xs">
    <h2 className="mb-3 text-sm font-semibold text-foreground">{title}</h2>
    {loading ? (
      <div className="flex h-[280px] items-center justify-center text-muted-foreground">
        {loadingLabel}
      </div>
    ) : empty ? (
      <div className="flex h-[280px] items-center justify-center text-muted-foreground">
        {emptyLabel}
      </div>
    ) : (
      <div className="h-[280px]">{children}</div>
    )}
  </div>
);

interface AnalyticsTableRow {
  key: string;
  label: string;
  value: string;
}

const AnalyticsTable = ({
  title,
  subtitle,
  rows,
  emptyLabel,
  topLabel,
}: {
  title: string;
  subtitle?: string;
  rows: AnalyticsTableRow[];
  emptyLabel: string;
  topLabel: string;
}) => (
  <div className="rounded-lg border border-border bg-card text-card-foreground shadow-xs">
    <div className="flex items-baseline justify-between border-b border-border px-4 py-3">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {rows.length > 0 && (
        <span className="text-xs text-muted-foreground">
          {topLabel} {rows.length}
        </span>
      )}
    </div>
    {subtitle && <p className="px-4 pt-2 text-xs text-muted-foreground">{subtitle}</p>}
    {rows.length === 0 ? (
      <p className="px-4 py-6 text-sm text-muted-foreground">{emptyLabel}</p>
    ) : (
      <ul className="max-h-[320px] divide-y divide-border overflow-y-auto">
        {rows.map((row) => (
          <li key={row.key} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2.5 text-sm">
            <span className="min-w-0 truncate text-foreground" title={row.label}>
              {row.label}
            </span>
            <span className="shrink-0 text-right text-muted-foreground">{row.value}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default AnalyticsDashboardPage;
