"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { useRouter } from "@/i18n/navigation";
import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import ClaimServerDialog from "./claim-server-dialog";

interface ClaimServerBannerProps {
  serverId: number;
  serverName: string;
  /** Le serveur est-il déjà revendiqué ? Si oui, le bandeau ne s'affiche pas. */
  verified: boolean;
}

/**
 * Bandeau d'appel à l'action « Ce serveur n'est pas revendiqué — c'est le vôtre ? »
 * affiché sur la page d'un serveur non vérifié (modèle Trustpilot). Point d'entrée
 * principal de la revendication, bien plus visible qu'un simple bouton.
 */
const ClaimServerBanner = ({ serverId, serverName, verified }: ClaimServerBannerProps) => {
  const t = useTranslations("Servers.claim");
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (verified) return null;

  const handleClick = () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setOpen(true);
  };

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <p className="font-semibold text-foreground">{t("banner.title")}</p>
          <p className="text-sm text-muted-foreground">{t("banner.subtitle")}</p>
        </div>
      </div>
      <Button variant="accent" onClick={handleClick} className="shrink-0 gap-1.5">
        <ShieldCheck className="h-4 w-4" />
        {t("button")}
      </Button>

      <ClaimServerDialog
        serverId={serverId}
        serverName={serverName}
        open={open}
        onOpenChange={setOpen}
        onVerified={() => router.refresh()}
      />
    </section>
  );
};

export default ClaimServerBanner;
