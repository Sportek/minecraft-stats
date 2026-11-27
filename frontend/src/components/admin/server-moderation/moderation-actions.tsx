import { Button } from "@/components/ui/button";
import type { ModerationVerdict, Server } from "@/types/server";
import { Ban, Check, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface ModerationActionsProps {
  status: Server["moderationStatus"];
  acting: boolean;
  onVerdict: (verdict: ModerationVerdict) => void;
}

/** Approuver / débloquer / bloquer, selon le statut courant du serveur. */
const ModerationActions = ({ status, acting, onVerdict }: ModerationActionsProps) => {
  const t = useTranslations("Admin.serversPending");

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "approved" && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onVerdict("approved")}
          disabled={acting}
          className="gap-1.5"
        >
          {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {status === "blocked" ? t("verdictUnblock") : t("verdictApprove")}
        </Button>
      )}
      {status !== "blocked" && (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onVerdict("blocked")}
          disabled={acting}
          className="gap-1.5"
        >
          <Ban className="h-4 w-4" />
          {t("verdictBlock")}
        </Button>
      )}
    </div>
  );
};

export default ModerationActions;
