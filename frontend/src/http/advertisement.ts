import { getBaseUrl } from "@/app/_cheatcode";
import {
  AdPlacement,
  AdStatsResponse,
  Advertisement,
  AdvertisementInput,
  PublicAd,
} from "@/types/advertisement";
import { apiFetch } from "./client";

// --- Endpoints publics (diffusion) ---

/**
 * Récupère les publicités diffusables pour un emplacement donné.
 * Sur les pages serveur, categoryIds permet le ciblage par catégorie.
 */
export const getActiveAds = (placement: AdPlacement, categoryIds?: number[]): Promise<PublicAd[]> => {
  const params = new URLSearchParams({ placement });
  if (categoryIds && categoryIds.length > 0) {
    params.set("categoryIds", categoryIds.join(","));
  }
  return apiFetch<PublicAd[]>(`/advertisements?${params.toString()}`);
};

/**
 * Enregistre une impression. Best-effort : les erreurs sont silencieuses.
 */
export const recordAdImpression = (
  adId: number,
  placement: AdPlacement,
  serverId?: number
): void => {
  try {
    fetch(`${getBaseUrl()}/advertisements/${adId}/impression`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({ placement, serverId }),
    }).catch(() => {});
  } catch {
    // best-effort
  }
};

/**
 * Construit l'URL de redirection traquée pour un lien de publicité.
 */
export const buildAdClickUrl = (
  adId: number,
  targetUrl: string,
  placement: AdPlacement,
  serverId?: number
): string => {
  const params = new URLSearchParams({ to: targetUrl, placement });
  if (serverId !== undefined) {
    params.set("serverId", String(serverId));
  }
  return `${getBaseUrl()}/advertisements/${adId}/click?${params.toString()}`;
};

// --- Endpoints admin ---

export const getAdminAdvertisements = (token: string): Promise<Advertisement[]> =>
  apiFetch<Advertisement[]>("/admin/advertisements", { token });

export const getAdminAdvertisement = (id: number, token: string): Promise<Advertisement> =>
  apiFetch<Advertisement>(`/admin/advertisements/${id}`, { token });

export const createAdvertisement = (
  data: AdvertisementInput,
  token: string
): Promise<Advertisement> =>
  apiFetch<Advertisement>("/admin/advertisements", { method: "POST", token, body: data });

export const updateAdvertisement = (
  id: number,
  data: Partial<AdvertisementInput>,
  token: string
): Promise<Advertisement> =>
  apiFetch<Advertisement>(`/admin/advertisements/${id}`, { method: "PUT", token, body: data });

export const deleteAdvertisement = async (id: number, token: string): Promise<boolean> => {
  await apiFetch<void>(`/admin/advertisements/${id}`, { method: "DELETE", token });
  return true;
};

export const getAdvertisementStats = (
  id: number,
  token: string,
  options: { interval?: "hour" | "day"; fromDate?: number; toDate?: number } = {}
): Promise<AdStatsResponse> => {
  const params = new URLSearchParams();
  if (options.interval) params.set("interval", options.interval);
  if (options.fromDate) params.set("fromDate", String(options.fromDate));
  if (options.toDate) params.set("toDate", String(options.toDate));

  return apiFetch<AdStatsResponse>(
    `/admin/advertisements/${id}/stats?${params.toString()}`,
    { token }
  );
};
