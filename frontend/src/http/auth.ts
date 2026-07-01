"use client";

import { getBaseUrl, localeHeaders } from "@/app/_cheatcode";
import { AccessToken, User } from "@/types/auth";

export const registerUser = async (credentials: {
  username: string;
  email: string;
  password: string;
  turnstileToken?: string | null;
}) => {
  const response = await fetch(`${getBaseUrl()}/register`, {
    method: "POST",
    body: JSON.stringify(credentials),
    headers: {
      ...localeHeaders(),
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
      ...localeHeaders(),
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

export const requestPasswordReset = async (credentials: { email: string; turnstileToken?: string | null }) => {
  const response = await fetch(`${getBaseUrl()}/forgot-password`, {
    method: "POST",
    headers: {
      ...localeHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorMessage = await getErrorMessage(response);
    throw new Error(errorMessage);
  }

  return response.json() as Promise<{ message: string }>;
};

export const resetPassword = async (credentials: { token: string; password: string }) => {
  const response = await fetch(`${getBaseUrl()}/reset-password`, {
    method: "POST",
    headers: {
      ...localeHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorMessage = await getErrorMessage(response);
    throw new Error(errorMessage);
  }

  return response.json() as Promise<{ message: string }>;
};

export const loginUser = async (credentials: {
  email: string;
  password: string;
  turnstileToken?: string | null;
}) => {
  const response = await fetch(`${getBaseUrl()}/login`, {
    method: "POST",
    headers: {
      ...localeHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorMessage = await getErrorMessage(response);
    throw new Error(errorMessage);
  }

  return response.json() as Promise<{
    accessToken: AccessToken;
    user: User;
  }>;
};

export const getUser = async (token: string) => {
  const response = await fetch(`${getBaseUrl()}/me`, {
    method: "GET",
    headers: {
      ...localeHeaders(),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorMessage = await getErrorMessage(response);
    throw new Error(errorMessage);
  }

  const body = (await response.json()) as { user?: User };
  return body.user;
};

export const changeUserPassword = async (credentials: { oldPassword: string; newPassword: string }, token: string) => {
  const response = await fetch(`${getBaseUrl()}/change-password`, {
    method: "POST",
    headers: {
      ...localeHeaders(),
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

export const changeUsername = async (credentials: { username: string }, token: string) => {
  const response = await fetch(`${getBaseUrl()}/change-username`, {
    method: "POST",
    headers: {
      ...localeHeaders(),
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorMessage = await getErrorMessage(response);
    throw new Error(errorMessage);
  }

  const body = (await response.json()) as { user: User };
  return body.user;
};

export const uploadUserAvatar = async (file: File, token: string) => {
  const formData = new FormData();
  formData.append("avatar", file);

  const response = await fetch(`${getBaseUrl()}/account/avatar`, {
    method: "POST",
    headers: {
      ...localeHeaders(),
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorMessage = await getErrorMessage(response);
    throw new Error(errorMessage);
  }

  const body = (await response.json()) as { user: User };
  return body.user;
};

export const logoutUser = async (token: string) => {
  const response = await fetch(`${getBaseUrl()}/logout`, {
    method: "POST",
    headers: {
      ...localeHeaders(),
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorMessage = await getErrorMessage(response);
    throw new Error(errorMessage);
  }

  return response.json();
};

export const logoutAllUser = async (token: string) => {
  const response = await fetch(`${getBaseUrl()}/logout-all`, {
    method: "POST",
    headers: {
      ...localeHeaders(),
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorMessage = await getErrorMessage(response);
    throw new Error(errorMessage);
  }

  return response.json();
};

export const getErrorMessage = async (response: Response): Promise<string | undefined> => {
  const error = (await response.json()) as { error?: { message?: string }; errors?: { message?: string }[]; message?: string };
  const errorMessage = error?.error?.message || error?.errors?.[0]?.message || error?.message;
  return errorMessage;
};
