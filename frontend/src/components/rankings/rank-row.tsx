import { Link } from "@/i18n/navigation";
import { serverPath } from "@/lib/server-url";
import { cn } from "@/lib/utils";
import { RankingEntry } from "@/http/rankings";
import ServerImage from "@/components/serveur/card/server-image";
import ServerLanguages from "@/components/serveur/card/server-languages";
import { RankingMetric } from "./metric";

interface RankRowProps {
  rank: number;
  entry: RankingEntry;
  metric: RankingMetric;
}

const toneClass: Record<RankingMetric["tone"], string> = {
  up: "text-success",
  down: "text-destructive",
  neutral: "text-foreground",
};

/**
 * Ligne d'un classement (rangs 4+). Volontairement server-rendered et sobre
 * (pas de sparkline ni de boutons interactifs) : tout le contenu part dans le
 * HTML, bon pour le SEO et les agents qui lisent la page. Toute la ligne est un
 * lien vers la fiche serveur.
 */
const RankRow = ({ rank, entry, metric }: RankRowProps) => {
  const { server } = entry;

  return (
    <li>
      <Link
        href={serverPath(server.id, server.name)}
        className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-card-foreground shadow-xs transition-all duration-150 ease-in-out hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-md"
      >
        <span className="w-8 shrink-0 text-center text-base font-bold tabular-nums text-muted-foreground">
          {rank}
        </span>
        <ServerImage imageUrl={server.imageUrl} name={server.name} className="h-10 w-10" />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-semibold leading-tight text-foreground group-hover:text-accent">
              {server.name}
            </span>
            {server.languages?.length > 0 && (
              <ServerLanguages languages={server.languages} className="shrink-0" />
            )}
          </div>
          <span className="block truncate font-mono text-[13px] text-muted-foreground">
            {server.address.toLowerCase()}
          </span>
        </div>
        <div className="flex shrink-0 flex-col items-end">
          <span className={cn("text-base font-bold tabular-nums", toneClass[metric.tone])}>
            {metric.value}
          </span>
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{metric.label}</span>
        </div>
      </Link>
    </li>
  );
};

export default RankRow;
