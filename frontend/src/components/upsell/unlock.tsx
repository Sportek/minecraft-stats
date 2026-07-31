"use client";

import { useConsent } from "@/contexts/consent";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react/dist/iconify.js";
import { sendGTMEvent } from "@next/third-parties/google";
import { useCallback } from "react";

/**
 * Le geste commun à tous les verrous « réservé aux membres » : emmener vers la
 * création de compte, en notant lequel a déclenché le clic.
 *
 * Ce nom de fonctionnalité est le seul moyen de savoir *quel* verrou convertit —
 * et donc lesquels garder. L'événement suit le consentement analytics : sans
 * accord, on navigue sans rien mesurer.
 */
export function useUnlock() {
  const router = useRouter();
  const { consent } = useConsent();

  return useCallback(
    (feature: string) => {
      if (consent === "granted") sendGTMEvent({ event: "unlock_click", feature });
      router.push("/sign-up");
    },
    [router, consent]
  );
}

/** Cadenas des fonctionnalités verrouillées — même signe partout. */
export const LockIcon = ({ className }: { className?: string }) => (
  <Icon icon="material-symbols:lock-outline" className={cn("h-3.5 w-3.5 shrink-0", className)} />
);
