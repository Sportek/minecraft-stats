import { Badge } from "@/components/ui/badge";
import type { Server } from "@/types/server";
import { useTranslations } from "next-intl";

const ModerationStatusBadge = ({ status }: { status: Server["moderationStatus"] }) => {
  const t = useTranslations("Admin.serversPending");
  if (status === "approved") return null;
  return (
    <Badge variant={status === "blocked" ? "destructive" : "outline"}>
      {status === "blocked" ? t("statusBlocked") : t("statusPending")}
    </Badge>
  );
};

export default ModerationStatusBadge;
