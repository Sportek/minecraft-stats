export type User = {
  id: number;
  username: string;
  email: string;
  verificationTokenExpires: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type Error = {
  error: string;
};

export type ErrorMessage = {
  message: string;
};
