"use client";

import { AdminBackLink } from "@/components/admin/admin-back-link";
import { AdminFilterTabs } from "@/components/admin/admin-filter-tabs";
import { AdminLoadingState, AdminMessageState } from "@/components/admin/admin-states";
import { useAuth } from "@/contexts/auth";
import { getAdminAdvertisement, getAdvertisementStats } from "@/http/advertisement";
import "@/lib/ag-charts";
import { AdStatsResponse, Advertisement } from "@/types/advertisement";
import { AgCartesianChartOptions } from "ag-charts-community";
import { AgCharts } from "ag-charts-react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";

type RangeKey = "7d" | "30d" | "90d";

const RANGES: Record<RangeKey, { label: string; ms: number; interval: "hour" | "day" }> = {
  "7d": { label: "7 days", ms: 7 * 86400000, interval: "hour" },
  "30d": { label: "30 days", ms: 30 * 86400000, interval: "day" },
  "90d": { label: "90 days", ms: 90 * 86400000, interval: "day" },
};

const AdvertisementStatsPage = () => {
  const { user, getToken } = useAuth();
  const token = getToken();
  const params = useParams();
  const adId = Number(params.id);
  const { resolvedTheme } = useTheme();

  const [ad, setAd] = useState<Advertisement | null>(null);
  const [stats, setStats] = useState<AdStatsResponse | null>(null);
  const [range, setRange] = useState<RangeKey>("30d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !Number.isFinite(adId)) return;
    getAdminAdvertisement(adId, token)
      .then(setAd)
      .catch((error) => console.error("Failed to fetch advertisement:", error));
  }, [token, adId]);

  useEffect(() => {
    if (!token || !Number.isFinite(adId)) return;

    const fetchStats = async () => {
      try {
        setLoading(true);
        const { ms, interval } = RANGES[range];
        const now = Date.now();
        setStats(
          await getAdvertisementStats(adId, token, {
            interval,
            fromDate: now - ms,
            toDate: now,
          })
        );
      } catch (error) {
        console.error("Failed to fetch advertisement stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token, adId, range]);

  const chartData = useMemo(
    () =>
      (stats?.series ?? []).map((point) => ({
        time: new Date(point.time),
        impressions: point.impressions,
        clicks: point.clicks,
      })),
    [stats]
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
          yKey: "impressions",
          yName: "Impressions",
          stroke: "#2563EB",
          marker: { enabled: false },
        },
        {
          type: "line" as const,
          xKey: "time",
          yKey: "clicks",
          yName: "Clicks",
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
    return <AdminLoadingState label="Loading…" />;
  }

  if (user.role !== "admin") {
    return (
      <AdminMessageState
        tone="destructive"
        title="Access denied"
        description="You must be an administrator to access this page."
      />
    );
  }

  const totals = stats?.totals ?? { impressions: 0, clicks: 0 };
  const ctr =
    totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : "0.00";

  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-5xl animate-in fade-in px-4 py-8 duration-300">
        <AdminBackLink href="/admin/advertisements" label="Back to the list" />

        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Statistics{ad ? ` — ${ad.name}` : ""}
          </h1>
          <p className="text-muted-foreground">
            Impressions and clicks over time.
          </p>
        </div>

        {/* Sélecteur de période */}
        <AdminFilterTabs
          className="mb-6"
          value={range}
          onChange={setRange}
          tabs={(Object.keys(RANGES) as RangeKey[]).map((key) => ({
            value: key,
            label: RANGES[key].label,
          }))}
        />

        {/* Cartes de totaux */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Impressions", value: totals.impressions.toLocaleString("fr-FR") },
            { label: "Clicks", value: totals.clicks.toLocaleString("fr-FR") },
            { label: "Click-through rate (CTR)", value: `${ctr} %` },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-xs"
            >
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {card.label}
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{card.value}</p>
            </div>
          ))}
        </div>

        {/* Graphique */}
        <div className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-xs">
          {loading ? (
            <div className="flex h-[320px] items-center justify-center text-muted-foreground">
              Loading statistics…
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-[320px] items-center justify-center text-muted-foreground">
              No data for this period.
            </div>
          ) : (
            <div className="h-[320px]">
              <AgCharts options={chartOptions} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvertisementStatsPage;
