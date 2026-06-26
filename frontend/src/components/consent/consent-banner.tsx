"use client";

import { Button } from "@/components/ui/button";
import { useConsent } from "@/contexts/consent";
import { Link } from "@/i18n/navigation";

const ConsentBanner = () => {
  const { consent, grant, deny } = useConsent();

  if (consent !== "unknown") return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 p-4 text-card-foreground shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          We measure site usage (pages visited, traffic) to improve it. These statistics use your IP
          address (stored in an anonymized form) and your browser.{" "}
          <Link href="/privacy" className="font-medium text-foreground underline underline-offset-2">
            Learn more
          </Link>
          .
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="ghost" size="sm" onClick={deny}>
            Decline
          </Button>
          <Button variant="accent" size="sm" onClick={grant}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConsentBanner;
