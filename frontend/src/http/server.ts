import { getBaseUrl } from "@/app/_cheatcode";
import { Category, Server, ServerStat, ServerType } from "@/types/server";

export interface ServerPayload {
  name: string;
  address: string;
  port: number;
  type: ServerType;
  categories: string[];
}
// Note: GET /api/v1/servers is a lightweight endpoint that returns only { server } (no stats/categories).
// For richer data, use /servers/paginate or /servers/:id.
import { getErrorMessage } from "./auth";

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

export const addMinecraftServer = async (
  data: ServerPayload,
  token: string
) => {
  const response = await fetch(`${getBaseUrl()}/servers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 409) {
      const body = await response.json().catch(() => null);
      throw new DuplicateServerError(
        body?.message ?? "This server is already listed.",
        body?.existingServer ?? { id: 0, name: "" }
      );
    }
    const errorMessage = await getErrorMessage(response);
    throw new Error(errorMessage);
  }

  return response.json() as Promise<Server>;
};

export const getServers = async () => {
  const response = await fetch(`${getBaseUrl()}/servers`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorMessage = await getErrorMessage(response);
    throw new Error(errorMessage);
  }

  return response.json() as Promise<{ server: Server }[]>;
};

export const getServer = async (serverId: number) => {
  const response = await fetch(`${getBaseUrl()}/servers/${serverId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch server ${serverId}: ${response.status}`);
  }
  return response.json() as Promise<{ server: Server; stats: ServerStat[]; categories: Category[] }>;
};

export const getServerStats = async (
  serverId: number,
  fromDate: EpochTimeStamp,
  toDate: EpochTimeStamp,
  interval?: string
) => {
  const response = await fetch(
    `${getBaseUrl()}/servers/${serverId}/stats?fromDate=${fromDate}&toDate=${toDate}${
      interval ? `&interval=${interval}` : ""
    }`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorMessage = await getErrorMessage(response);
    throw new Error(errorMessage);
  }

  return response.json() as Promise<ServerStat[]>;
};

export const deleteServer = async (serverId: number, token: string) => {
  const response = await fetch(`${getBaseUrl()}/servers/${serverId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorMessage = await getErrorMessage(response);
    throw new Error(errorMessage);
  }

  return true;
};

export const editServer = async (
  serverId: number,
  data: ServerPayload,
  token: string
) => {
  const response = await fetch(`${getBaseUrl()}/servers/${serverId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorMessage = await getErrorMessage(response);
    throw new Error(errorMessage);
  }

  return response.json() as Promise<Server>;
};
