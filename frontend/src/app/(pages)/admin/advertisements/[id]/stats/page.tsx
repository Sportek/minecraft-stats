"use client";

import { useAuth } from "@/contexts/auth";
import { getAdminAdvertisement, getAdvertisementStats } from "@/http/advertisement";
import { AdStatsResponse, Advertisement } from "@/types/advertisement";
import { AgChartOptions } from "ag-charts-community";
import { AgCharts } from "ag-charts-react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";

type RangeKey = "7d" | "30d" | "90d";

const RANGES: Record<RangeKey, { label: string; ms: number; interval: "hour" | "day" }> = {
  "7d": { label: "7 jours", ms: 7 * 86400000, interval: "hour" },
  "30d": { label: "30 jours", ms: 30 * 86400000, interval: "day" },
  "90d": { label: "90 jours", ms: 90 * 86400000, interval: "day" },
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

  const chartOptions = useMemo<AgChartOptions>(() => {
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
          yName: "Clics",
          stroke: "#16A34A",
          marker: { enabled: false },
        },
      ],
      axes: [
        { type: "time" as const, position: "bottom" as const },
        { type: "number" as const, position: "left" as const },
      ],
    };
  }, [chartData, resolvedTheme]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-900 dark:text-white">Chargement...</div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-red-500">Accès refusé</h1>
          <p className="text-gray-600 dark:text-slate-400">
            Vous devez être administrateur pour accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  const totals = stats?.totals ?? { impressions: 0, clicks: 0 };
  const ctr =
    totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : "0.00";

  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-5xl animate-in fade-in px-4 py-8 duration-300">
        <Link
          href="/admin/advertisements"
          className="mb-6 flex items-center gap-2 font-medium text-stats-blue-600 transition-colors hover:text-stats-blue-500 dark:text-stats-blue-400 dark:hover:text-stats-blue-300"
        >
          <ChevronLeft className="h-4 w-4" />
          Retour à la liste
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Statistiques{ad ? ` — ${ad.name}` : ""}
          </h1>
          <p className="text-gray-600 dark:text-slate-400">
            Évolution des impressions et des clics dans le temps.
          </p>
        </div>

        {/* Sélecteur de période */}
        <div className="mb-6 flex items-center gap-2">
          {(Object.keys(RANGES) as RangeKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setRange(key)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                range === key
                  ? "bg-stats-blue-600 text-white"
                  : "border border-gray-300 bg-gray-200 text-gray-700 hover:text-gray-900 dark:border-stats-blue-700/50 dark:bg-stats-blue-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              {RANGES[key].label}
            </button>
          ))}
        </div>

        {/* Cartes de totaux */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Impressions", value: totals.impressions.toLocaleString("fr-FR") },
            { label: "Clics", value: totals.clicks.toLocaleString("fr-FR") },
            { label: "Taux de clic (CTR)", value: `${ctr} %` },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-lg border border-gray-300 bg-white p-5 shadow-sm dark:border-stats-blue-800 dark:bg-stats-blue-1000"
            >
              <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-slate-500">
                {card.label}
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
            </div>
          ))}
        </div>

        {/* Graphique */}
        <div className="rounded-lg border border-gray-300 bg-white p-4 shadow-sm dark:border-stats-blue-800 dark:bg-stats-blue-1000">
          {loading ? (
            <div className="flex h-[320px] items-center justify-center text-gray-500 dark:text-slate-500">
              Chargement des statistiques...
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-[320px] items-center justify-center text-gray-500 dark:text-slate-500">
              Aucune donnée sur cette période.
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
