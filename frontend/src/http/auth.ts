"use client";

import { getBaseUrl } from "@/app/_cheatcode";
import { User } from "@/types/auth";

export const registerUser = async (credentials: { username: string; email: string; password: string }) => {
  console.log(credentials);
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
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json() as Promise<User>;
};

export const loginUser = async (credentials: { email: string; password: string }) => {
  const response = await fetch(`${getBaseUrl()}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json() as Promise<User>;
};
