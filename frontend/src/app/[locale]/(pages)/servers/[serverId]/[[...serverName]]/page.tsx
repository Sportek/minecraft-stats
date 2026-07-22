"use client";
import { fetcher, getBaseUrl, HttpError } from "@/app/_cheatcode";
import { generateTooltipHtml } from "@/components/serveur/card/tooltip-chart";
import { getServerStats } from "@/http/server";
import { ServerStat } from "@/types/server";
import "@/lib/ag-charts";
import {
  AgAreaSeriesOptions,
  AgCartesianAxisOptions,
  AgCartesianChartOptions,
  AgTimeAxisOptions,
} from "ag-charts-community";
import { AgCharts } from "ag-charts-react";

import { ServerData } from "@/app/[locale]/(pages)/(index)/page";
import { DEFAULT_PERIOD, Period, toStatsQuery } from "@/components/stats/period";
import { PeriodPicker } from "@/components/stats/period-picker";
import { SeriesMode, SeriesModeToggle } from "@/components/stats/series-mode-toggle";
import { ServerFAQStructuredData, ServerStructuredData } from "@/components/seo/structured-data";
import ServerDetailHeader from "@/components/serveur/server-detail-header";
import ClaimServerBanner from "@/components/serveur/claim-server-banner";
import ServerFAQ from "@/components/serveur/server-faq";
import ImprovedCard from "@/components/serveur/improved-card";
import AdSlot from "@/components/ads/ad-slot";
import { Spinner } from "@/components/ui/spinner";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useTheme } from "next-themes";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import useSWR from "swr";

const BASE_AXES: { x: AgTimeAxisOptions; y: AgCartesianAxisOptions } = {
  x: {
    type: "time",
    position: "bottom",
    label: {
      format: "%d/%m %H:%M",
    },
    nice: false,
    min: undefined,
    max: undefined,
  },
  y: {
    type: "number",
    position: "left",
  },
};

const BASE_CHART_OPTIONS: Partial<AgCartesianChartOptions> = {
  container: undefined,
  axes: { x: BASE_AXES.x, y: BASE_AXES.y },
  legend: {
    enabled: false,
  },
  tooltip: {
    position: {
      anchorTo: "pointer",
      placement: "top",
    },
  },
  background: {
    fill: "transparent",
  },
  padding: {
    top: 10,
    right: 10,
    bottom: 0,
    left: 10,
  },
};

interface SeriesConfig {
  yKey: "playerCount" | "peakPlayerCount";
  yName: string;
  theme: string | undefined;
  locale: string;
  playersLabel: string;
  /** `ghost` = courbe d'arrière-plan : trait fin pointillé, remplissage discret, pas de tooltip. */
  emphasis: "primary" | "ghost";
  /** Valeur montrée en seconde ligne du tooltip — l'autre bout de l'amplitude. */
  secondary: { key: "playerCount" | "peakPlayerCount"; label: string };
}

const createAreaSeries = ({
  yKey,
  yName,
  theme,
  locale,
  playersLabel,
  emphasis,
  secondary,
}: SeriesConfig): AgAreaSeriesOptions => {
  const stroke = theme === "dark" ? "#60A5FA" : "#2563EB";
  const isGhost = emphasis === "ghost";

  return {
    type: "area",
    xKey: "time",
    yKey,
    yName,
    stroke,
    strokeWidth: isGhost ? 1 : 2,
    lineDash: isGhost ? [4, 4] : undefined,
    strokeOpacity: isGhost ? 0.7 : 1,
    marker: {
      enabled: false,
    },
    fillOpacity: isGhost ? 0.05 : 0.12,
    fill: stroke,
    interpolation: {
      type: "smooth",
    },
    tooltip: {
      enabled: !isGhost,
      position: {
        anchorTo: "pointer",
        placement: "top",
      },
      renderer: ({ datum }: { datum: Record<string, number | Date> }) => {
        return generateTooltipHtml(
          {
            time: new Date(datum.time),
            playerCount: Number(datum[yKey] ?? 0),
            secondary: { label: secondary.label, value: Number(datum[secondary.key] ?? 0) },
          },
          { isDarkMode: theme === "dark" },
          locale,
          playersLabel
        );
      },
    },
  };
};

const ServerNotFound = () => {
  const t = useTranslations("Servers");
  return (
    <main className="flex-1 space-y-4 py-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="bg-card text-card-foreground border border-border rounded-lg shadow-xs p-8 space-y-6 max-w-md w-full">
            <div className="space-y-2 text-center">
              <div className="w-16 h-16 mx-auto bg-secondary text-muted-foreground rounded-full flex items-center justify-center">
                <Icon icon="mdi:server-off" className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">{t("detail.notFound.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("detail.notFound.description")}</p>
            </div>
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-accent-foreground bg-accent hover:bg-accent/90 rounded-md transition-colors"
            >
              <Icon icon="mdi:home" className="w-4 h-4" />
              {t("detail.notFound.backHome")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

/**
 * Erreur de chargement autre qu'un vrai 404 : rate-limit (429), erreur
 * serveur (5xx), panne réseau… On l'annonce comme telle — surtout pas
 * comme « serveur introuvable » — et on propose de réessayer.
 */
const ServerLoadError = ({ error, onRetry }: { error: Error; onRetry: () => void }) => {
  const t = useTranslations("Servers");
  const isRateLimited = error instanceof HttpError && error.status === 429;
  return (
    <main className="flex-1 space-y-4 py-4">
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="bg-card text-card-foreground border border-border rounded-lg shadow-xs p-8 space-y-6 max-w-md w-full">
          <div className="space-y-2 text-center">
            <div className="w-16 h-16 mx-auto bg-secondary text-muted-foreground rounded-full flex items-center justify-center">
              <Icon icon={isRateLimited ? "mdi:timer-sand" : "mdi:alert-circle-outline"} className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              {isRateLimited ? t("detail.error.rateLimitTitle") : t("detail.error.genericTitle")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isRateLimited ? t("detail.error.rateLimitDescription") : t("detail.error.genericDescription")}
            </p>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-accent-foreground bg-accent hover:bg-accent/90 rounded-md transition-colors"
          >
            <Icon icon="mdi:refresh" className="w-4 h-4" />
            {t("detail.error.retry")}
          </button>
        </div>
      </div>
    </main>
  );
};

const ServerPage = () => {
  const { serverId } = useParams();
  const locale = useLocale();
  const t = useTranslations("Servers");
  const tStats = useTranslations("Stats");
  const {
    data: serverData,
    error: serverError,
    isLoading: isServerLoading,
    mutate: retryServer,
  } = useSWR<ServerData, Error>(`${getBaseUrl()}/servers/${serverId}`, fetcher, {
    // Aligné sur le TTL Redis backend (300s) — cf. P.2.1
    refreshInterval: 1000 * 60 * 5,
  });

  const [period, setPeriod] = useState<Period>(DEFAULT_PERIOD);
  const [seriesMode, setSeriesMode] = useState<SeriesMode>("average");
  const { resolvedTheme } = useTheme();

  const { data: statsData, isLoading: isStatsLoading } = useSWR<ServerStat[], Error>(
    ["server-stats", serverId, period],
    () => {
      const { fromDate, toDate, interval } = toStatsQuery(period, Date.now());
      return getServerStats(Number(serverId), fromDate, toDate, interval);
    },
    { refreshInterval: 1000 * 60 * 2 }
  );

  const stats = useMemo(() => statsData ?? [], [statsData]);

  const options = useMemo((): AgCartesianChartOptions => {
    const data = stats.map((stat) => ({
      time: new Date(stat.createdAt),
      playerCount: stat.playerCount,
      // Repli sur la moyenne le temps que le cache backend renouvelle les
      // réponses d'avant l'ajout du pic.
      peakPlayerCount: stat.peakPlayerCount ?? stat.playerCount,
    }));

    const dates = data.map((d) => d.time);
    const minDate = dates.length > 0 ? Math.min(...dates.map((d) => d.getTime())) : undefined;
    const maxDate = dates.length > 0 ? Math.max(...dates.map((d) => d.getTime())) : undefined;

    const isPeak = seriesMode === "peak";
    const shared = { theme: resolvedTheme, locale, playersLabel: t("chart.players") };
    const peakLabel = tStats("seriesMode.peak");
    const averageLabel = tStats("seriesMode.average");

    return {
      ...BASE_CHART_OPTIONS,
      data,
      // Le pic passe toujours en premier : dessiné derrière, il n'occulte jamais
      // la moyenne, quel que soit le mode mis en avant.
      series: [
        createAreaSeries({
          ...shared,
          yKey: "peakPlayerCount",
          yName: peakLabel,
          emphasis: isPeak ? "primary" : "ghost",
          secondary: { key: "playerCount", label: averageLabel },
        }),
        createAreaSeries({
          ...shared,
          yKey: "playerCount",
          yName: averageLabel,
          emphasis: isPeak ? "ghost" : "primary",
          secondary: { key: "peakPlayerCount", label: peakLabel },
        }),
      ],
      theme: resolvedTheme === "dark" ? "ag-default-dark" : "ag-default",
      axes: {
        x: { ...BASE_AXES.x, min: minDate, max: maxDate },
        y: {
          ...BASE_AXES.y,
          label: { formatter: ({ value }: { value: number }) => new Intl.NumberFormat(locale).format(value) },
        },
      },
    };
  }, [stats, seriesMode, resolvedTheme, locale, t, tStats]);

  if (isServerLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner size="md" />
          <p className="text-sm">{t("detail.loading")}</p>
        </div>
      </div>
    );
  }

  if (serverError) {
    if (serverError instanceof HttpError && serverError.status === 404) {
      return <ServerNotFound />;
    }
    return <ServerLoadError error={serverError} onRetry={() => retryServer()} />;
  }

  // Filet de sécurité : réponse 200 sans payload exploitable.
  if (!serverData?.server) {
    return <ServerNotFound />;
  }

  return (
    <main className="flex-1 space-y-6 py-6">
      <nav aria-label={t("detail.breadcrumbAria")} className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="text-accent transition-colors hover:underline">
          {t("detail.breadcrumb")}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="truncate font-medium text-foreground">{serverData.server.name}</span>
      </nav>

      <ServerStructuredData
        server={serverData.server}
        categories={serverData.categories}
        playerCount={serverData.server.lastPlayerCount ?? 0}
        maxPlayers={serverData.server.lastMaxCount ?? undefined}
        locale={locale}
      />
      <ServerFAQStructuredData
        server={serverData.server}
        currentPlayers={serverData.server.lastPlayerCount ?? 0}
        maxPlayers={serverData.server.lastMaxCount ?? 0}
        locale={locale}
      />

      <ServerDetailHeader
        server={serverData.server}
        stats={serverData.stats}
        categories={serverData.categories}
        growthStat={serverData.growthStat}
      />

      <ClaimServerBanner
        serverId={serverData.server.id}
        serverName={serverData.server.name}
        verified={serverData.server.ownerVerifiedAt !== null}
      />

      <AdSlot
        placement="server"
        serverId={Number(serverId)}
        serverCategoryIds={serverData.categories.map((category) => category.id)}
      />

      <section className="rounded-xl border border-border bg-card text-card-foreground shadow-xs">
        <div className="flex flex-col gap-2 border-b border-border px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Icon icon="material-symbols:show-chart" className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">{t("detail.history.title")}</h2>
              <p className="text-xs text-muted-foreground">{t("detail.history.subtitle")}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <PeriodPicker value={period} onChange={setPeriod} disabled={isStatsLoading} />
            <SeriesModeToggle value={seriesMode} onChange={setSeriesMode} />
          </div>
        </div>

        <div className="relative p-4">
          {isStatsLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-xs rounded-b-xl">
              <Spinner size="md" />
            </div>
          )}
          {/* Smaller chart height on mobile, taller on larger screens */}
          <div className="h-[280px] sm:h-[360px]">
            <AgCharts options={options} className="h-full w-full" />
          </div>
        </div>
      </section>

      <ImprovedCard
        isLoading={isStatsLoading}
        server={serverData.server}
        stats={stats}
        categories={serverData.categories}
      />

      <ServerFAQ
        server={serverData.server}
        currentPlayers={serverData.server.lastPlayerCount ?? 0}
        maxPlayers={serverData.server.lastMaxCount ?? 0}
      />
    </main>
  );
};

export default ServerPage;
