"use client";

import BoostStatusBadge from "@/components/admin/boost-status-badge";
import { Button } from "@/components/ui/button";
import { useBoostVerdict } from "@/hooks/use-boost-verdict";
import type { BoostStatus, Server } from "@/types/server";
import { Check, HelpCircle, Loader2, ShieldAlert, X } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

interface ServerBoostVerdictProps {
  server: Server;
  onSaved: () => void;
}

/**
 * Verdict admin sur le gonflage des connectés, depuis la page d'édition du serveur.
 *
 * La file de revue ne couvre que les serveurs assez actifs pour être scorés, et un
 * tricheur discret peut rester sous le seuil : l'admin doit pouvoir trancher sur
 * n'importe quel serveur. Le verdict passe par le même endpoint que la file, donc il
 * atterrit dans le même journal — sans score, il y figure comme un faux négatif de la
 * détection, utile pour recalibrer.
 */
const ServerBoostVerdict = ({ server, onSaved }: ServerBoostVerdictProps) => {
  const t = useTranslations("Admin.boostReports");
  const format = useFormatter();
  const { submitVerdict, actingId } = useBoostVerdict();
  const busy = actingId === server.id;

  const handleVerdict = async (verdict: BoostStatus) => {
    if (await submitVerdict({ id: server.id, name: server.name }, verdict)) onSaved();
  };

  return (
    <section className="mt-6 overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        <ShieldAlert className="h-5 w-5 shrink-0 text-foreground" />
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            {t("serverVerdict.title")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("serverVerdict.description")}</p>
        </div>
      </div>
      <div className="flex flex-col gap-4 px-6 py-5">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">{t("serverVerdict.current")}</span>
          {server.boostStatus ? (
            <BoostStatusBadge status={server.boostStatus} />
          ) : (
            <span className="text-foreground">{t("serverVerdict.none")}</span>
          )}
          {server.boostReviewedAt && (
            <span className="text-muted-foreground">
              ·{" "}
              {t("reviewedOn", {
                date: format.dateTime(new Date(server.boostReviewedAt), { dateStyle: "medium" }),
              })}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleVerdict("boosting")}
            disabled={busy || server.boostStatus === "boosting"}
            className="gap-1.5"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {t("verdictBoosting")}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleVerdict("clean")}
            disabled={busy || server.boostStatus === "clean"}
            className="gap-1.5"
          >
            <X className="h-4 w-4" />
            {t("verdictClean")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleVerdict("inconclusive")}
            disabled={busy || server.boostStatus === "inconclusive"}
            className="gap-1.5"
          >
            <HelpCircle className="h-4 w-4" />
            {t("verdictInconclusive")}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ServerBoostVerdict;
