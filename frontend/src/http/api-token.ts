import { getBaseUrl } from "@/app/_cheatcode";
import { ApiToken, CreateApiTokenInput, CreatedApiToken } from "@/types/api-token";
import { getErrorMessage } from "./auth";

export const getApiTokens = async (token: string) => {
  const response = await fetch(`${getBaseUrl()}/account/api-tokens`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json() as Promise<ApiToken[]>;
};

export const createApiToken = async (input: CreateApiTokenInput, token: string) => {
  const response = await fetch(`${getBaseUrl()}/account/api-tokens`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json() as Promise<CreatedApiToken>;
};

export const revokeApiToken = async (id: string | number, token: string) => {
  const response = await fetch(`${getBaseUrl()}/account/api-tokens/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
};
