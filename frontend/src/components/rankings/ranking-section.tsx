import { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import Podium, { PodiumRow } from "./podium";
import RankRow from "./rank-row";
import { RankingsStructuredData } from "@/components/seo/structured-data";

interface RankingListProps {
  /** Titre du classement, repris dans le JSON-LD `ItemList`. */
  name: string;
  rows: PodiumRow[];
  emptyLabel: string;
  locale: string;
}

/**
 * Le corps d'un classement : podium des 3 premiers, liste des suivants, et
 * JSON-LD `ItemList` pour les moteurs et les agents IA. Partagé entre les
 * sections de la page hub et les pages de classement dédiées.
 */
export const RankingList = ({ name, rows, emptyLabel, locale }: RankingListProps) => {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <>
      <RankingsStructuredData name={name} rows={rows} locale={locale} />
      <Podium rows={podium} />
      {rest.length > 0 && (
        <ol className="mt-4 flex flex-col gap-2">
          {rest.map((row) => (
            <RankRow key={row.entry.server.id} rank={row.rank} entry={row.entry} metric={row.metric} />
          ))}
        </ol>
      )}
    </>
  );
};

interface RankingSectionProps {
  /** Ancre de section (navigation par onglets). */
  id: string;
  icon: ReactNode;
  title: string;
  description: string;
  rows: PodiumRow[];
  emptyLabel: string;
  locale: string;
  /** Lien vers la page du classement complet (/rankings/<sort>). */
  viewAllHref: string;
  viewAllLabel: string;
}

/**
 * Une section de classement de la page hub : en-tête (icône + titre +
 * description), aperçu du classement, puis lien vers la page complète.
 * Entièrement server-rendered.
 */
const RankingSection = ({
  id,
  icon,
  title,
  description,
  rows,
  emptyLabel,
  locale,
  viewAllHref,
  viewAllLabel,
}: RankingSectionProps) => {
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

      <RankingList name={title} rows={rows} emptyLabel={emptyLabel} locale={locale} />

      {rows.length > 0 && (
        <div className="mt-4">
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
          >
            {viewAllLabel}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </section>
  );
};

export default RankingSection;
