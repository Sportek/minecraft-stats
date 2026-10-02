import { Badge } from "@/components/ui/badge";
import type { BoostStatus } from "@/types/server";
import { useTranslations } from "next-intl";

/** Verdict admin courant d'un serveur, tel qu'affiché dans les écrans d'administration. */
const BoostStatusBadge = ({ status }: { status: BoostStatus }) => {
  const t = useTranslations("Admin.boostReports");
  const labels: Record<BoostStatus, string> = {
    boosting: t("statusBoosting"),
    clean: t("statusClean"),
    inconclusive: t("statusInconclusive"),
  };
  return (
    <Badge variant={status === "boosting" ? "destructive" : "outline"}>{labels[status]}</Badge>
  );
};

export default BoostStatusBadge;
