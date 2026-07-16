/** How a user signed up: `null` means email & password, otherwise the OAuth provider. */
export type RegistrationProvider = "discord" | "google" | null;

/** OAuth providers that can be linked to an account as sign-in methods. */
export type OAuthProvider = "discord" | "google";

export type User = {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'writer' | 'admin';
  provider: RegistrationProvider;
  verificationTokenExpires: Date;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/** A confirmed OAuth sign-in method on the current account. */
export type LinkedProvider = {
  provider: OAuthProvider;
  linkedAt: string;
};

/**
 * Full profile exposed to admins. Builds on the public `User` shape (minus the
 * transient verification-token expiry) and adds the email `verified` status,
 * hidden from the public API.
 */
export type AdminUserProfile = Omit<User, "verificationTokenExpires"> & {
  verified: boolean;
};

export type Error = {
  error: string;
};

export type ErrorMessage = {
  message: string;
};

export type AccessToken = {
  type: "bearer",
  token: string,
  expiresAt: Date
};
