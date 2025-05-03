import { ServerStat } from "@/types/server";
import { AgCartesianAxisOptions, AgCartesianChartOptions, AgTimeAxisOptions } from "ag-charts-community";
import { AgCharts } from "ag-charts-react";
import { useTheme } from "next-themes";
import { useMemo } from "react";

interface ServerChartProps {
  stats: ServerStat[];
}

const BASE_AXES: [AgTimeAxisOptions, AgCartesianAxisOptions] = [
  {
    type: 'time',
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
    nice: false,
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
    }
  },
];

const BASE_CHART_OPTIONS: Partial<AgCartesianChartOptions> = {
  axes: BASE_AXES,
  legend: {
    enabled: false,
  },
  background: {
    fill: 'transparent',
  },
  padding: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  navigator: {
    enabled: false,
  },
  tooltip: {
    position: {
      type: 'pointer',
    }
  }
};

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

  const options = useMemo<AgCartesianChartOptions>(() => {
    // Calculer les dates min et max
    const dates = sortedData.map(d => d.time);
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    const timeAxis: AgTimeAxisOptions = {
      ...BASE_AXES[0],
      min: minDate,
      max: maxDate,
    };

    return {
      ...BASE_CHART_OPTIONS,
      data: sortedData,
      series: [
        {
          type: 'area',
          xKey: 'time',
          yKey: 'playerCount',
          yName: 'Online players',
          stroke: resolvedTheme === 'dark' ? '#60A5FA' : '#2563EB',
          strokeWidth: 2,
          marker: {
            enabled: false,
          },
          fillOpacity: 0.1,
          fill: resolvedTheme === 'dark' ? '#60A5FA' : '#2563EB',
          strokeOpacity: 1,
          interpolation: {
            type: 'smooth'
          }
        },
      ],
      axes: [timeAxis, BASE_AXES[1]],
      theme: resolvedTheme === 'dark' ? 'ag-default-dark' : 'ag-default',
    };
  }, [sortedData, resolvedTheme]);

  return (
    <div className="flex flex-col gap-2">
      <div className="h-[40px] relative">
        <div className="absolute inset-0">
          <AgCharts options={options} className="w-full h-full"/>
        </div>
      </div>
    </div>
  );
};

export default ServerChart; 