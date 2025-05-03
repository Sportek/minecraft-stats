import { ServerStat } from "@/types/server";
import { AgChartOptions } from "ag-charts-community";
import { AgChartsReact } from "ag-charts-react";
import { useTheme } from "next-themes";
import { useMemo } from "react";

interface ServerChartProps {
  stats: ServerStat[];
}

const ServerChart = ({ stats }: ServerChartProps) => {
  const { resolvedTheme } = useTheme();

  const sortedData = useMemo(() => {
    return [...stats]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((stat) => ({
        time: new Date(stat.createdAt),
        playerCount: stat.playerCount ?? 0,
      }));
  }, [stats]);

  const formatDate = (date: Date) => {
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && 
                    date.getMonth() === now.getMonth() && 
                    date.getFullYear() === now.getFullYear();

    return isToday 
      ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      : date.toLocaleString('en-US', { 
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
  };

  const options = useMemo<AgChartOptions>(() => ({
    autoSize: true,
    data: sortedData,
    series: [
      {
        type: 'area',
        xKey: 'time',
        yKey: 'playerCount',
        stroke: resolvedTheme === 'dark' ? '#60A5FA' : '#2563EB',
        strokeWidth: 2,
        marker: {
          enabled: false,
        },
        fillOpacity: 0.1,
        fill: resolvedTheme === 'dark' ? '#60A5FA' : '#2563EB',
        lineDash: [0],
        strokeOpacity: 1,
        highlightStyle: {
          item: {
            fill: resolvedTheme === 'dark' ? '#93C5FD' : '#3B82F6',
            stroke: resolvedTheme === 'dark' ? '#93C5FD' : '#3B82F6',
            strokeWidth: 3,
          },
        },
      },
    ],
    axes: [
      {
        type: 'category',
        position: 'bottom',
        label: {
          enabled: false,
        },
        line: {
          enabled: false,
        },
        tick: {
          enabled: false,
        },
      },
      {
        type: 'number',
        position: 'left',
        label: {
          enabled: false,
        },
        line: {
          enabled: false,
        },
        tick: {
          enabled: false,
        },
      },
    ],
    padding: {
      top: 2,
      right: 2,
      bottom: 2,
      left: 2,
    },
    background: {
      fill: 'transparent',
    },
    legend: {
      enabled: false,
    },
  }), [sortedData, resolvedTheme]);

  return (
    <div className="w-full h-[40px]">
      <AgChartsReact options={options} />
    </div>
  );
};

export default ServerChart; 