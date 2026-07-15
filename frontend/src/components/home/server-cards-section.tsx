"use client";

import { Icon } from "@iconify/react/dist/iconify.js";
import ServerCard from "@/components/serveur/card";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FancyMultiSelect } from "@/components/ui/fancy-multi-select";
import { Pagination } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";
import { ServerTypeFilter, useServerFilters } from "./use-server-filters";

const PAGE_SIZE_OPTIONS = [12, 24, 36, 48] as const;

/**
 * Grille de serveurs de l'accueil : barre de filtres + cartes + pagination.
 * Purement présentationnelle — l'état et les données vivent dans
 * {@link useServerFilters}.
 */
const ServerCardsSection = () => {
  const t = useTranslations("Home");
  const f = useServerFilters();

  return (
    <section id="server-cards-section" className="w-full scroll-mt-8 space-y-6">
      <div className="space-y-3">
        {/* En-tête slim : titre + compteur sur une seule ligne, sans description. */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon icon="material-symbols:search" className="h-5 w-5 shrink-0 text-muted-foreground" />
            <h2 className="text-lg font-semibold tracking-tight text-foreground">{t("browse.title")}</h2>
          </div>
          {f.totalServers > 0 && (
            <span className="text-xs font-medium text-muted-foreground">
              {t("browse.tracked", { count: f.totalServers })}
            </span>
          )}
        </div>

        {/* Barre d'outils compacte : recherche + filtres + clear sur une ligne. */}
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-2 sm:flex-row sm:items-center">
          <FancyMultiSelect
            searchOnly
            placeholder={t("browse.searchPlaceholder")}
            onSearch={f.updateSearch}
            searchValue={f.search}
            className="sm:flex-1"
          />

          <div className="flex flex-wrap items-center gap-2">
            <FancyMultiSelect
              compact
              options={f.categories?.map((cat) => ({ id: cat.id, name: cat.name })) ?? []}
              selectedIds={f.selectedCategories}
              onChange={f.updateCategories}
              placeholder={t("browse.categories")}
              searchPlaceholder={t("browse.searchCategories")}
              emptyMessage={t("browse.noCategories")}
              className="flex-1 sm:flex-none"
            />
            <FancyMultiSelect
              compact
              options={f.languages?.map((lang) => ({ id: lang.id, name: lang.name, flag: lang.flag })) ?? []}
              selectedIds={f.selectedLanguages}
              onChange={f.updateLanguages}
              placeholder={t("browse.languages")}
              searchPlaceholder={t("browse.searchLanguages")}
              emptyMessage={t("browse.noLanguages")}
              className="flex-1 sm:flex-none"
            />
            <Select value={f.selectedType} onValueChange={(v) => f.updateType(v as ServerTypeFilter)}>
              <SelectTrigger aria-label={t("browse.editionAriaLabel")} className="h-9 flex-1 sm:w-auto sm:flex-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("browse.allEditions")}</SelectItem>
                <SelectItem value="java">Java</SelectItem>
                <SelectItem value="bedrock">Bedrock</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              onClick={f.clearFilters}
              aria-label={t("browse.clearFilters")}
              title={t("browse.clearFilters")}
              className={cn(
                "shrink-0 text-muted-foreground hover:text-foreground transition-opacity",
                f.hasActiveFilters ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Range caption + page size picker */}
      {f.totalServers > 0 && (
        <div className="flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            {t.rich("browse.showing", {
              start: f.rangeStart,
              end: f.rangeEnd,
              total: f.totalServers,
              strong: (chunks) => <span className="font-medium text-foreground">{chunks}</span>,
            })}
            <span className="mx-1.5">·</span>
            {t.rich("browse.page", {
              current: f.currentPage,
              total: f.totalPages,
              strong: (chunks) => <span className="font-medium text-foreground">{chunks}</span>,
            })}
          </span>
          <div className="flex items-center gap-2">
            <span>{t("browse.perPage")}</span>
            <Select value={String(f.pageSize)} onValueChange={(v) => f.updatePageSize(Number(v))}>
              <SelectTrigger aria-label={t("browse.perPageAriaLabel")} className="h-8 w-auto min-w-18 bg-secondary text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Cards grid */}
      {f.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: f.pageSize }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-lg" />
          ))}
        </div>
      ) : f.servers.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card py-16 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Icon icon="material-symbols:search-off" className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">{t("browse.noServersFound")}</p>
            <p className="text-xs text-muted-foreground">{t("browse.noServersHint")}</p>
          </div>
          {f.hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={f.clearFilters}>
              {t("browse.clearFilters")}
            </Button>
          )}
        </div>
      ) : (
        <div
          className={cn(
            "grid grid-cols-1 gap-4 transition-opacity duration-200 sm:grid-cols-2 lg:grid-cols-3",
            f.isFetching && "opacity-60"
          )}
        >
          {f.servers
            .filter((item) => item?.server)
            .map((item) => (
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

      <Pagination currentPage={f.currentPage} totalPages={f.totalPages} onPageChange={f.handlePageChange} />
    </section>
  );
};

export default ServerCardsSection;
