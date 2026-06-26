"use client";

import { Button } from "@/components/ui/button";
import { useConsent } from "@/contexts/consent";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ReactNode } from "react";

const ConsentBanner = () => {
  const { consent, grant, deny } = useConsent();
  const t = useTranslations("StaticPages");

  if (consent !== "unknown") return null;

  const link = (chunks: ReactNode) => (
    <Link href="/privacy" className="font-medium text-foreground underline underline-offset-2">
      {chunks}
    </Link>
  );

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 p-4 text-card-foreground shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">{t.rich("consent.description", { link })}</p>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="ghost" size="sm" onClick={deny}>
            {t("consent.decline")}
          </Button>
          <Button variant="accent" size="sm" onClick={grant}>
            {t("consent.accept")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConsentBanner;
