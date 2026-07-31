"use client";

import { useConsent } from "@/contexts/consent";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react/dist/iconify.js";
import { sendGTMEvent } from "@next/third-parties/google";
import { useTranslations } from "next-intl";
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

/**
 * Dit en toutes lettres ce qu'un compte apporte, avec le chiffre exact.
 *
 * Le cadenas seul ne suffit pas : au survol il n'affiche rien sur mobile, et même
 * au bureau il faut deviner ce qu'il y a derrière. Une phrase chiffrée à côté du
 * choix qu'on est en train de faire est la seule chose qui donne une raison de
 * créer un compte. Les chiffres viennent de `GET /entitlements`, jamais d'ici.
 */
export const UpsellNote = ({
  feature,
  children,
  className,
}: {
  feature: string;
  children: React.ReactNode;
  className?: string;
}) => {
  const t = useTranslations("Upsell");
  const unlock = useUnlock();

  return (
    <button
      type="button"
      onClick={() => unlock(feature)}
      className={cn(
        "flex w-full items-start gap-2 rounded-md border border-dashed border-accent/50 bg-accent/5 px-3 py-2 text-left text-xs text-muted-foreground",
        "transition-colors hover:border-accent hover:bg-accent/10",
        "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      <LockIcon className="mt-0.5 text-accent" />
      <span>
        {children}{" "}
        <span className="font-medium text-accent underline underline-offset-2">{t("cta")}</span>
      </span>
    </button>
  );
};
