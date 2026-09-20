import Podium, { PodiumRow } from "./podium";
import RankRow from "./rank-row";

interface RankingListProps {
  rows: PodiumRow[];
  emptyLabel: string;
}

/**
 * Le corps d'une page de classement : podium des 3 premiers et liste des
 * suivants. Entièrement server-rendered.
 */
const RankingList = ({ rows, emptyLabel }: RankingListProps) => {
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
    <div>
      <Podium rows={podium} />
      {rest.length > 0 && (
        <ol className="mt-4 flex flex-col gap-2">
          {rest.map((row) => (
            <RankRow key={row.entry.server.id} rank={row.rank} entry={row.entry} metric={row.metric} />
          ))}
        </ol>
      )}
    </div>
  );
};

export default RankingList;
