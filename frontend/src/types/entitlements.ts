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
 * est plus honnête que promettre une résolution que le backend refusera.
 *
 * `upgrade` est renseigné pour que les verrous et leur explication soient déjà
 * corrects au premier rendu, sans saut de mise en page. Ces valeurs ne font pas
 * autorité — l'API les écrase dès qu'elle répond, et c'est elle qui arbitre.
 */
export const GUEST_FALLBACK: Entitlements = {
  tier: "guest",
  maxStatBuckets: 1500,
  maxExportRows: 0,
  maxHistoryDays: 365,
  maxRhythmDays: 90,
  canExportStats: false,
  upgrade: {
    tier: "member",
    maxStatBuckets: 6000,
    maxExportRows: 50_000,
    maxHistoryDays: null,
    maxRhythmDays: 730,
    canExportStats: true,
  },
};
