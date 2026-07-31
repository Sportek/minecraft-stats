"use client";

import { useAuth } from "@/contexts/auth";
import { getEntitlements } from "@/http/entitlements";
import { Entitlements, GUEST_FALLBACK } from "@/types/entitlements";
import useSWR from "swr";

/**
 * Limites du palier de l'utilisateur courant, et ce qu'un compte débloquerait.
 * Point d'entrée unique de tout ce qui est réservé aux membres : personne ne
 * recopie les plafonds, c'est l'API qui les dit.
 *
 * La clé SWR suit `isLoggedIn` plutôt que le jeton : le jeton vit dans
 * `localStorage`, le lire pendant le rendu ferait diverger serveur et client.
 */
export function useEntitlements(): Entitlements {
  const { getToken, isLoggedIn } = useAuth();

  const { data } = useSWR(["entitlements", isLoggedIn] as const, () => getEntitlements(getToken()));

  return data ?? GUEST_FALLBACK;
}
