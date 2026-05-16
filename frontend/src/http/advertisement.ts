import { getBaseUrl } from "@/app/_cheatcode";
import {
  AdPlacement,
  AdStatsResponse,
  Advertisement,
  AdvertisementInput,
  PublicAd,
} from "@/types/advertisement";
import { getErrorMessage } from "./auth";

// --- Endpoints publics (diffusion) ---

/**
 * Récupère les publicités diffusables pour un emplacement donné.
 * Sur les pages serveur, categoryIds permet le ciblage par catégorie.
 */
export const getActiveAds = async (
  placement: AdPlacement,
  categoryIds?: number[]
): Promise<PublicAd[]> => {
  const params = new URLSearchParams({ placement });
  if (categoryIds && categoryIds.length > 0) {
    params.set("categoryIds", categoryIds.join(","));
  }

  const response = await fetch(`${getBaseUrl()}/advertisements?${params.toString()}`, {
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json() as Promise<PublicAd[]>;
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

const authHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export const getAdminAdvertisements = async (token: string): Promise<Advertisement[]> => {
  const response = await fetch(`${getBaseUrl()}/admin/advertisements`, {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json() as Promise<Advertisement[]>;
};

export const getAdminAdvertisement = async (
  id: number,
  token: string
): Promise<Advertisement> => {
  const response = await fetch(`${getBaseUrl()}/admin/advertisements/${id}`, {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json() as Promise<Advertisement>;
};

export const createAdvertisement = async (
  data: AdvertisementInput,
  token: string
): Promise<Advertisement> => {
  const response = await fetch(`${getBaseUrl()}/admin/advertisements`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json() as Promise<Advertisement>;
};

export const updateAdvertisement = async (
  id: number,
  data: Partial<AdvertisementInput>,
  token: string
): Promise<Advertisement> => {
  const response = await fetch(`${getBaseUrl()}/admin/advertisements/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json() as Promise<Advertisement>;
};

export const deleteAdvertisement = async (id: number, token: string): Promise<boolean> => {
  const response = await fetch(`${getBaseUrl()}/admin/advertisements/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return true;
};

export const getAdvertisementStats = async (
  id: number,
  token: string,
  options: { interval?: "hour" | "day"; fromDate?: number; toDate?: number } = {}
): Promise<AdStatsResponse> => {
  const params = new URLSearchParams();
  if (options.interval) params.set("interval", options.interval);
  if (options.fromDate) params.set("fromDate", String(options.fromDate));
  if (options.toDate) params.set("toDate", String(options.toDate));

  const response = await fetch(
    `${getBaseUrl()}/admin/advertisements/${id}/stats?${params.toString()}`,
    { headers: authHeaders(token) }
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json() as Promise<AdStatsResponse>;
};
