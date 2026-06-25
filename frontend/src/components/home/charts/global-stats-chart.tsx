import { ServerStat } from "@/types/server";
import type { AgAreaSeriesOptions, AgCartesianAxisOptions, AgCartesianChartOptions, AgTimeAxisOptions } from "ag-charts-community";
import { useTheme } from "next-themes";
import { useMemo } from "react";
import { Server } from "../selects/server-select";
import dynamic from 'next/dynamic';
import { generateTooltipHtml } from "@/components/serveur/card/tooltip-chart";
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

const createAreaSeries = (
  xKey: string,
  yKey: string,
  yName: string,
  color: { light: string; dark: string },
  theme: string | undefined
): AgAreaSeriesOptions => ({
  type: 'area',
  xKey,
  yKey,
  yName,
  stroke: theme === 'dark' ? color.dark : color.light,
  strokeWidth: 2,
  marker: {
    enabled: false,
  },
  fillOpacity: 0.1,
  fill: theme === 'dark' ? color.dark : color.light,
  interpolation: {
    type: 'smooth'
  },
  tooltip: {
    enabled: true,
    position: {
      anchorTo: 'pointer',
      placement: 'top',
    },
    renderer: ({ datum }: { datum: Record<string, number | Date> }) => {
      return generateTooltipHtml(
        { time: new Date(datum.time), playerCount: Number(datum[yKey] ?? 0) },
        { isDarkMode: theme === 'dark' }
      );
    },
  },
} as AgAreaSeriesOptions);

export const GlobalStatsChart = ({ globalStats = [], serverStats = [], isLoading }: GlobalStatsChartProps) => {
  const { resolvedTheme } = useTheme();

  const options = useMemo(() => {
    // Vérifier si on a des données valides
    if (!Array.isArray(globalStats) && (!Array.isArray(serverStats) || serverStats.length === 0)) {
      return createEmptyChartOptions(resolvedTheme);
    }

    // Si on a des stats globales, les utiliser
    if (globalStats.length > 0) {
      const data = globalStats
        .filter(stat => stat.createdAt)
        .map(stat => ({
          time: new Date(stat.createdAt),
          playerCount: stat.playerCount ?? 0
        }));

      // Calculer les dates min et max
      const dates = data.map(d => d.time);
      const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
      const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

      return {
        ...BASE_CHART_OPTIONS,
        data,
        series: [createAreaSeries('time', 'playerCount', 'All monitored servers', COLORS[0], resolvedTheme)],
        theme: resolvedTheme === 'dark' ? 'ag-default-dark' : 'ag-default',
        axes: {
          x: { ...BASE_AXES.x, min: minDate, max: maxDate },
          y: BASE_AXES.y,
        }
      } as AgCartesianChartOptions;
    }

    // S'assurer que les stats du premier serveur existent pour les serveurs individuels
    const firstServerStats = serverStats[0]?.stats ?? [];
    if (firstServerStats.length === 0) {
      return createEmptyChartOptions(resolvedTheme);
    }

    // Préparer les données pour les serveurs individuels
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
            basePoint[`playerCount_${server.id}`] = matchingStat?.playerCount ?? 0;
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
          const colorIndex = index % COLORS.length;
          return createAreaSeries(
            'time',
            `playerCount_${server.id}`,
            server.name || `Server ${server.id}`,
            COLORS[colorIndex],
            resolvedTheme
          );
        });

      return {
        ...BASE_CHART_OPTIONS,
        data: allData,
        series,
        theme: resolvedTheme === 'dark' ? 'ag-default-dark' : 'ag-default',
        axes: {
          x: { ...BASE_AXES.x, min: minDate, max: maxDate },
          y: BASE_AXES.y,
        }
      } as AgCartesianChartOptions;
    } catch (error) {
      console.error('Error processing server stats:', error);
      return createEmptyChartOptions(resolvedTheme);
    }
  }, [globalStats, serverStats, resolvedTheme]);

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