import { ServerStat } from "@/types/server";
import type { AgAreaSeriesOptions, AgCartesianAxisOptions, AgCartesianChartOptions, AgTimeAxisOptions } from "ag-charts-community";
import { useTheme } from "next-themes";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { Server } from "../selects/server-select";
import dynamic from 'next/dynamic';
import { generateTooltipHtml } from "@/components/serveur/card/tooltip-chart";
import { SeriesMode } from "@/components/stats/series-mode-toggle";
import { Spinner } from "@/components/ui/spinner";

// Load the AG Charts core (module registration) and renderer together in this
// async chunk so the heavy `ag-charts-community` bundle stays out of the shared
// home chunk. Only the TypeScript option types above are imported statically
// (`import type` is erased at build time).
const AgCharts = dynamic(
  async () => {
    await import("@/lib/ag-charts");
    return (await import("ag-charts-react")).AgCharts;
  },
  {
    ssr: false,
    loading: () => <div className="h-72 w-full bg-foreground/10 animate-pulse rounded-md" />,
  }
);

interface ChartDatum {
  time: Date;
  playerCount?: number;
  [key: string]: number | Date | undefined;
}

interface GlobalStatsChartProps {
  globalStats: ServerStat[];
  serverStats: { server: Server; stats: ServerStat[] }[];
  seriesMode: SeriesMode;
  /** Format d'étiquette de l'axe temporel, dérivé de la résolution (cf. `axisTimeFormat`). */
  axisFormat: string;
  isLoading: boolean;
}

const COLORS = [
  { light: '#2563EB', dark: '#60A5FA' }, // Blue
  { light: '#DC2626', dark: '#F87171' }, // Red
  { light: '#059669', dark: '#34D399' }, // Green
  { light: '#7C3AED', dark: '#A78BFA' }, // Purple
  { light: '#EA580C', dark: '#FB923C' }, // Orange
];

const BASE_AXES: { x: AgTimeAxisOptions; y: AgCartesianAxisOptions } = {
  x: {
    type: 'time',
    position: 'bottom',
    label: {
      format: '%d/%m %H:%M',
    },
    nice: false,
    min: undefined,
    max: undefined
  },
  y: {
    type: 'number',
    position: 'left',
  },
};

const BASE_CHART_OPTIONS: Partial<AgCartesianChartOptions> = {
  container: undefined,
  axes: { x: BASE_AXES.x, y: BASE_AXES.y },
  legend: {
    enabled: true,
    position: 'bottom',
    spacing: 40
  },
  tooltip: {
    position: {
      anchorTo: 'pointer',
      placement: 'top'
    }
  },
  background: {
    fill: 'transparent',
  },
  padding: {
    top: 10,
    right: 10,
    bottom: 10,
    left: 10
  }
};

const createEmptyChartOptions = (theme: string | undefined): AgCartesianChartOptions => ({
  ...BASE_CHART_OPTIONS,
  data: [],
  series: [],
  theme: theme === 'dark' ? 'ag-default-dark' : 'ag-default',
} as AgCartesianChartOptions);

interface SeriesConfig {
  yKey: string;
  yName: string;
  color: { light: string; dark: string };
  theme: string | undefined;
  locale: string;
  playersLabel: string;
  /** `ghost` = courbe d'arrière-plan : trait fin pointillé, remplissage discret, pas de tooltip. */
  emphasis: 'primary' | 'ghost';
  /** Valeur montrée en seconde ligne du tooltip — l'autre bout de l'amplitude. */
  secondary?: { key: string; label: string };
}

const createAreaSeries = ({
  yKey,
  yName,
  color,
  theme,
  locale,
  playersLabel,
  emphasis,
  secondary,
}: SeriesConfig): AgAreaSeriesOptions => {
  const stroke = theme === 'dark' ? color.dark : color.light;
  const isGhost = emphasis === 'ghost';

  return {
    type: 'area',
    xKey: 'time',
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
      type: 'smooth'
    },
    tooltip: {
      enabled: !isGhost,
      position: {
        anchorTo: 'pointer',
        placement: 'top',
      },
      renderer: ({ datum }: { datum: Record<string, number | Date> }) => {
        return generateTooltipHtml(
          {
            time: new Date(datum.time),
            playerCount: Number(datum[yKey] ?? 0),
            secondary: secondary && { label: secondary.label, value: Number(datum[secondary.key] ?? 0) },
          },
          { isDarkMode: theme === 'dark' },
          locale,
          playersLabel
        );
      },
    },
  } as AgAreaSeriesOptions;
};

export const GlobalStatsChart = ({ globalStats = [], serverStats = [], seriesMode, axisFormat, isLoading }: GlobalStatsChartProps) => {
  const { resolvedTheme } = useTheme();
  const locale = useLocale();
  const t = useTranslations("Home");
  const tStats = useTranslations("Stats");

  const options = useMemo(() => {
    // Vérifier si on a des données valides
    if (!Array.isArray(globalStats) && (!Array.isArray(serverStats) || serverStats.length === 0)) {
      return createEmptyChartOptions(resolvedTheme);
    }

    const isPeak = seriesMode === 'peak';
    // Le pic somme les pics de chaque serveur, qui ne tombent pas à la même minute :
    // ce n'est pas le pic simultané de la plateforme. Le libellé le dit.
    const peakLabel = tStats("seriesMode.peakGlobal");
    const averageLabel = tStats("seriesMode.average");

    // Si on a des stats globales, les utiliser
    if (globalStats.length > 0) {
      const data = globalStats
        .filter(stat => stat.createdAt)
        .map(stat => ({
          time: new Date(stat.createdAt),
          playerCount: stat.playerCount ?? 0,
          // Repli sur la moyenne le temps que le cache backend renouvelle les
          // réponses d'avant l'ajout du pic.
          peakPlayerCount: stat.peakPlayerCount ?? stat.playerCount ?? 0,
        }));

      // Calculer les dates min et max
      const dates = data.map(d => d.time);
      const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
      const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

      const shared = { color: COLORS[0], theme: resolvedTheme, locale, playersLabel: t("players") };

      return {
        ...BASE_CHART_OPTIONS,
        data,
        // Le pic passe toujours en premier : dessiné derrière, il n'occulte jamais
        // la moyenne, quel que soit le mode mis en avant.
        series: [
          createAreaSeries({
            ...shared,
            yKey: 'peakPlayerCount',
            yName: peakLabel,
            emphasis: isPeak ? 'primary' : 'ghost',
            secondary: { key: 'playerCount', label: averageLabel },
          }),
          createAreaSeries({
            ...shared,
            yKey: 'playerCount',
            yName: t("allMonitoredServers"),
            emphasis: isPeak ? 'ghost' : 'primary',
            secondary: { key: 'peakPlayerCount', label: peakLabel },
          }),
        ],
        theme: resolvedTheme === 'dark' ? 'ag-default-dark' : 'ag-default',
        axes: {
          x: { ...BASE_AXES.x, min: minDate, max: maxDate, label: { format: axisFormat } },
          y: BASE_AXES.y,
        }
      } as AgCartesianChartOptions;
    }

    // S'assurer que les stats du premier serveur existent pour les serveurs individuels
    const firstServerStats = serverStats[0]?.stats ?? [];
    if (firstServerStats.length === 0) {
      return createEmptyChartOptions(resolvedTheme);
    }

    // Préparer les données pour les serveurs individuels.
    // Pas d'enveloppe ici : avec plusieurs serveurs superposés, doubler les courbes
    // rendrait le graphique illisible. Le mode choisit donc la valeur tracée.
    try {
      const allData = firstServerStats
        .filter((stat: ServerStat) => stat.createdAt)
        .map((stat: ServerStat) => {
          const basePoint: ChartDatum = {
            time: new Date(stat.createdAt)
          };

        serverStats.forEach(({ server, stats }) => {
          if (server && stats) {
            const matchingStat = stats.find(s => s?.createdAt === stat.createdAt);
            const value = isPeak ? matchingStat?.peakPlayerCount : matchingStat?.playerCount;
            basePoint[`playerCount_${server.id}`] = value ?? matchingStat?.playerCount ?? 0;
          }
        });

        return basePoint;
      });

      // Calculer les dates min et max pour les serveurs individuels
      const dates = allData.map(d => d.time);
      const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
      const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

      const series = serverStats
        .filter(({ server, stats }) => server && stats && stats.length > 0)
        .map(({ server }, index) => {
          const serverName = server.name || t("serverSelect.serverFallback", { id: server.id });
          return createAreaSeries({
            yKey: `playerCount_${server.id}`,
            yName: isPeak ? `${serverName} · ${peakLabel}` : serverName,
            color: COLORS[index % COLORS.length],
            theme: resolvedTheme,
            locale,
            playersLabel: t("players"),
            emphasis: 'primary',
          });
        });

      return {
        ...BASE_CHART_OPTIONS,
        data: allData,
        series,
        theme: resolvedTheme === 'dark' ? 'ag-default-dark' : 'ag-default',
        axes: {
          x: { ...BASE_AXES.x, min: minDate, max: maxDate, label: { format: axisFormat } },
          y: BASE_AXES.y,
        }
      } as AgCartesianChartOptions;
    } catch (error) {
      console.error('Error processing server stats:', error);
      return createEmptyChartOptions(resolvedTheme);
    }
  }, [globalStats, serverStats, seriesMode, axisFormat, resolvedTheme, locale, t, tStats]);

  return (
    <div className="flex flex-col gap-2">
      <div className="h-72 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-xs flex items-center justify-center">
            <Spinner size="md" />
          </div>
        )}
        <AgCharts options={options} />
      </div>
    </div>
  );
}; 