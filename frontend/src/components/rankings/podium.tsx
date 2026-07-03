import { Crown, Medal } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { serverPath } from "@/lib/server-url";
import { cn } from "@/lib/utils";
import { RankingEntry } from "@/http/rankings";
import ServerImage from "@/components/serveur/card/server-image";
import ServerLanguages from "@/components/serveur/card/server-languages";
import { RankingMetric } from "./metric";

export interface PodiumRow {
  rank: number;
  entry: RankingEntry;
  metric: RankingMetric;
}

interface PodiumProps {
  rows: PodiumRow[];
}

const toneClass: Record<RankingMetric["tone"], string> = {
  up: "text-success",
  down: "text-destructive",
  neutral: "text-foreground",
};

// Habillage or / argent / bronze par rang. Les couleurs amber/slate/orange
// rendent correctement en clair comme en sombre.
const podiumStyle: Record<number, { ring: string; badge: string; Icon: typeof Crown; order: string; raised: string }> = {
  1: {
    ring: "ring-amber-400/50",
    badge: "bg-amber-400/15 text-amber-500 ring-amber-400/40",
    Icon: Crown,
    order: "sm:order-2",
    raised: "sm:pt-8",
  },
  2: {
    ring: "ring-slate-300/50",
    badge: "bg-slate-300/15 text-slate-400 ring-slate-300/40",
    Icon: Medal,
    order: "sm:order-1",
    raised: "",
  },
  3: {
    ring: "ring-orange-500/40",
    badge: "bg-orange-500/15 text-orange-600 ring-orange-500/40 dark:text-orange-400",
    Icon: Medal,
    order: "sm:order-3",
    raised: "",
  },
};

/**
 * Podium des 3 premiers d'un classement. Le n°1 est mis en avant (centré et
 * surélevé en desktop). Rendu entièrement côté serveur.
 */
const Podium = ({ rows }: PodiumProps) => {
  return (
    <ol className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
      {rows.map(({ rank, entry, metric }) => {
        const { server } = entry;
        const style = podiumStyle[rank] ?? podiumStyle[3];

        return (
          <li key={server.id} className={cn("flex", style.order)}>
            <Link
              href={serverPath(server.id, server.name)}
              className={cn(
                "group flex w-full flex-col items-center gap-2 rounded-xl border border-border bg-card px-4 pb-5 pt-5 text-center text-card-foreground shadow-xs ring-1 transition-all duration-150 ease-in-out hover:-translate-y-0.5 hover:shadow-md",
                style.ring,
                style.raised,
              )}
            >
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold ring-1",
                  style.badge,
                )}
              >
                <style.Icon className="h-4 w-4" />
                {rank}
              </span>

              <ServerImage imageUrl={server.imageUrl} name={server.name} className="h-16 w-16" />

              <div className="flex min-w-0 max-w-full flex-col items-center gap-1">
                <div className="flex min-w-0 max-w-full items-center gap-2">
                  <span className="truncate text-lg font-bold leading-tight text-foreground group-hover:text-accent">
                    {server.name}
                  </span>
                  {server.languages?.length > 0 && (
                    <ServerLanguages languages={server.languages} className="shrink-0" />
                  )}
                </div>
                <span className="max-w-full truncate font-mono text-xs text-muted-foreground">
                  {server.address.toLowerCase()}
                </span>
              </div>

              <div className="mt-1 flex flex-col items-center">
                <span className={cn("text-2xl font-extrabold tabular-nums", toneClass[metric.tone])}>
                  {metric.value}
                </span>
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{metric.label}</span>
              </div>
            </Link>
          </li>
        );
      })}
    </ol>
  );
};

export default Podium;
