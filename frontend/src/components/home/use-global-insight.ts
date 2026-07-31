"use client";

import { useAuth } from "@/contexts/auth";
import { useFavorite } from "@/contexts/favorite";
import { useEntitlements } from "@/hooks/use-entitlements";
import { getClientApiUrl } from "@/lib/domain";
import { clampPeriod, DEFAULT_PERIOD, Period, toAllowance, toStatsQuery } from "@/components/stats/period";
import { SeriesMode } from "@/components/stats/series-mode-toggle";
import { ServerStat } from "@/types/server";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Server } from "./selects/server-select";

/** Query-string des bornes de la période, `fromDate` omis pour « Tout ». */
const periodQueryString = (period: Period) => {
  const { fromDate, toDate, interval } = toStatsQuery(period, Date.now());
  const params = new URLSearchParams({ toDate: String(toDate), interval });
  if (fromDate !== undefined) params.set("fromDate", String(fromDate));
  return params.toString();
};

/** Les lectures de stats sont publiques : le jeton n'y sert qu'à relever le palier. */
const bearer = (token: string | null) => (token ? { Authorization: `Bearer ${token}` } : undefined);

export type ServerSeries = { server: Server; stats: ServerStat[] };

/**
 * Toute la logique de la section "insight global" : sélection (favoris ou override
 * manuel), filtres, et chargement des stats (branche agrégée `/global-stats` vs
 * branche par-serveur avec cache incrémental). Isolée hors du composant de présentation.
 */
export function useGlobalInsight() {
  const { favorites } = useFavorite();
  const [globalStats, setGlobalStats] = useState<ServerStat[]>([]);
  // Cache par serverId. Évite de re-fetch les serveurs déjà connus quand
  // l'utilisateur ajoute/retire un favori. Invalidé seulement quand
  // range/interval changent (la donnée serait alors obsolète).
  const [statsCache, setStatsCache] = useState<Map<number, ServerSeries>>(() => new Map());
  // `manualSelection === null` → on suit les favoris. Sinon, override utilisateur.
  // Stocker null/array plutôt qu'un flag séparé permet de dériver `selectedServers`
  // au lieu d'un useEffect de sync (anti-pattern selon React docs).
  const [manualSelection, setManualSelection] = useState<number[] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Avoids a hydration mismatch: `isLoading` is true during SSR, but Radix Select
  // serializes `disabled` differently on the server. We only apply the disabled
  // state after mount so the first client render matches the server output.
  const [mounted, setMounted] = useState(false);
  const apiUrl = getClientApiUrl();

  const [selectedPeriod, setPeriod] = useState<Period>(DEFAULT_PERIOD);
  const [seriesMode, setSeriesMode] = useState<SeriesMode>("average");
  const { getToken } = useAuth();
  const entitlements = useEntitlements();
  const allowance = toAllowance(entitlements);
  // Dérivée : quand le palier se resserre (déconnexion), la période revient d'elle-même
  // dans les clous. `clampPeriod` rend l'objet inchangé quand il n'y a rien à corriger,
  // ce dont dépendent les effets ci-dessous pour ne pas boucler.
  const period = clampPeriod(selectedPeriod, allowance);
  const tier = entitlements.tier;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const selectedServers = useMemo(() => manualSelection ?? favorites, [manualSelection, favorites]);

  // The controls stay enabled until mount to keep SSR and the first client render
  // identical; once mounted, they reflect the real loading/selection state.
  const filtersDisabled = mounted && (isLoading || selectedServers.length > 0);
  const controlsDisabled = mounted && isLoading;

  const handleSelectionChange = useCallback(
    (next: number[]) => {
      const fingerprint = JSON.stringify([...next].sort());
      const favFingerprint = JSON.stringify([...favorites].sort());
      // Si la sélection matche pile les favoris, on reste en mode "suivre favoris".
      setManualSelection(fingerprint === favFingerprint ? null : next);
    },
    [favorites]
  );

  const resetToFavorites = useCallback(() => {
    setManualSelection(null);
  }, []);

  const showAggregated = useCallback(() => {
    setManualSelection([]);
  }, []);

  // Changement de période → invalidation complète du cache (données obsolètes).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatsCache(new Map());
  }, [period]);

  // Branche agrégée (selectedServers vide) : fetch /global-stats.
  useEffect(() => {
    if (selectedServers.length > 0) return;

    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);

    let url = `${apiUrl}/global-stats?${periodQueryString(period)}`;
    if (selectedCategory) url += `&categoryId=${selectedCategory}`;
    if (selectedLanguage) url += `&languageId=${selectedLanguage}`;

    fetch(url, { signal: controller.signal, headers: bearer(getToken()) })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch global stats");
        return r.json();
      })
      .then((data) => {
        if (controller.signal.aborted) return;
        setGlobalStats(data);
        setIsLoading(false);
      })
      .catch((err) => {
        if ((err as Error).name === "AbortError") return;
        console.error("Error fetching global stats:", err);
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [selectedServers.length, period, selectedCategory, selectedLanguage, apiUrl, tier, getToken]);

  // Branche par-serveur : fetch incrémental, seulement ce qui manque au cache.
  useEffect(() => {
    if (selectedServers.length === 0) return;

    const missing = selectedServers.filter((id) => !statsCache.has(id));
    if (missing.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    const query = periodQueryString(period);

    Promise.all(
      missing.map(async (serverId) => {
        const [statsRes, serverRes] = await Promise.all([
          fetch(`${apiUrl}/servers/${serverId}/stats?${query}`, {
            signal: controller.signal,
            headers: bearer(getToken()),
          }),
          fetch(`${apiUrl}/servers/${serverId}`, { signal: controller.signal }),
        ]);
        if (!statsRes.ok) throw new Error(`Failed to fetch stats for server ${serverId}`);
        if (!serverRes.ok) throw new Error(`Failed to fetch server ${serverId}`);
        const stats: ServerStat[] = await statsRes.json();
        const serverData = await serverRes.json();
        return { id: serverId, server: serverData.server as Server, stats };
      })
    )
      .then((results) => {
        if (controller.signal.aborted) return;
        setStatsCache((prev) => {
          const next = new Map(prev);
          for (const r of results) next.set(r.id, { server: r.server, stats: r.stats });
          return next;
        });
        setIsLoading(false);
      })
      .catch((err) => {
        if ((err as Error).name === "AbortError") return;
        console.error("Error fetching server stats:", err);
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [selectedServers, statsCache, period, apiUrl, tier, getToken]);

  // Vue projetée pour le chart : on lit le cache dans l'ordre de selectedServers.
  // Les entrées encore en vol sont juste absentes — le chart affiche les autres
  // sans flicker.
  const serverStats = useMemo<ServerSeries[]>(() => {
    if (selectedServers.length === 0) return [];
    const out: ServerSeries[] = [];
    for (const id of selectedServers) {
      const entry = statsCache.get(id);
      if (entry) out.push(entry);
    }
    return out;
  }, [selectedServers, statsCache]);

  return {
    selectedCategory,
    setSelectedCategory,
    selectedLanguage,
    setSelectedLanguage,
    period,
    setPeriod,
    allowance,
    seriesMode,
    setSeriesMode,
    selectedServers,
    handleSelectionChange,
    resetToFavorites,
    showAggregated,
    filtersDisabled,
    controlsDisabled,
    isLoading,
    globalStats,
    serverStats,
    favoritesCount: favorites.length,
    hasFavorites: favorites.length > 0,
    followingFavorites: favorites.length > 0 && manualSelection === null,
  };
}
