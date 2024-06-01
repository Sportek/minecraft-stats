import { getBaseUrl } from "@/app/_cheatcode";
import { Server } from "@/types/server";
import { getErrorMessage } from "./auth";

export const addMinecraftServer = async (data: { name: string; address: string; port: number }, token: string) => {
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

  return response.json() as Promise<Server[]>;
};
