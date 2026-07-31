import { Entitlements } from "@/types/entitlements";
import { apiFetch } from "./client";

/** Limites du palier de l'appelant. Répond aussi aux anonymes (palier invité). */
export const getEntitlements = (token: string | null) =>
  apiFetch<Entitlements>("/entitlements", { token: token ?? undefined, cache: "no-store" });
