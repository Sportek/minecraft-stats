"use client";

import { ServerStat } from "@/types/server";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { TimeRangeSelect, TimeRangeType } from "./selects/time-range-select";
import { AggregationSelect, AggregationType } from "./selects/aggregation-select";
import { GlobalStatsChart } from "./charts/global-stats-chart";
import { Server, ServerSelect } from "./selects/server-select";
import { CategorySelect } from "./selects/category-select";
import { LanguageSelect } from "./selects/language-select";
import { getClientApiUrl } from "@/lib/domain";
import { useFavorite } from "@/contexts/favorite";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

const TIME_RANGE_OFFSETS: Record<TimeRangeType, number> = {
  "1 Day": 1000 * 60 * 60 * 24,
  "1 Week": 1000 * 60 * 60 * 24 * 7,
  "1 Month": 1000 * 60 * 60 * 24 * 30,
  "6 Months": 1000 * 60 * 60 * 24 * 30 * 6,
  "1 Year": 1000 * 60 * 60 * 24 * 30 * 12,
};

const AGGREGATION_INTERVALS: Record<AggregationType, string> = {
  "30 Minutes": "30 minutes",
  "1 Hour": "1 hour",
  "2 Hours": "2 hours",
  "6 Hours": "6 hours",
  "1 Day": "1 day",
  "1 Week": "1 week",
};

type ServerSeries = { server: Server; stats: ServerStat[] };

const GlobalInsightSection = () => {
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
  const apiUrl = getClientApiUrl();

  const [dataRangeInterval, setDataRangeInterval] = useState<TimeRangeType>("1 Week");
  const [dataAggregationInterval, setDataAggregationInterval] = useState<AggregationType>("30 Minutes");

  const selectedServers = useMemo(
    () => manualSelection ?? favorites,
    [manualSelection, favorites]
  );

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

  // Range/interval change → invalidation complète du cache (données obsolètes).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatsCache(new Map());
  }, [dataRangeInterval, dataAggregationInterval]);

  // Branche agrégée (selectedServers vide) : fetch /global-stats.
  useEffect(() => {
    if (selectedServers.length > 0) return;

    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    const now = Date.now();
    const interval = AGGREGATION_INTERVALS[dataAggregationInterval];
    const fromDate = now - TIME_RANGE_OFFSETS[dataRangeInterval];
    const toDate = now;

    let url = `${apiUrl}/global-stats?fromDate=${fromDate}&toDate=${toDate}&interval=${interval}`;
    if (selectedCategory) url += `&categoryId=${selectedCategory}`;
    if (selectedLanguage) url += `&languageId=${selectedLanguage}`;

    fetch(url, { signal: controller.signal })
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
  }, [selectedServers.length, dataAggregationInterval, dataRangeInterval, selectedCategory, selectedLanguage, apiUrl]);

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
    const now = Date.now();
    const interval = AGGREGATION_INTERVALS[dataAggregationInterval];
    const fromDate = now - TIME_RANGE_OFFSETS[dataRangeInterval];
    const toDate = now;

    Promise.all(
      missing.map(async (serverId) => {
        const [statsRes, serverRes] = await Promise.all([
          fetch(
            `${apiUrl}/servers/${serverId}/stats?fromDate=${fromDate}&toDate=${toDate}&interval=${interval}`,
            { signal: controller.signal }
          ),
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
  }, [selectedServers, statsCache, dataAggregationInterval, dataRangeInterval, apiUrl]);

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

  const hasFavorites = favorites.length > 0;
  const followingFavorites = hasFavorites && manualSelection === null;

  return (
    <section className="w-full rounded-xl border border-border bg-card text-card-foreground shadow-xs">
      <div className="flex flex-col gap-2 border-b border-border px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/10 text-accent">
            <Icon icon="material-symbols:analytics-outline" className="h-4 w-4" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Global Insight</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Compare aggregated player counts across servers, categories, and languages.
        </p>
      </div>

      <div className="flex flex-col gap-4 p-6">
        <div className="flex flex-row flex-wrap gap-2">
          <CategorySelect
            value={selectedCategory}
            onChange={setSelectedCategory}
            disabled={isLoading || selectedServers.length > 0}
          />
          <LanguageSelect
            value={selectedLanguage}
            onChange={setSelectedLanguage}
            disabled={isLoading || selectedServers.length > 0}
          />
          <TimeRangeSelect value={dataRangeInterval} onChange={setDataRangeInterval} disabled={isLoading} />
          <AggregationSelect
            value={dataAggregationInterval}
            onChange={setDataAggregationInterval}
            disabled={isLoading}
          />
        </div>
        <ServerSelect selectedServers={selectedServers} onChange={handleSelectionChange} disabled={isLoading} />
        {hasFavorites && (
          <div className="flex flex-row flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {followingFavorites ? (
              <>
                <Star className="h-3.5 w-3.5 fill-current text-accent" />
                <span>
                  Following your <span className="font-medium text-foreground">{favorites.length}</span> favorite
                  {favorites.length > 1 ? "s" : ""}.
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={showAggregated}
                  disabled={isLoading}
                >
                  Show all servers
                </Button>
              </>
            ) : (
              <>
                <span>Custom selection.</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={resetToFavorites}
                  disabled={isLoading}
                >
                  <Star className="mr-1 h-3.5 w-3.5 fill-current" />
                  Reset to favorites
                </Button>
              </>
            )}
          </div>
        )}
        <GlobalStatsChart globalStats={globalStats} serverStats={serverStats} isLoading={isLoading} />
      </div>
    </section>
  );
};

export default GlobalInsightSection;
