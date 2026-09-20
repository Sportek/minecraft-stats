import { Skeleton } from "@/components/ui/skeleton";
import { PODIUM_SIZE, RANKING_LIMIT } from "@/http/rankings";

/**
 * Affiché dès le clic sur un onglet, sous la nav qui reste en place : reprend la
 * silhouette de la page (titre, podium, liste complète) pour que la transition ne saute pas.
 */
const RankingLoading = () => {
  return (
    <div className="space-y-8" aria-busy="true">
      <div className="space-y-3">
        <Skeleton className="h-9 w-3/4 sm:h-10" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>

      <div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
          <Skeleton className="h-44 rounded-xl sm:order-1" />
          <Skeleton className="h-52 rounded-xl sm:order-2" />
          <Skeleton className="h-44 rounded-xl sm:order-3" />
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {Array.from({ length: RANKING_LIMIT - PODIUM_SIZE }, (_, i) => (
            <Skeleton key={i} className="h-16.5 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default RankingLoading;
