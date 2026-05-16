export type AdPlacement = "home" | "server";
export type AdType = "custom" | "network";

export interface AdCategory {
  id: number;
  name: string;
}

/**
 * Publicité complète, telle que renvoyée par les endpoints admin.
 */
export interface Advertisement {
  id: number;
  name: string;
  type: AdType;
  htmlContent: string;
  enabled: boolean;
  weight: number;
  showOnHome: boolean;
  showOnServer: boolean;
  startsAt: string | null;
  endsAt: string | null;
  categories: AdCategory[];
  createdAt: string;
  updatedAt: string;
  /** Présents uniquement dans la liste admin. */
  impressionsCount?: number;
  clicksCount?: number;
}

/**
 * Forme allégée renvoyée par l'endpoint public de diffusion.
 */
export interface PublicAd {
  id: number;
  name: string;
  type: AdType;
  htmlContent: string;
  weight: number;
}

/**
 * Payload de création/mise à jour d'une publicité.
 */
export interface AdvertisementInput {
  name: string;
  type?: AdType;
  htmlContent: string;
  enabled?: boolean;
  weight?: number;
  showOnHome?: boolean;
  showOnServer?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  categoryIds?: number[];
}

export interface AdStatsPoint {
  time: string;
  impressions: number;
  clicks: number;
}

export interface AdStatsResponse {
  totals: { impressions: number; clicks: number };
  series: AdStatsPoint[];
  interval: "hour" | "day";
}
