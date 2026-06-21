import { cn } from "@/lib/utils";

interface DashboardStatTileProps {
  label: string;
  value: string;
  dot?: "success" | "muted";
}

/** Compact label + big-number tile used in the dashboard stat rows. */
const DashboardStatTile = ({ label, value, dot }: DashboardStatTileProps) => (
  <div className="rounded-lg border border-border bg-card p-4 shadow-xs">
    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
      {dot && (
        <span
          className={cn("h-2 w-2 rounded-full", dot === "success" ? "bg-success" : "bg-muted-foreground/50")}
        />
      )}
      {label}
    </div>
    <div className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">{value}</div>
  </div>
);

export default DashboardStatTile;
