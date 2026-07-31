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
  if (data) return data;

  // Repli dégradé (appel en échec, backend en retard sur le front) : on garde les
  // plafonds les plus bas, mais on coupe `upgrade` pour un utilisateur déjà
  // connecté. Toute l'invitation à créer un compte est branchée sur `upgrade` —
  // sans ça, un membre se ferait proposer de s'inscrire, ce qui n'a aucun sens.
  return isLoggedIn ? { ...GUEST_FALLBACK, upgrade: null } : GUEST_FALLBACK;
}
