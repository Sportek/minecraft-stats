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
 * Le corps d'une page de classement : podium des 3 premiers, liste des
 * suivants, et JSON-LD `ItemList` pour les moteurs et les agents IA.
 * Entièrement server-rendered.
 */
const RankingList = ({ name, rows, emptyLabel, locale }: RankingListProps) => {
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

export default RankingList;
