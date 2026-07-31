"use client";

import { Icon } from "@iconify/react/dist/iconify.js";
import { axisTimeFormat, effectiveResolution } from "@/components/stats/period";
import { PeriodPicker } from "@/components/stats/period-picker";
import { SeriesModeToggle } from "@/components/stats/series-mode-toggle";
import { GlobalStatsChart } from "./charts/global-stats-chart";
import { ServerSelect } from "./selects/server-select";
import { CategorySelect } from "./selects/category-select";
import { LanguageSelect } from "./selects/language-select";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useGlobalInsight } from "./use-global-insight";

/**
 * Section "insight global" de l'accueil : filtres + graphe des joueurs. Purement
 * présentationnelle — toute la logique (sélection, cache, fetch) vit dans
 * {@link useGlobalInsight}.
 */
const GlobalInsightSection = () => {
  const t = useTranslations("Home");
  const insight = useGlobalInsight();

  return (
    <section className="w-full rounded-xl border border-border bg-card text-card-foreground shadow-xs">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:py-5">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5">
            <Icon icon="material-symbols:analytics-outline" className="h-5 w-5 shrink-0 text-muted-foreground" />
            <h2 className="text-lg font-semibold tracking-tight text-foreground">{t("globalInsight.title")}</h2>
          </div>
          <p className="text-sm text-muted-foreground sm:pl-9">{t("globalInsight.description")}</p>
        </div>
        <SeriesModeToggle value={insight.seriesMode} onChange={insight.setSeriesMode} />
      </div>

      <div className="flex flex-col gap-4 p-4 sm:p-6">
        {/* Filters wrap freely; each control grows on mobile so the row stays tidy. */}
        <div className="flex flex-wrap gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">
          <CategorySelect value={insight.selectedCategory} onChange={insight.setSelectedCategory} disabled={insight.filtersDisabled} />
          <LanguageSelect value={insight.selectedLanguage} onChange={insight.setSelectedLanguage} disabled={insight.filtersDisabled} />
          <PeriodPicker
            value={insight.period}
            onChange={insight.setPeriod}
            disabled={insight.controlsDisabled}
            allowance={insight.allowance}
          />
        </div>
        <ServerSelect selectedServers={insight.selectedServers} onChange={insight.handleSelectionChange} disabled={insight.controlsDisabled} />
        {insight.hasFavorites && (
          <div className="flex flex-row flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {insight.followingFavorites ? (
              <>
                <Star className="h-3.5 w-3.5 fill-current text-accent" />
                <span>
                  {t.rich("globalInsight.followingFavorites", {
                    count: insight.favoritesCount,
                    strong: (chunks) => <span className="font-medium text-foreground">{chunks}</span>,
                  })}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={insight.showAggregated}
                  disabled={insight.isLoading}
                >
                  {t("globalInsight.showAllServers")}
                </Button>
              </>
            ) : (
              <>
                <span>{t("globalInsight.customSelection")}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={insight.resetToFavorites}
                  disabled={insight.isLoading}
                >
                  <Star className="mr-1 h-3.5 w-3.5 fill-current" />
                  {t("globalInsight.resetToFavorites")}
                </Button>
              </>
            )}
          </div>
        )}
        <GlobalStatsChart
          globalStats={insight.globalStats}
          serverStats={insight.serverStats}
          seriesMode={insight.seriesMode}
          axisFormat={axisTimeFormat(effectiveResolution(insight.period))}
          isLoading={insight.isLoading}
        />
      </div>
    </section>
  );
};

export default GlobalInsightSection;
