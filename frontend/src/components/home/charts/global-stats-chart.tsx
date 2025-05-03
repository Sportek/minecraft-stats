import { ServerStat } from "@/types/server";
import { AgAreaSeriesOptions, AgCartesianChartOptions } from "ag-charts-community";
import { AgChartsReact } from "ag-charts-react";
import { useTheme } from "next-themes";
import { useMemo } from "react";
import { Server } from "../selects/server-select";

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

export const GlobalStatsChart = ({ globalStats = [], serverStats = [], isLoading }: GlobalStatsChartProps) => {
  const { resolvedTheme } = useTheme();

  const options = useMemo(() => {
    // Vérifier si on a des données valides
    if (!Array.isArray(globalStats) && (!Array.isArray(serverStats) || serverStats.length === 0)) {
      return {
        autoSize: true,
        data: [],
        series: [],
        axes: [
          {
            type: 'time',
            position: 'bottom',
            label: {
              format: '%d/%m %H:%M',
            },
          },
          {
            type: 'number',
            position: 'left',
          },
        ],
        theme: resolvedTheme === 'dark' ? 'ag-default-dark' : 'ag-default',
        background: {
          fill: 'transparent',
        },
      } as AgCartesianChartOptions;
    }

    // Si on a des stats globales, les utiliser
    if (globalStats.length > 0) {
      const data = globalStats.map(stat => ({
        time: new Date(stat.createdAt || Date.now()),
        playerCount: stat.playerCount ?? 0
      }));

      return {
        autoSize: true,
        data,
        series: [{
          type: 'area',
          xKey: 'time',
          yKey: 'playerCount',
          yName: 'All monitored servers',
          stroke: resolvedTheme === 'dark' ? '#60A5FA' : '#2563EB',
          strokeWidth: 2,
          marker: {
            enabled: false,
          },
          fillOpacity: 0.1,
          fill: resolvedTheme === 'dark' ? '#60A5FA' : '#2563EB',
        }],
        axes: [
          {
            type: 'time',
            position: 'bottom',
            label: {
              format: '%d/%m %H:%M',
            },
          },
          {
            type: 'number',
            position: 'left',
          },
        ],
        legend: {
          enabled: true,
          position: 'bottom',
          toggleSeries: false
        },
        tooltip: {
          tracking: true,
          position: {
            type: 'pointer',
          }
        },
        theme: resolvedTheme === 'dark' ? 'ag-default-dark' : 'ag-default',
        background: {
          fill: 'transparent',
        },
      } as AgCartesianChartOptions;
    }

    // S'assurer que les stats du premier serveur existent pour les serveurs individuels
    const firstServerStats = serverStats[0]?.stats ?? [];
    if (firstServerStats.length === 0) {
      return {
        autoSize: true,
        data: [],
        series: [],
        axes: [
          {
            type: 'time',
            position: 'bottom',
            label: {
              format: '%d/%m %H:%M',
            },
          },
          {
            type: 'number',
            position: 'left',
          },
        ],
        theme: resolvedTheme === 'dark' ? 'ag-default-dark' : 'ag-default',
        background: {
          fill: 'transparent',
        },
      } as AgCartesianChartOptions;
    }

    // Préparer les données pour les serveurs individuels
    try {
      const allData = firstServerStats.map((stat: ServerStat) => {
        const basePoint: ChartDatum = {
          time: new Date(stat.createdAt || Date.now())
        };
        
        // Ajouter les données de chaque serveur
        serverStats.forEach(({ server, stats }) => {
          if (server && stats) {
            const matchingStat = stats.find(s => s?.createdAt === stat.createdAt);
            basePoint[`playerCount_${server.id}`] = matchingStat?.playerCount ?? 0;
          }
        });
        
        return basePoint;
      });

      // Créer une série pour chaque serveur
      const series = serverStats
        .filter(({ server, stats }) => server && stats && stats.length > 0)
        .map(({ server }, index) => {
          const colorIndex = index % COLORS.length;
          const color = COLORS[colorIndex];
          return {
            type: 'area',
            xKey: 'time',
            yKey: `playerCount_${server.id}`,
            yName: server.name || `Serveur ${server.id}`,
            stroke: resolvedTheme === 'dark' ? color.dark : color.light,
            strokeWidth: 2,
            marker: {
              enabled: false,
            },
            fillOpacity: 0.1,
            fill: resolvedTheme === 'dark' ? color.dark : color.light,
          };
        });

      return {
        autoSize: true,
        data: allData,
        series,
        axes: [
          {
            type: 'time',
            position: 'bottom',
            label: {
              format: '%d/%m %H:%M',
            },
          },
          {
            type: 'number',
            position: 'left',
          },
        ],
        legend: {
          enabled: true,
          position: 'bottom',
          toggleSeries: false
        },
        tooltip: {
          tracking: true,
          position: {
            type: 'pointer',
          }
        },
        theme: resolvedTheme === 'dark' ? 'ag-default-dark' : 'ag-default',
        background: {
          fill: 'transparent',
        },
      } as AgCartesianChartOptions;
    } catch (error) {
      console.error('Error processing server stats:', error);
      return {
        autoSize: true,
        data: [],
        series: [],
        axes: [
          {
            type: 'time',
            position: 'bottom',
            label: {
              format: '%d/%m %H:%M',
            },
          },
          {
            type: 'number',
            position: 'left',
          },
        ],
        theme: resolvedTheme === 'dark' ? 'ag-default-dark' : 'ag-default',
        background: {
          fill: 'transparent',
        },
      } as AgCartesianChartOptions;
    }
  }, [globalStats, serverStats, resolvedTheme]);

  return (
    <div className="h-64 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <AgChartsReact options={options} />
    </div>
  );
}; 