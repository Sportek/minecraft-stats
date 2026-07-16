"use client";

import { localeHeaders } from "@/app/_cheatcode";
import { AccessToken, LinkedProvider, OAuthProvider, User } from "@/types/auth";
import { apiFetch } from "./client";

export const registerUser = (credentials: {
  username: string;
  email: string;
  password: string;
  turnstileToken?: string | null;
}) => apiFetch<User>("/register", { method: "POST", body: credentials, headers: localeHeaders() });

export const verifyEmail = (credentials: { token: string }) =>
  apiFetch<User>("/verify-email", { method: "POST", body: credentials, headers: localeHeaders() });

export const requestPasswordReset = (credentials: { email: string; turnstileToken?: string | null }) =>
  apiFetch<{ message: string }>("/forgot-password", {
    method: "POST",
    body: credentials,
    headers: localeHeaders(),
  });

export const resetPassword = (credentials: { token: string; password: string }) =>
  apiFetch<{ message: string }>("/reset-password", {
    method: "POST",
    body: credentials,
    headers: localeHeaders(),
  });

export const loginUser = (credentials: {
  email: string;
  password: string;
  turnstileToken?: string | null;
}) =>
  apiFetch<{ accessToken: AccessToken; user: User }>("/login", {
    method: "POST",
    body: credentials,
    headers: localeHeaders(),
  });

export const getUser = async (token: string) => {
  const body = await apiFetch<{ user?: User }>("/me", { token, headers: localeHeaders() });
  return body.user;
};

export const changeUserPassword = (
  credentials: { oldPassword: string; newPassword: string },
  token: string
) =>
  apiFetch<User>("/change-password", {
    method: "POST",
    token,
    body: credentials,
    headers: localeHeaders(),
  });

export const changeUsername = async (credentials: { username: string }, token: string) => {
  const body = await apiFetch<{ user: User }>("/change-username", {
    method: "POST",
    token,
    body: credentials,
    headers: localeHeaders(),
  });
  return body.user;
};

export const uploadUserAvatar = async (file: File, token: string) => {
  const formData = new FormData();
  formData.append("avatar", file);

  const body = await apiFetch<{ user: User }>("/account/avatar", {
    method: "POST",
    token,
    body: formData,
    headers: localeHeaders(),
  });
  return body.user;
};

export const confirmProviderLink = (credentials: { token: string }) =>
  apiFetch<{ accessToken: AccessToken; user: User }>("/link-provider", {
    method: "POST",
    body: credentials,
    headers: localeHeaders(),
  });

export const getLinkedProviders = async (token: string) => {
  const body = await apiFetch<{ providers: LinkedProvider[] }>("/account/providers", {
    token,
    headers: localeHeaders(),
  });
  return body.providers;
};

export const unlinkProvider = (provider: OAuthProvider, token: string) =>
  apiFetch<{ message: string }>(`/account/providers/${provider}`, {
    method: "DELETE",
    token,
    headers: localeHeaders(),
  });

export const logoutUser = (token: string) =>
  apiFetch<{ message: string }>("/logout", { method: "POST", token, headers: localeHeaders() });

export const logoutAllUser = (token: string) =>
  apiFetch<{ message: string }>("/logout-all", { method: "POST", token, headers: localeHeaders() });
