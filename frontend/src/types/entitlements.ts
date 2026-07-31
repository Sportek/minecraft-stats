export type Tier = "guest" | "member";

/** Ce que le palier de l'appelant ouvre — miroir de `backend/app/constants/tiers.ts`. */
export interface TierLimits {
  tier: Tier;
  maxStatBuckets: number;
  maxExportRows: number;
  /** `null` = profondeur d'historique illimitée. */
  maxHistoryDays: number | null;
  maxRhythmDays: number;
  canExportStats: boolean;
}

export interface Entitlements extends TierLimits {
  /** Ce qu'un compte débloquerait, `null` quand il n'y a plus rien à débloquer. */
  upgrade: TierLimits | null;
}

/**
 * Repli le temps que `GET /entitlements` réponde (et pendant le rendu serveur).
 * Volontairement le palier le plus bas : afficher un verrou qu'on retire ensuite
 * est plus honnête que promettre une résolution que le backend refusera. Les
 * valeurs faisant autorité restent celles de l'API.
 */
export const GUEST_FALLBACK: Entitlements = {
  tier: "guest",
  maxStatBuckets: 1500,
  maxExportRows: 0,
  maxHistoryDays: 365,
  maxRhythmDays: 90,
  canExportStats: false,
  upgrade: null,
};
