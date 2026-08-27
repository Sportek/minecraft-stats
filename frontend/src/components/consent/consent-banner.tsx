"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useConsent } from "@/contexts/consent";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ReactNode, useEffect, useState } from "react";

/**
 * Le parcours de consentement : la bannière propose l'acceptation en un clic, le
 * refus se gagne en traversant « plus d'infos » → préférences → confirmation.
 * Choix produit assumé (cf. la demande d'un parcours de refus plus long) ; à noter
 * que le RGPD et les lignes directrices de la CNIL demandent l'inverse — refuser
 * doit être aussi simple qu'accepter.
 */
type Step = "banner" | "info" | "preferences" | "confirm";

/** Finalités optionnelles, cochées d'office : les décocher revient à refuser. */
const OPTIONAL_PURPOSES = ["audience", "improvement", "personalization"] as const;

type Purpose = (typeof OPTIONAL_PURPOSES)[number];

const ALL_ENABLED = Object.fromEntries(
  OPTIONAL_PURPOSES.map((purpose) => [purpose, true])
) as Record<Purpose, boolean>;

/** Secondes d'attente avant que le refus définitif devienne cliquable. */
const REFUSAL_DELAY_SECONDS = 5;

/** Ligne « finalité » : case à cocher, intitulé et explication. */
const PurposeRow = ({
  title,
  description,
  checked,
  disabled,
  hint,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  hint?: string;
  onCheckedChange?: (checked: boolean) => void;
}) => (
  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3">
    <Checkbox
      checked={checked}
      disabled={disabled}
      onCheckedChange={(value) => onCheckedChange?.(value === true)}
      className="mt-0.5"
    />
    <span className="min-w-0">
      <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
        {title}
        {hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
      </span>
      <span className="mt-1 block text-xs text-muted-foreground">{description}</span>
    </span>
  </label>
);

const ConsentBanner = () => {
  const { consent, grant, deny } = useConsent();
  const t = useTranslations("StaticPages");

  const [step, setStep] = useState<Step>("banner");
  const [purposes, setPurposes] = useState<Record<Purpose, boolean>>(ALL_ENABLED);
  const [countdown, setCountdown] = useState(REFUSAL_DELAY_SECONDS);

  // Décompte du dernier écran : le refus ne s'active qu'une fois arrivé à zéro.
  useEffect(() => {
    if (step !== "confirm" || countdown === 0) return;
    const timer = setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [step, countdown]);

  if (consent !== "unknown") return null;

  const link = (chunks: ReactNode) => (
    <Link href="/privacy" className="font-medium text-foreground underline underline-offset-2">
      {chunks}
    </Link>
  );

  const openConfirmation = () => {
    setCountdown(REFUSAL_DELAY_SECONDS);
    setStep("confirm");
  };

  // Tout décocher puis « continuer » n'est pas une acceptation : on bascule sur
  // l'écran de confirmation du refus.
  const savePreferences = () => {
    if (OPTIONAL_PURPOSES.some((purpose) => purposes[purpose])) {
      grant();
      return;
    }
    openConfirmation();
  };

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 p-4 text-card-foreground shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">{t.rich("consent.description", { link })}</p>
          <div className="flex shrink-0 flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => setStep("info")}
              className="text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
            >
              {t("consent.moreInfo")}
            </button>
            <Button variant="accent" size="lg" onClick={grant}>
              {t("consent.accept")}
            </Button>
          </div>
        </div>
      </div>

      {/* Fermer la fenêtre (croix, Échap) ramène à la bannière : aucun choix n'est
          enregistré tant que l'utilisateur n'a pas atteint le bout d'un parcours. */}
      <Dialog open={step !== "banner"} onOpenChange={(open) => !open && setStep("banner")}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          {step === "info" && (
            <>
              <DialogHeader>
                <DialogTitle>{t("consent.info.title")}</DialogTitle>
                <DialogDescription>{t.rich("consent.info.body", { link })}</DialogDescription>
              </DialogHeader>

              <div className="space-y-2">
                {OPTIONAL_PURPOSES.map((purpose) => (
                  <div key={purpose} className="rounded-lg border border-border p-3">
                    <p className="text-sm font-medium text-foreground">
                      {t(`consent.purposes.${purpose}.title`)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t(`consent.purposes.${purpose}.description`)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                <Button variant="accent" size="lg" onClick={grant}>
                  {t("consent.accept")}
                </Button>
                <button
                  type="button"
                  onClick={() => setStep("preferences")}
                  className="text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
                >
                  {t("consent.info.manage")}
                </button>
              </div>
            </>
          )}

          {step === "preferences" && (
            <>
              <DialogHeader>
                <DialogTitle>{t("consent.preferences.title")}</DialogTitle>
                <DialogDescription>{t("consent.preferences.body")}</DialogDescription>
              </DialogHeader>

              <div className="space-y-2">
                <PurposeRow
                  title={t("consent.preferences.necessary.title")}
                  description={t("consent.preferences.necessary.description")}
                  hint={t("consent.preferences.alwaysOn")}
                  checked
                  disabled
                />
                {OPTIONAL_PURPOSES.map((purpose) => (
                  <PurposeRow
                    key={purpose}
                    title={t(`consent.purposes.${purpose}.title`)}
                    description={t(`consent.purposes.${purpose}.description`)}
                    checked={purposes[purpose]}
                    onCheckedChange={(checked) =>
                      setPurposes((current) => ({ ...current, [purpose]: checked }))
                    }
                  />
                ))}
              </div>

              <div className="flex flex-col gap-3">
                <Button variant="accent" size="lg" onClick={savePreferences}>
                  {t("consent.preferences.save")}
                </Button>
                <button
                  type="button"
                  onClick={openConfirmation}
                  className="text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
                >
                  {t("consent.preferences.refuse")}
                </button>
              </div>
            </>
          )}

          {step === "confirm" && (
            <>
              <DialogHeader>
                <DialogTitle>{t("consent.confirm.title")}</DialogTitle>
                <DialogDescription>{t("consent.confirm.body")}</DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-3">
                <Button variant="accent" size="lg" onClick={grant}>
                  {t("consent.confirm.reconsider")}
                </Button>
                <button
                  type="button"
                  onClick={deny}
                  disabled={countdown > 0}
                  className="text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:no-underline disabled:opacity-60"
                >
                  {countdown > 0
                    ? t("consent.confirm.refuseCountdown", { seconds: countdown })
                    : t("consent.confirm.refuse")}
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ConsentBanner;
