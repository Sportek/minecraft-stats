import {
  AdminBoostReport,
  AdminOwnershipClaim,
  BoostStatus,
  Category,
  ClaimStatus,
  DailyRhythm,
  DnsInstructions,
  MotdInstructions,
  Server,
  ServerGrowthStat,
  ServerOwnershipClaim,
  ServerStat,
  ServerType,
} from "@/types/server";
import { apiFetch, ApiError } from "./client";

export interface ServerPayload {
  name: string;
  address: string;
  port: number;
  type: ServerType;
  categories: string[];
  languages?: string[];
  website?: string;
}

// Note: GET /api/v1/servers is a lightweight endpoint that returns only { server } (no stats/categories).
// For richer data, use /servers/paginate or /servers/:id.

export interface DuplicateServerInfo {
  id: number;
  name: string;
}

/**
 * Levée quand le backend répond 409 lors de la création : le serveur est
 * détecté comme déjà référencé (cf. DuplicateDetectionService côté backend).
 * Porte le serveur existant pour permettre à l'UI d'y renvoyer l'utilisateur.
 */
export class DuplicateServerError extends Error {
  readonly existingServer: DuplicateServerInfo;

  constructor(message: string, existingServer: DuplicateServerInfo) {
    super(message);
    this.name = "DuplicateServerError";
    this.existingServer = existingServer;
  }
}

export const addMinecraftServer = async (data: ServerPayload, token: string) => {
  try {
    return await apiFetch<Server>("/servers", { method: "POST", token, body: data });
  } catch (err) {
    // Conflit 409 = doublon : on remonte l'info du serveur existant à l'UI.
    if (err instanceof ApiError && err.status === 409) {
      const body = err.body as { message?: string; existingServer?: DuplicateServerInfo } | undefined;
      throw new DuplicateServerError(
        body?.message ?? "This server is already listed.",
        body?.existingServer ?? { id: 0, name: "" }
      );
    }
    throw err;
  }
};

export const getServers = () => apiFetch<{ server: Server }[]>("/servers");

export interface MyServerItem {
  server: Server;
  categories: Category[];
  growthStat: ServerGrowthStat | null;
}

export const getMyServers = (token: string) =>
  apiFetch<MyServerItem[]>("/servers/mine", { token });

export const getServer = (serverId: number) =>
  apiFetch<{ server: Server; stats: ServerStat[]; categories: Category[] }>(`/servers/${serverId}`);

/**
 * `fromDate` omis = depuis la première donnée connue du serveur (vue « Tout »).
 * Le jeton est facultatif : l'endpoint est public, mais un membre y a droit à plus
 * de points et à un historique plus profond (cf. `GET /entitlements`).
 */
export const getServerStats = (
  serverId: number,
  fromDate: EpochTimeStamp | undefined,
  toDate: EpochTimeStamp,
  interval?: string,
  token?: string | null
) => {
  const params = new URLSearchParams({ toDate: String(toDate) });
  if (fromDate !== undefined) params.set("fromDate", String(fromDate));
  if (interval) params.set("interval", interval);

  return apiFetch<ServerStat[]>(`/servers/${serverId}/stats?${params}`, {
    token: token ?? undefined,
  });
};

/** Journée type : l'historique replié sur 24 h, découpé dans le fuseau du lecteur. */
export const getServerDailyRhythm = (
  serverId: number,
  days: number,
  timezone: string,
  token?: string | null
) => {
  const params = new URLSearchParams({ days: String(days), timezone });

  return apiFetch<DailyRhythm>(`/servers/${serverId}/stats/daily-rhythm?${params}`, {
    token: token ?? undefined,
  });
};

/** URL de téléchargement de l'export — le jeton part en en-tête, pas dans l'URL. */
export const serverStatsExportPath = (
  serverId: number,
  query: { fromDate?: EpochTimeStamp; toDate: EpochTimeStamp; interval?: string; format: "csv" | "json" }
) => {
  const params = new URLSearchParams({ toDate: String(query.toDate), format: query.format });
  if (query.fromDate !== undefined) params.set("fromDate", String(query.fromDate));
  if (query.interval) params.set("interval", query.interval);

  return `/servers/${serverId}/stats/export?${params}`;
};

export const deleteServer = async (serverId: number, token: string) => {
  await apiFetch<void>(`/servers/${serverId}`, { method: "DELETE", token });
  return true;
};

export const editServer = (serverId: number, data: ServerPayload, token: string) =>
  apiFetch<Server>(`/servers/${serverId}`, { method: "PUT", token, body: data });

/* -------------------------------------------------------------------------- */
/*  Réclamation de propriété d'un serveur                                      */
/* -------------------------------------------------------------------------- */

/** État de propriété du serveur pour l'utilisateur courant + sa demande éventuelle. */
export const getClaimStatus = (serverId: number, token: string) =>
  apiFetch<ClaimStatus>(`/servers/${serverId}/claim`, { token });

/** Démarre (ou réutilise) une vérification MOTD et renvoie la chaîne à insérer dans la MOTD. */
export const startMotdClaim = (serverId: number, token: string) =>
  apiFetch<{ claim: ServerOwnershipClaim; motd: MotdInstructions }>(
    `/servers/${serverId}/claim/motd`,
    { method: "POST", token }
  );

/** Déclenche la vérification MOTD : ping le serveur et transfère la propriété si le jeton y est. */
export const verifyMotdClaim = (serverId: number, token: string) =>
  apiFetch<{ verified: boolean; server: Server }>(`/servers/${serverId}/claim/motd/verify`, {
    method: "POST",
    token,
  });

/** Démarre (ou réutilise) une vérification DNS et renvoie l'enregistrement TXT à publier. */
export const startDnsClaim = (serverId: number, token: string) =>
  apiFetch<{ claim: ServerOwnershipClaim; dns: DnsInstructions }>(
    `/servers/${serverId}/claim/dns`,
    { method: "POST", token }
  );

/** Déclenche la vérification DNS : transfère la propriété si le TXT est trouvé. */
export const verifyDnsClaim = (serverId: number, token: string) =>
  apiFetch<{ verified: boolean; server: Server }>(`/servers/${serverId}/claim/dns/verify`, {
    method: "POST",
    token,
  });

/** Soumet une demande manuelle (preuve + lien) pour revue admin. */
export const submitManualClaim = (
  serverId: number,
  data: { evidence: string; evidenceUrl?: string },
  token: string
) =>
  apiFetch<{ claim: ServerOwnershipClaim; message: string }>(
    `/servers/${serverId}/claim/manual`,
    { method: "POST", token, body: data }
  );

/* --- Admin : file de revue des demandes manuelles --- */

export const getPendingOwnershipClaims = (token: string) =>
  apiFetch<AdminOwnershipClaim[]>("/admin/ownership-claims", { token });

export const approveOwnershipClaim = (claimId: number, token: string, note?: string) =>
  apiFetch<{ message: string; server: Server }>(`/admin/ownership-claims/${claimId}/approve`, {
    method: "POST",
    token,
    body: { note },
  });

export const rejectOwnershipClaim = (claimId: number, token: string, note?: string) =>
  apiFetch<{ message: string }>(`/admin/ownership-claims/${claimId}/reject`, {
    method: "POST",
    token,
    body: { note },
  });

/* --- Admin : file de revue des connectés suspects --- */

export const getBoostReports = (token: string) =>
  apiFetch<AdminBoostReport[]>("/admin/boost-reports", { token });

export const reviewBoostReport = (
  serverId: number,
  verdict: BoostStatus,
  token: string,
  note?: string
) =>
  apiFetch<{ message: string; server: Server }>(`/admin/boost-reports/${serverId}/review`, {
    method: "POST",
    token,
    body: { verdict, note },
  });
