"use client";

import { getBaseUrl } from "@/app/_cheatcode";

export const register = async (credentials: { username: string; email: string; password: string }) => {
  console.log("url", getBaseUrl());
  console.log("credentials", credentials);
  const response = await fetch(`${getBaseUrl()}/register`, {
    method: "POST",
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw new Error("Failed to register");
  }
  return response.json();
};

export const verifyEmail = async (credentials: { token: string }) => {
  const response = await fetch(`${getBaseUrl()}/verify-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token: credentials.token }),
  });

  if (!response.ok) {
    throw new Error("Failed to verify email");
  }

  return response.json();
};

export const login = async (credentials: { email: string; password: string }) => {
  const response = await fetch(`${getBaseUrl()}/login`, {
    method: "POST",
    body: JSON.stringify(credentials),
  });
  return response.json();
};
