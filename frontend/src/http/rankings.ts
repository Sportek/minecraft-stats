import { getBaseUrl } from "@/app/_cheatcode";
import { Category, Server, ServerGrowthStat, ServerStat } from "@/types/server";

/**
 * Classements des pages /rankings. Chaque tri est servi par le même endpoint
 * `/servers/paginate` (avec `?sort=`), donc chaque entrée a la forme d'une ligne
 * de classement standard : le serveur + ses stats 24h + ses relations.
 * Chaque tri est aussi le segment d'URL de sa page dédiée (/rankings/<sort>).
 */
export const RANKING_SORTS = ["players", "trending", "peak", "newest"] as const;

export type RankingSort = (typeof RANKING_SORTS)[number];

export const isRankingSort = (value: string): value is RankingSort =>
  (RANKING_SORTS as readonly string[]).includes(value);

export interface RankingEntry {
  server: Server;
  stats: ServerStat[];
  categories: Category[];
  growthStat: ServerGrowthStat | null;
}

export interface RankingResponse {
  data: RankingEntry[];
  meta: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
    firstPage: number;
  };
}

/**
 * Récupère un classement côté serveur (RSC) pour un rendu SEO-friendly. On passe
 * par `getBaseUrl()` (INTERNAL_API_URL en Docker) et non par le domaine public,
 * pour éviter les problèmes de loopback NAT. ISR : revalidation toutes les 10 min,
 * alignée sur le TTL du cache backend.
 */
export const getRanking = async (sort: RankingSort, limit = 15): Promise<RankingResponse> => {
  const response = await fetch(`${getBaseUrl()}/servers/paginate?sort=${sort}&limit=${limit}`, {
    next: { revalidate: 600 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${sort} ranking: ${response.status}`);
  }

  return response.json() as Promise<RankingResponse>;
};
