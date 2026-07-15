import { ApiToken, CreateApiTokenInput, CreatedApiToken } from "@/types/api-token";
import { apiFetch } from "./client";

export const getApiTokens = (token: string) =>
  apiFetch<ApiToken[]>("/account/api-tokens", { token });

export const createApiToken = (input: CreateApiTokenInput, token: string) =>
  apiFetch<CreatedApiToken>("/account/api-tokens", { method: "POST", token, body: input });

export const revokeApiToken = async (id: string | number, token: string) => {
  await apiFetch<void>(`/account/api-tokens/${id}`, { method: "DELETE", token });
};
