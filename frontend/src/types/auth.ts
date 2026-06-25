export type User = {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'writer' | 'admin';
  verificationTokenExpires: Date;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/** How a user signed up: `null` means email & password, otherwise the OAuth provider. */
export type RegistrationProvider = "discord" | "google" | null;

/**
 * Full profile exposed to admins. Builds on the public `User` shape (minus the
 * transient verification-token expiry) and adds fields hidden from the public
 * API: the registration `provider` and email `verified` status.
 */
export type AdminUserProfile = Omit<User, "verificationTokenExpires"> & {
  verified: boolean;
  provider: RegistrationProvider;
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
