"use client";

import { Button } from "@/components/ui/button";
import { useConsent } from "@/contexts/consent";
import Link from "next/link";

const ConsentBanner = () => {
  const { consent, grant, deny } = useConsent();

  if (consent !== "unknown") return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 p-4 text-card-foreground shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Nous mesurons l&apos;usage du site (pages visitées, trafic) pour l&apos;améliorer. Ces
          statistiques utilisent votre adresse IP (stockée de façon anonymisée) et votre navigateur.{" "}
          <Link href="/privacy" className="font-medium text-foreground underline underline-offset-2">
            En savoir plus
          </Link>
          .
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="ghost" size="sm" onClick={deny}>
            Refuser
          </Button>
          <Button variant="accent" size="sm" onClick={grant}>
            Accepter
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConsentBanner;
