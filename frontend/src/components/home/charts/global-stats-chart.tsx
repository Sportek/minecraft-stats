import { ServerStat } from "@/types/server";
import { AgAreaSeriesOptions, AgCartesianAxisOptions, AgCartesianChartOptions, AgTimeAxisOptions } from "ag-charts-community";
import { useTheme } from "next-themes";
import { useMemo } from "react";
import { Server } from "../selects/server-select";
import dynamic from 'next/dynamic';
import { generateTooltipHtml } from "@/components/serveur/card/tooltip-chart";

const AgCharts = dynamic(() => import('ag-charts-react').then(mod => mod.AgCharts), {
  ssr: false,
  loading: () => <div className="h-72 w-full bg-zinc-100 dark:bg-zinc-800" />,
  suspense: true
});

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

const BASE_AXES: AgCartesianAxisOptions[] = [
  {
    type: 'time',
    position: 'bottom',
    label: {
      format: '%d/%m %H:%M',
    },
    nice: false,
    min: undefined,
    max: undefined
  } as AgTimeAxisOptions,
  {
    type: 'number',
    position: 'left',
  },
];

const BASE_CHART_OPTIONS: Partial<AgCartesianChartOptions> = {
  container: undefined,
  axes: BASE_AXES,
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
    renderer: ({ datum }: any) => {
      return generateTooltipHtml(
        { time: new Date(datum.time), playerCount: datum[yKey] ?? 0 },
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
      const data = globalStats.map(stat => ({
        time: new Date(stat.createdAt || Date.now()),
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
        axes: [
          {
            ...BASE_AXES[0],
            min: minDate,
            max: maxDate,
          },
          BASE_AXES[1]
        ]
      } as AgCartesianChartOptions;
    }

    // S'assurer que les stats du premier serveur existent pour les serveurs individuels
    const firstServerStats = serverStats[0]?.stats ?? [];
    if (firstServerStats.length === 0) {
      return createEmptyChartOptions(resolvedTheme);
    }

    // Préparer les données pour les serveurs individuels
    try {
      const allData = firstServerStats.map((stat: ServerStat) => {
        const basePoint: ChartDatum = {
          time: new Date(stat.createdAt || Date.now())
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
            server.name || `Serveur ${server.id}`,
            COLORS[colorIndex],
            resolvedTheme
          );
        });

      return {
        ...BASE_CHART_OPTIONS,
        data: allData,
        series,
        theme: resolvedTheme === 'dark' ? 'ag-default-dark' : 'ag-default',
        axes: [
          {
            ...BASE_AXES[0],
            min: minDate,
            max: maxDate,
          },
          BASE_AXES[1]
        ]
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
          <div className="absolute inset-0 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <AgCharts options={options} />
      </div>
    </div>
  );
}; 