import type { User } from "@/types/auth";

export const isModerator = (user: Pick<User, "role"> | null | undefined): boolean =>
  user?.role === "admin" || user?.role === "support";
