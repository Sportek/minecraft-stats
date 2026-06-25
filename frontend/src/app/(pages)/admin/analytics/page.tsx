"use client";

import { AdminBackLink } from "@/components/admin/admin-back-link";
import { AdminFilterTabs } from "@/components/admin/admin-filter-tabs";
import { AdminLoadingState, AdminMessageState } from "@/components/admin/admin-states";
import { useAuth } from "@/contexts/auth";
import { getAnalyticsDashboard } from "@/http/analytics";
import "@/lib/ag-charts";
import { AnalyticsDashboard } from "@/types/analytics";
import { AgCartesianChartOptions } from "ag-charts-community";
import { AgCharts } from "ag-charts-react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";

type RangeKey = "7d" | "30d" | "90d";

const RANGES: Record<RangeKey, { label: string; ms: number; interval: "hour" | "day" }> = {
  "7d": { label: "7 jours", ms: 7 * 86400000, interval: "day" },
  "30d": { label: "30 jours", ms: 30 * 86400000, interval: "day" },
  "90d": { label: "90 jours", ms: 90 * 86400000, interval: "day" },
};

const formatNumber = (value: number) => value.toLocaleString("fr-FR");

const AnalyticsDashboardPage = () => {
  const { user, getToken } = useAuth();
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
        const { ms, interval } = RANGES[range];
        const now = Date.now();
        setData(await getAnalyticsDashboard(token, { interval, fromDate: now - ms, toDate: now }));
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
        pageViews: point.pageViews,
        uniqueVisitors: point.uniqueVisitors,
      })),
    [data]
  );

  const chartOptions = useMemo<AgCartesianChartOptions>(() => {
    const isDark = resolvedTheme === "dark";
    return {
      data: chartData,
      theme: isDark ? "ag-default-dark" : "ag-default",
      background: { fill: "transparent" },
      legend: { enabled: true, position: "bottom" as const },
      series: [
        {
          type: "line" as const,
          xKey: "time",
          yKey: "pageViews",
          yName: "Pages vues",
          stroke: "#2563EB",
          marker: { enabled: false },
        },
        {
          type: "line" as const,
          xKey: "time",
          yKey: "uniqueVisitors",
          yName: "Visiteurs uniques",
          stroke: "#16A34A",
          marker: { enabled: false },
        },
      ],
      axes: {
        x: { type: "time" as const, position: "bottom" as const },
        y: { type: "number" as const, position: "left" as const },
      },
    };
  }, [chartData, resolvedTheme]);

  if (!user) {
    return <AdminLoadingState label="Chargement..." />;
  }

  if (user.role !== "admin") {
    return (
      <AdminMessageState
        tone="destructive"
        title="Accès refusé"
        description="Vous devez être administrateur pour accéder à cette page."
      />
    );
  }

  const totals = data?.totals ?? {
    pageViews: 0,
    uniqueVisitors: 0,
    loggedInViews: 0,
    requests: 0,
    errors: 0,
  };

  const statCards = [
    { label: "Pages vues", value: formatNumber(totals.pageViews) },
    { label: "Visiteurs uniques", value: formatNumber(totals.uniqueVisitors) },
    { label: "Vues connectées", value: formatNumber(totals.loggedInViews) },
    { label: "Requêtes HTTP", value: formatNumber(totals.requests) },
  ];

  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-5xl animate-in fade-in px-4 py-8 duration-300">
        <AdminBackLink href="/admin/advertisements" label="Retour à l'administration" />

        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics</h1>
          <p className="text-muted-foreground">
            Usage du site, trafic et audience sur la période sélectionnée.
          </p>
        </div>

        <AdminFilterTabs
          className="mb-6"
          value={range}
          onChange={setRange}
          tabs={(Object.keys(RANGES) as RangeKey[]).map((key) => ({
            value: key,
            label: RANGES[key].label,
          }))}
        />

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-xs"
            >
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="mb-6 rounded-lg border border-border bg-card p-4 text-card-foreground shadow-xs">
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Pages vues &amp; visiteurs uniques
          </h2>
          {loading ? (
            <div className="flex h-[320px] items-center justify-center text-muted-foreground">
              Chargement des statistiques...
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-[320px] items-center justify-center text-muted-foreground">
              Aucune donnée sur cette période.
            </div>
          ) : (
            <div className="h-[320px]">
              <AgCharts options={chartOptions} />
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <AnalyticsTable
            title="Pages les plus vues"
            emptyLabel="Aucune page vue."
            rows={(data?.topPages ?? []).map((p) => ({
              key: p.path,
              label: p.path,
              value: `${formatNumber(p.views)} vues · ${formatNumber(p.uniqueVisitors)} uniques`,
            }))}
          />
          <AnalyticsTable
            title="Référents"
            emptyLabel="Aucun référent."
            rows={(data?.topReferrers ?? []).map((r) => ({
              key: r.referrer,
              label: r.referrer,
              value: `${formatNumber(r.views)} vues`,
            }))}
          />
          <AnalyticsTable
            title="Pays"
            emptyLabel="Aucune donnée de pays."
            rows={(data?.countries ?? []).map((c) => ({
              key: c.country,
              label: c.country,
              value: `${formatNumber(c.views)} vues`,
            }))}
          />
        </div>
      </div>
    </div>
  );
};

interface AnalyticsTableRow {
  key: string;
  label: string;
  value: string;
}

const AnalyticsTable = ({
  title,
  rows,
  emptyLabel,
}: {
  title: string;
  rows: AnalyticsTableRow[];
  emptyLabel: string;
}) => (
  <div className="rounded-lg border border-border bg-card text-card-foreground shadow-xs">
    <h2 className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
      {title}
    </h2>
    {rows.length === 0 ? (
      <p className="px-4 py-6 text-sm text-muted-foreground">{emptyLabel}</p>
    ) : (
      <ul className="divide-y divide-border">
        {rows.map((row) => (
          <li key={row.key} className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
            <span className="min-w-0 truncate text-foreground" title={row.label}>
              {row.label}
            </span>
            <span className="shrink-0 text-muted-foreground">{row.value}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default AnalyticsDashboardPage;
