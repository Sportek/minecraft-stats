import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth";
import { reviewBoostReport } from "@/http/server";
import type { BoostStatus } from "@/types/server";
import { useTranslations } from "next-intl";
import { useState } from "react";

/** Serveur visé par un verdict : seul ce qu'il faut pour confirmer et appeler l'API. */
export interface BoostVerdictTarget {
  id: number;
  name: string;
}

/**
 * Verdict admin sur le gonflage des connectés, partagé par la file de revue et la page
 * d'édition d'un serveur : même confirmation, même note pour le journal, même endpoint.
 * `submitVerdict` renvoie `false` si l'admin a annulé ou si l'appel a échoué.
 */
export const useBoostVerdict = () => {
  const { getToken } = useAuth();
  const t = useTranslations("Admin.boostReports");
  const { toast } = useToast();
  const [actingId, setActingId] = useState<number | null>(null);

  const submitVerdict = async (target: BoostVerdictTarget, verdict: BoostStatus) => {
    const token = getToken();
    if (!token) return false;
    if (verdict === "boosting" && !confirm(t("confirmBoosting", { server: target.name }))) {
      return false;
    }
    const note = prompt(t("notePrompt")) ?? undefined;

    setActingId(target.id);
    try {
      await reviewBoostReport(target.id, verdict, token, note);
      toast({ variant: "success", description: t("saved") });
      return true;
    } catch (error) {
      toast({
        variant: "error",
        description: error instanceof Error ? error.message : t("error"),
      });
      return false;
    } finally {
      setActingId(null);
    }
  };

  return { submitVerdict, actingId };
};
