"use client";

import useSWR from "swr";
import { useMemo } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import ServerCard from "@/components/serveur/card";
import { ServerData } from "@/app/(pages)/(index)/page";
import { fetcher } from "@/app/_cheatcode";
import { Skeleton } from "@/components/ui/skeleton";
import { getClientApiUrl } from "@/lib/domain";
import { MAX_FAVORITES, useFavorite } from "@/contexts/favorite";

interface PaginatedResponse {
  data: ServerData[];
  meta: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
  };
}

// Bloc dédié aux serveurs favoris, affiché en haut de la liste des serveurs et
// indépendant de la pagination du classement. Limité à MAX_FAVORITES serveurs.
// Les favoris peuvent donc aussi apparaître plus bas dans le classement : c'est
// volontaire, on garde le classement intact.
const FavoritesSection = () => {
  const apiUrl = getClientApiUrl();
  const { favorites, hydrated } = useFavorite();

  // Clé SWR basée sur l'ensemble trié des IDs : tant que l'ensemble des favoris
  // ne change pas, la clé reste stable (pas de refetch superflu).
  const idsKey = useMemo(() => [...favorites].sort((a, b) => a - b).join(","), [favorites]);

  const { data, isLoading } = useSWR<PaginatedResponse>(
    hydrated && idsKey.length > 0
      ? `${apiUrl}/servers/paginate?page=1&limit=${MAX_FAVORITES}&ids=${idsKey}`
      : null,
    fetcher,
    { keepPreviousData: true }
  );

  // Filtrage côté client par l'ensemble courant des favoris : retirer une étoile
  // fait disparaître la carte immédiatement, sans attendre le refetch.
  const favSet = useMemo(() => new Set(favorites), [favorites]);
  const servers = useMemo(
    () => (data?.data ?? []).filter((item) => item?.server && favSet.has(item.server.id)),
    [data?.data, favSet]
  );

  // Avant hydratation du localStorage ou sans favori : on n'affiche pas le bloc.
  if (!hydrated || favorites.length === 0) return null;

  return (
    <section id="favorites-section" className="w-full scroll-mt-8 space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/10 text-accent">
          <Icon icon="material-symbols:star-rounded" className="h-4 w-4" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Your favorites</h2>
        <span className="text-xs font-medium text-muted-foreground">
          {favorites.length}/{MAX_FAVORITES}
        </span>
      </div>

      {isLoading && servers.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: Math.min(favorites.length, 6) }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {servers.map((item) => (
            <ServerCard
              key={item.server.id}
              server={item.server}
              stats={item.stats}
              categories={item.categories}
              growthStat={item.growthStat}
              isFull={false}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default FavoritesSection;
