/**
 * Modèle de la période affichée par les graphiques : quelle plage, à quelle
 * résolution. Partagé par l'accueil (insight global) et la page détail d'un
 * serveur, qui posaient jusqu'ici les mêmes tables chacun de leur côté.
 *
 * La résolution n'est pas l'égale de la plage : elle en découle. « Auto » la
 * dérive de la durée couverte, et l'utilisateur ne la fixe que s'il le veut.
 */

import { Entitlements, TierLimits } from "@/types/entitlements";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Tailles de bucket acceptées par l'API (`STAT_INTERVALS` côté backend). */
export const RESOLUTIONS = ["30 minutes", "1 hour", "6 hours", "1 day", "1 week"] as const;
export type Resolution = (typeof RESOLUTIONS)[number];

export const RESOLUTION_MS: Record<Resolution, number> = {
  "30 minutes": 30 * MINUTE,
  "1 hour": HOUR,
  "6 hours": 6 * HOUR,
  "1 day": DAY,
  "1 week": 7 * DAY,
};

export const PRESETS = ["24h", "7d", "30d", "3mo", "6mo", "1y", "2y", "all"] as const;
export type PresetId = (typeof PRESETS)[number];

/** `all` est absent : sa borne basse est résolue par le backend (1ʳᵉ donnée connue). */
const PRESET_RANGE_MS: Record<Exclude<PresetId, "all">, number> = {
  "24h": DAY,
  "7d": 7 * DAY,
  "30d": 30 * DAY,
  "3mo": 90 * DAY,
  "6mo": 180 * DAY,
  "1y": 365 * DAY,
  "2y": 730 * DAY,
};

export type Period =
  | { kind: "preset"; preset: PresetId; resolution: Resolution | "auto" }
  | { kind: "custom"; from: number; to: number; resolution: Resolution | "auto" };

export const DEFAULT_PERIOD: Period = { kind: "preset", preset: "7d", resolution: "auto" };

/**
 * Ce que le palier de l'utilisateur autorise, et ce qu'un compte débloquerait.
 * Les plafonds ne sont pas écrits ici : ils viennent de `GET /entitlements`, pour
 * qu'ils ne puissent pas dériver d'avec ceux que le backend applique réellement.
 */
export interface Allowance {
  limits: Pick<TierLimits, "maxStatBuckets" | "maxHistoryDays">;
  upgrade: Pick<TierLimits, "maxStatBuckets" | "maxHistoryDays"> | null;
}

export const toAllowance = (entitlements: Entitlements): Allowance => ({
  limits: entitlements,
  upgrade: entitlements.upgrade,
});

/** Durée couverte en ms, ou `null` pour « Tout » — seul le backend connaît la borne basse. */
export function periodRangeMs(period: Period): number | null {
  if (period.kind === "custom") return Math.max(0, period.to - period.from);
  return period.preset === "all" ? null : PRESET_RANGE_MS[period.preset];
}

/** Durée couverte en jours entiers, ou `null` pour « Tout » — même réserve que ci-dessus. */
export function periodRangeDays(period: Period): number | null {
  const rangeMs = periodRangeMs(period);
  return rangeMs === null ? null : Math.max(1, Math.round(rangeMs / DAY));
}

/**
 * Résolution automatique : la plus fine qui reste lisible sur la plage, et qui
 * ne fait pas basculer la requête sur la table brute pour rien (les buckets
 * < 1 h y forcent le backend, ce qui coûte cher au-delà de quelques jours).
 */
const AUTO_RESOLUTION: { upToMs: number; resolution: Resolution }[] = [
  { upToMs: 2 * DAY, resolution: "30 minutes" },
  { upToMs: 10 * DAY, resolution: "1 hour" },
  { upToMs: 100 * DAY, resolution: "6 hours" },
  { upToMs: 400 * DAY, resolution: "1 day" },
];

export function autoResolution(rangeMs: number | null): Resolution {
  if (rangeMs === null) return "1 week";
  return AUTO_RESOLUTION.find((step) => rangeMs <= step.upToMs)?.resolution ?? "1 week";
}

export function effectiveResolution(period: Period): Resolution {
  if (period.resolution !== "auto") return period.resolution;
  return autoResolution(periodRangeMs(period));
}

/** Nombre de points produits, ou `null` pour « Tout » (plage inconnue côté client). */
export function bucketCount(period: Period, resolution: Resolution): number | null {
  const rangeMs = periodRangeMs(period);
  if (rangeMs === null) return null;
  return Math.ceil(rangeMs / RESOLUTION_MS[resolution]);
}

export type Availability =
  | { available: true }
  | { available: false; reason: "tooManyPoints" | "rangeTooShort" | "beyondHistory" | "needsAccount" };

const UNAVAILABLE = {
  tooManyPoints: { available: false, reason: "tooManyPoints" },
  rangeTooShort: { available: false, reason: "rangeTooShort" },
  beyondHistory: { available: false, reason: "beyondHistory" },
  needsAccount: { available: false, reason: "needsAccount" },
} as const satisfies Record<string, Availability>;

/**
 * Une résolution est proposable si elle produit assez de points pour dessiner une
 * courbe, et pas plus que le palier n'en accorde. Pour « Tout », la plage est
 * ouverte : on ne garde que les buckets d'au moins un jour.
 *
 * `needsAccount` distingue « hors de portée » de « hors de *ton* palier » : c'est
 * ce qui permet d'afficher un cadenas plutôt qu'une pastille grise muette.
 */
export function resolutionAvailability(
  period: Period,
  resolution: Resolution,
  allowance: Allowance
): Availability {
  const count = bucketCount(period, resolution);
  if (count === null) {
    return RESOLUTION_MS[resolution] < DAY ? UNAVAILABLE.tooManyPoints : { available: true };
  }

  if (count < 2) return UNAVAILABLE.rangeTooShort;
  if (count <= allowance.limits.maxStatBuckets) return { available: true };
  if (allowance.upgrade && count <= allowance.upgrade.maxStatBuckets) return UNAVAILABLE.needsAccount;
  return UNAVAILABLE.tooManyPoints;
}

const withinHistory = (preset: PresetId, limits: Allowance["limits"]) => {
  if (limits.maxHistoryDays === null) return true;
  // « Tout » remonte à la première donnée connue : profondeur inconnue du client,
  // on ne la propose donc qu'aux paliers sans plafond d'historique.
  if (preset === "all") return false;
  return PRESET_RANGE_MS[preset] / DAY <= limits.maxHistoryDays;
};

/** Un raccourci est proposable si le palier ouvre un historique assez profond. */
export function presetAvailability(preset: PresetId, allowance: Allowance): Availability {
  if (withinHistory(preset, allowance.limits)) return { available: true };
  if (allowance.upgrade && withinHistory(preset, allowance.upgrade)) return UNAVAILABLE.needsAccount;
  return UNAVAILABLE.beyondHistory;
}

/**
 * Ramène une période dans les clous du palier courant. Sans ça, une déconnexion
 * (ou un palier qui se resserre) laisserait l'interface sur un choix que le
 * backend refuse, et le graphique afficherait une erreur au lieu d'une courbe.
 */
export function clampPeriod(period: Period, allowance: Allowance): Period {
  const resolution =
    period.resolution !== "auto" &&
    !resolutionAvailability(period, period.resolution, allowance).available
      ? "auto"
      : period.resolution;

  if (period.kind === "custom" || presetAvailability(period.preset, allowance).available) {
    return resolution === period.resolution ? period : { ...period, resolution };
  }

  const fallback = [...PRESETS].reverse().find((preset) => presetAvailability(preset, allowance).available);
  return { ...period, resolution, preset: fallback ?? "24h" };
}

/** Borne basse d'une plage personnalisée, ou `null` si le palier n'en impose pas. */
export function earliestSelectable(allowance: Allowance, now: number): number | null {
  const maxDays = allowance.limits.maxHistoryDays;
  return maxDays === null ? null : now - maxDays * DAY;
}

/**
 * Format d'étiquette de l'axe temporel. Au-delà du pas journalier, afficher
 * l'heure ne dit plus rien — et sur deux ans, « 01/11 00:00 » se répète.
 */
export function axisTimeFormat(resolution: Resolution): string {
  return RESOLUTION_MS[resolution] >= DAY ? "%d/%m/%y" : "%d/%m %H:%M";
}

export interface StatsQuery {
  /** Absent = depuis la première donnée connue. */
  fromDate?: number;
  toDate: number;
  interval: Resolution;
}

/**
 * `now` est passé par l'appelant plutôt que lu ici : les presets sont relatifs à
 * maintenant, et recalculer `Date.now()` à chaque rendu changerait la clé de cache
 * à chaque frame.
 */
export function toStatsQuery(period: Period, now: number): StatsQuery {
  const interval = effectiveResolution(period);

  if (period.kind === "custom") {
    return { fromDate: period.from, toDate: period.to, interval };
  }
  if (period.preset === "all") {
    return { toDate: now, interval };
  }
  return { fromDate: now - PRESET_RANGE_MS[period.preset], toDate: now, interval };
}

/**
 * Décale une période custom d'une durée entière vers le passé ou le futur, sans
 * jamais dépasser maintenant — c'est ce qui permet de comparer mai à avril d'un clic.
 */
export function shiftPeriod(period: Period, direction: -1 | 1, now: number): Period {
  if (period.kind !== "custom") return period;

  const span = period.to - period.from;
  const to = Math.min(period.to + direction * span, now);
  return { ...period, from: to - span, to };
}
