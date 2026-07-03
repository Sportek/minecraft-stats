import { ReactNode } from "react";
import Podium, { PodiumRow } from "./podium";
import RankRow from "./rank-row";
import { RankingsStructuredData } from "@/components/seo/structured-data";

interface RankingSectionProps {
  /** Ancre de section (navigation par onglets). */
  id: string;
  icon: ReactNode;
  title: string;
  description: string;
  rows: PodiumRow[];
  emptyLabel: string;
  locale: string;
}

/**
 * Une section de classement : en-tête (icône + titre + description), podium des
 * 3 premiers, puis la liste des suivants. Émet aussi un JSON-LD `ItemList` pour
 * les moteurs et les agents IA. Entièrement server-rendered.
 */
const RankingSection = ({ id, icon, title, description, rows, emptyLabel, locale }: RankingSectionProps) => {
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24">
      <div className="mb-5 flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
          {icon}
        </span>
        <div>
          <h2 id={`${id}-title`} className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
          {emptyLabel}
        </p>
      ) : (
        <>
          <RankingsStructuredData name={title} rows={rows} locale={locale} />
          {podium.length > 0 && <Podium rows={podium} />}
          {rest.length > 0 && (
            <ol className="mt-4 flex flex-col gap-2">
              {rest.map((row) => (
                <RankRow key={row.entry.server.id} rank={row.rank} entry={row.entry} metric={row.metric} />
              ))}
            </ol>
          )}
        </>
      )}
    </section>
  );
};

export default RankingSection;
