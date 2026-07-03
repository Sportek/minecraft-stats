import { RankingEntry, RankingSort } from "@/http/rankings";

export type MetricTone = "up" | "down" | "neutral";

export interface RankingMetric {
  /** Valeur mise en avant (déjà formatée selon la locale). */
  value: string;
  /** Libellé court sous la valeur (traduit). */
  label: string;
  tone: MetricTone;
}

/** Fonction de traduction minimale (compatible next-intl `getTranslations`). */
type Translate = (key: string) => string;
/**
 * Formatteur minimal (compatible next-intl `getFormatter`). Les options de
 * `dateTime` sont volontairement restreintes au sous-ensemble qu'on utilise :
 * le type complet de next-intl (use-intl) est plus étroit que
 * `Intl.DateTimeFormatOptions`, donc on reste sur ce qui est assignable.
 */
interface Formatter {
  number: (value: number) => string;
  dateTime: (value: Date, options?: { dateStyle?: "full" | "long" | "medium" | "short" }) => string;
}

const formatGrowth = (growth: number) => `${growth >= 0 ? "+" : ""}${Math.round(growth * 100)}%`;

/**
 * Métrique mise en avant pour une entrée de classement, selon le tri. Centralise
 * le choix du champ (joueurs actuels / croissance / pic / date) et son formatage
 * localisé, pour que podium et liste affichent exactement la même chose.
 */
export function buildMetric(
  sort: RankingSort,
  entry: RankingEntry,
  format: Formatter,
  t: Translate,
): RankingMetric {
  const { server, growthStat } = entry;

  switch (sort) {
    case "trending": {
      const growth = growthStat?.weeklyGrowth ?? 0;
      return {
        value: formatGrowth(growth),
        label: t("metrics.weeklyGrowth"),
        tone: growth >= 0 ? "up" : "down",
      };
    }
    case "peak":
      return {
        value: format.number(server.peakPlayerCount ?? 0),
        label: t("metrics.allTimePeak"),
        tone: "neutral",
      };
    case "newest":
      return {
        value: format.dateTime(new Date(server.createdAt), { dateStyle: "medium" }),
        label: t("metrics.added"),
        tone: "neutral",
      };
    case "players":
    default:
      return {
        value: format.number(server.lastPlayerCount ?? 0),
        label: t("metrics.playersOnline"),
        tone: "neutral",
      };
  }
}
