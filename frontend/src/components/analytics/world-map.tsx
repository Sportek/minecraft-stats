"use client";

import { ALPHA2_TO_NUMERIC } from "@/lib/country-alpha2-to-numeric";
import { AnalyticsCountry } from "@/types/analytics";
import { useFormatter } from "next-intl";
import { useTheme } from "next-themes";
import { useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

const GEO_URL = "/world-countries.json";

interface TooltipState {
  x: number;
  y: number;
  name: string;
  views: number;
}

/** Linear interpolation between two #rrggbb colors, returning an rgb() string. */
function lerpHex(from: string, to: string, t: number): string {
  const a = [1, 3, 5].map((i) => parseInt(from.slice(i, i + 2), 16));
  const b = [1, 3, 5].map((i) => parseInt(to.slice(i, i + 2), 16));
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

const WorldMap = ({ countries }: { countries: AnalyticsCountry[] }) => {
  const { resolvedTheme } = useTheme();
  const format = useFormatter();
  const isDark = resolvedTheme === "dark";
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // numeric ISO id (matches the topojson feature ids) → views
  const viewsByNumeric = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of countries) {
      const numeric = ALPHA2_TO_NUMERIC[c.country.toUpperCase()];
      if (numeric) map.set(numeric, c.views);
    }
    return map;
  }, [countries]);

  const max = useMemo(() => countries.reduce((mx, c) => Math.max(mx, c.views), 0), [countries]);

  const lowColor = isDark ? "#10243f" : "#dbeafe";
  const highColor = isDark ? "#3b82f6" : "#1d4ed8";
  const noDataColor = isDark ? "#1f2937" : "#eef2f6";
  const strokeColor = isDark ? "#0b1220" : "#ffffff";

  // Log scale: visit distributions are heavily skewed (a few big countries).
  const fillFor = (views: number) =>
    views > 0 && max > 0 ? lerpHex(lowColor, highColor, Math.log1p(views) / Math.log1p(max)) : noDataColor;

  return (
    <div className="relative">
      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{ scale: 150 }}
        width={800}
        height={380}
        style={{ width: "100%", height: "auto" }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const views = viewsByNumeric.get(String(geo.id)) ?? 0;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={fillFor(views)}
                  stroke={strokeColor}
                  strokeWidth={0.4}
                  onMouseMove={(event) => {
                    const container = event.currentTarget.ownerSVGElement?.parentElement;
                    const rect = container?.getBoundingClientRect();
                    setTooltip({
                      x: event.clientX - (rect?.left ?? 0),
                      y: event.clientY - (rect?.top ?? 0),
                      name: geo.properties.name,
                      views,
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none", cursor: "pointer", stroke: isDark ? "#ffffff" : "#111827", strokeWidth: 0.8 },
                    pressed: { outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md"
          style={{ left: tooltip.x, top: tooltip.y - 8 }}
        >
          <span className="font-medium">{tooltip.name}</span>
          {tooltip.views > 0 ? ` — ${format.number(tooltip.views)} views` : " — no data"}
        </div>
      )}

      <div className="mt-2 flex items-center justify-end gap-2 text-xs text-muted-foreground">
        <span>Fewer</span>
        <span
          className="h-2 w-24 rounded-full"
          style={{ background: `linear-gradient(to right, ${lowColor}, ${highColor})` }}
        />
        <span>More</span>
      </div>
    </div>
  );
};

export default WorldMap;
