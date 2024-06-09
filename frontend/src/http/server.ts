import { getBaseUrl } from "@/app/_cheatcode";
import { Category, Server, ServerStat } from "@/types/server";
import { getErrorMessage } from "./auth";

export const addMinecraftServer = async (data: { name: string; address: string; port: number; categories: string[] }, token: string) => {
  const response = await fetch(`${getBaseUrl()}/servers`, {
    method: "POST",
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

  return response.json() as Promise<{ server: Server; stat: ServerStat; categories: Category[] }[]>;
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
