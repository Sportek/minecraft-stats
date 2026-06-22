import { ServerStat } from "@/types/server";
import type { AgCartesianAxisOptions, AgCartesianChartOptions, AgTimeAxisOptions } from "ag-charts-community";
import { useTheme } from "next-themes";
import { useMemo } from "react";
import dynamic from "next/dynamic";

// Register the AG Charts community modules and load the renderer in the same
// async chunk, keeping the heavy core out of the shared home chunk (every server
// card renders this sparkline). Option types above are `import type` (erased).
const AgCharts = dynamic(
  async () => {
    await import("@/lib/ag-charts");
    return (await import("ag-charts-react")).AgCharts;
  },
  {
    ssr: false,
    loading: () => <div className="h-[40px] w-full bg-foreground/10 animate-pulse rounded-sm" />,
  }
);

interface ServerChartProps {
  stats: ServerStat[];
}

const BASE_AXES: { x: AgTimeAxisOptions; y: AgCartesianAxisOptions } = {
  x: {
    type: "time",
    position: "bottom",
    label: { enabled: false, format: "%d/%m %H:%M" },
    line: { enabled: false },
    tick: { enabled: false },
    nice: false,
  },
  y: {
    type: "number",
    position: "left",
    label: { enabled: false },
    line: { enabled: false },
    tick: { enabled: false },
  },
};

// Note: la sparkline dans une ServerCard est purement décorative.
// Le tooltip et le hit testing sont désactivés — l'utilisateur clique la carte
// pour accéder au graphique interactif complet sur la page détail.
const BASE_CHART_OPTIONS: Partial<AgCartesianChartOptions> = {
  axes: { x: BASE_AXES.x, y: BASE_AXES.y },
  legend: { enabled: false },
  background: { fill: "transparent" },
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
  tooltip: { enabled: false },
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
    const dates = sortedData.map((d) => d.time);
    const minDate = dates.length > 0 ? new Date(Math.min(...dates.map((d) => d.getTime()))) : undefined;
    const maxDate = dates.length > 0 ? new Date(Math.max(...dates.map((d) => d.getTime()))) : undefined;

    const timeAxis: AgTimeAxisOptions = {
      ...BASE_AXES.x,
      min: minDate,
      max: maxDate,
    };

    return {
      ...BASE_CHART_OPTIONS,
      data: sortedData,
      series: [
        {
          type: "area",
          xKey: "time",
          xName: "Time",
          yKey: "playerCount",
          yName: "Online players",
          // Brand accent (hsl(204 100% 38%) light / 55% dark) to tie the sparkline
          // to the visual identity.
          stroke: resolvedTheme === "dark" ? "#1a9fff" : "#0077c2",
          strokeWidth: 1.6,
          marker: { enabled: false },
          tooltip: { enabled: false },
          fillOpacity: 0.14,
          fill: resolvedTheme === "dark" ? "#1a9fff" : "#0077c2",
          strokeOpacity: 1,
          interpolation: { type: "smooth" },
        },
      ],
      axes: { x: timeAxis, y: BASE_AXES.y },
      theme: resolvedTheme === "dark" ? "ag-default-dark" : "ag-default",
    };
  }, [sortedData, resolvedTheme]);

  return (
    <div className="pointer-events-none flex flex-col gap-2 select-none">
      <div className="relative h-[40px] overflow-hidden rounded-sm">
        <div className="absolute inset-0">
          <AgCharts options={options} className="h-full w-full" />
        </div>
      </div>
    </div>
  );
};

export default ServerChart;
