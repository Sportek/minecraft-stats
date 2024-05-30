export type User = {
  id: number;
  username: string;
  email: string;
  verificationTokenExpires: Date;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Error = {
  error: string;
};

export type ErrorMessage = {
  message: string;
};
