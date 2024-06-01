"use client";

import { getBaseUrl } from "@/app/_cheatcode";
import { User } from "@/types/auth";

export const registerUser = async (credentials: { username: string; email: string; password: string }) => {
  const response = await fetch(`${getBaseUrl()}/register`, {
    method: "POST",
    body: JSON.stringify(credentials),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorMessage = await getErrorMessage(response);
    throw new Error(errorMessage);
  }
  return response.json() as Promise<User>;
};

export const verifyEmail = async (credentials: { token: string }) => {
  const response = await fetch(`${getBaseUrl()}/verify-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorMessage = await getErrorMessage(response);
    throw new Error(errorMessage);
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
    const errorMessage = await getErrorMessage(response);
    throw new Error(errorMessage);
  }

  return response.json() as Promise<{
    accessToken: {
      type: string;
      token: string;
      expiresAt: Date;
    };
    user: User;
  }>;
};

export const getUser = async (token: string) => {
  const response = await fetch(`${getBaseUrl()}/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorMessage = await getErrorMessage(response);
    throw new Error(errorMessage);
  }

  const user = await response.json();
  return user.user as User | undefined;
};

export const changeUserPassword = async (credentials: { oldPassword: string; newPassword: string }, token: string) => {
  const response = await fetch(`${getBaseUrl()}/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorMessage = await getErrorMessage(response);
    throw new Error(errorMessage);
  }

  return response.json() as Promise<User>;
};

export const getErrorMessage = async (response: Response) => {
  const error = await response.json();
  const errorMessage = error?.error?.message || error?.errors?.[0]?.message || error?.message;
  return errorMessage;
};
