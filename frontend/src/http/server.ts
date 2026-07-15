import { Category, Server, ServerGrowthStat, ServerStat, ServerType } from "@/types/server";
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

export const getServerStats = (
  serverId: number,
  fromDate: EpochTimeStamp,
  toDate: EpochTimeStamp,
  interval?: string
) =>
  apiFetch<ServerStat[]>(
    `/servers/${serverId}/stats?fromDate=${fromDate}&toDate=${toDate}${
      interval ? `&interval=${interval}` : ""
    }`
  );

export const deleteServer = async (serverId: number, token: string) => {
  await apiFetch<void>(`/servers/${serverId}`, { method: "DELETE", token });
  return true;
};

export const editServer = (serverId: number, data: ServerPayload, token: string) =>
  apiFetch<Server>(`/servers/${serverId}`, { method: "PUT", token, body: data });
