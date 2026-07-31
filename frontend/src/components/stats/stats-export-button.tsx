"use client";

import { getBaseUrl } from "@/app/_cheatcode";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { LockIcon, useUnlock } from "@/components/upsell/unlock";
import { useAuth } from "@/contexts/auth";
import { serverStatsExportPath } from "@/http/server";
import { Entitlements } from "@/types/entitlements";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Period, toStatsQuery } from "./period";

interface StatsExportButtonProps {
  serverId: number;
  period: Period;
  entitlements: Entitlements;
}

/**
 * Télécharge la période affichée en CSV. Passe par `fetch` plutôt qu'un lien : le
 * jeton doit voyager en en-tête, pas dans une URL qui finirait dans l'historique
 * du navigateur et dans les logs.
 */
export const StatsExportButton = ({ serverId, period, entitlements }: StatsExportButtonProps) => {
  const t = useTranslations("Stats");
  const tUpsell = useTranslations("Upsell");
  const { getToken } = useAuth();
  const unlock = useUnlock();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  if (!entitlements.canExportStats) {
    // Le cadenas se règle sur ce qu'un compte apporterait, pas sur le simple fait
    // que le droit manque : sans palier supérieur à proposer (membre déjà connecté,
    // ou limites indisponibles), inviter à s'inscrire n'aurait aucun sens.
    if (!entitlements.upgrade?.canExportStats) return null;

    return (
      <Button
        variant="secondary"
        size="sm"
        className="h-9 gap-1.5 border-dashed"
        title={tUpsell("note.statsExport")}
        onClick={() => unlock("statsExport")}
      >
        <LockIcon />
        {t("export.label")}
      </Button>
    );
  }

  const download = async () => {
    setIsExporting(true);
    try {
      const { fromDate, toDate, interval } = toStatsQuery(period, Date.now());
      const path = serverStatsExportPath(serverId, { fromDate, toDate, interval, format: "csv" });
      const response = await fetch(`${getBaseUrl()}${path}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!response.ok) throw new Error(String(response.status));

      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `minecraft-stats-${serverId}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: t("export.failed"), variant: "error" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      className="h-9 gap-1.5"
      disabled={isExporting}
      onClick={download}
    >
      <Icon icon="material-symbols:download" className="h-4 w-4 shrink-0" />
      {t("export.label")}
    </Button>
  );
};
