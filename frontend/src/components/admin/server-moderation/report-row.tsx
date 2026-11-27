import { Button } from "@/components/ui/button";
import type { AdminServerReport, ModerationVerdict } from "@/types/server";
import { CheckCheck, Loader2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import ModerationActions from "./moderation-actions";
import ServerHeading from "./server-heading";

interface ReportRowProps {
  report: AdminServerReport;
  acting: boolean;
  resolving: boolean;
  onVerdict: (verdict: ModerationVerdict) => void;
  onResolve: () => void;
}

const ReportRow = ({ report, acting, resolving, onVerdict, onResolve }: ReportRowProps) => {
  const t = useTranslations("Admin.serversPending");
  const format = useFormatter();
  const meta = t("reportedOn", {
    date: format.dateTime(new Date(report.createdAt), { dateStyle: "medium" }),
  });

  return (
    <li className="flex flex-col gap-3 p-4">
      <ServerHeading server={report.server} meta={meta} />

      <div className="rounded-md border border-border bg-secondary/30 px-3 py-2 text-sm">
        <p className="font-medium text-foreground">
          {t("reportReason", { reason: t(`reportReasons.${report.reason}`) })}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("reportedBy", { username: report.reporter.username })}
        </p>
        {report.details && <p className="mt-1 text-muted-foreground">{report.details}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ModerationActions
          status={report.server.moderationStatus}
          acting={acting}
          onVerdict={onVerdict}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={onResolve}
          disabled={resolving}
          className="gap-1.5"
        >
          {resolving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
          {t("resolveReport")}
        </Button>
      </div>
    </li>
  );
};

export default ReportRow;
