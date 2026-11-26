"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/auth";
import { NOTE_MAX_LENGTH } from "@/lib/admin-note";
import { useRouter } from "@/i18n/navigation";
import type { ReportReason } from "@/types/server";
import { Flag, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useReportServer } from "./use-report-server";

const REASONS: ReportReason[] = [
  "scam",
  "inappropriate_content",
  "offline",
  "fake_playercount",
  "other",
];

interface ReportServerButtonProps {
  serverId: number;
  serverName: string;
}

/**
 * Signalement d'un serveur problématique — distinct de la file de modération à
 * la soumission : ça n'appose aucun verdict, ça met juste le serveur sous les
 * yeux d'un admin/support (cf. "Signalements" dans la page de modération).
 */
const ReportServerButton = ({ serverId, serverName }: ReportServerButtonProps) => {
  const t = useTranslations("Servers.report");
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const report = useReportServer(serverId);

  const handleClick = () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    report.setOpen(true);
  };

  return (
    <>
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClick}
              aria-label={t("button")}
              className="h-7 w-7 shrink-0 text-muted-foreground/60 hover:text-destructive"
            >
              <Flag className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("button")}</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog
        open={report.open}
        onOpenChange={(next) => {
          report.setOpen(next);
          if (!next) report.resetDialog();
        }}
      >
        <DialogContent className="sm:max-w-md">
          {report.submitted ? (
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              <DialogTitle>{t("success.title")}</DialogTitle>
              <DialogDescription>{t("success.body")}</DialogDescription>
              <Button variant="secondary" onClick={() => report.setOpen(false)} className="w-full">
                {t("success.close")}
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{t("dialogTitle", { name: serverName })}</DialogTitle>
                <DialogDescription>{t("dialogDescription")}</DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="report-reason">{t("reasonLabel")}</Label>
                  <Select
                    value={report.reason}
                    onValueChange={(value) => report.setReason(value as ReportReason)}
                  >
                    <SelectTrigger id="report-reason">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REASONS.map((reason) => (
                        <SelectItem key={reason} value={reason}>
                          {t(`reasons.${reason}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="report-details">{t("detailsLabel")}</Label>
                  <textarea
                    id="report-details"
                    value={report.details}
                    onChange={(event) => report.setDetails(event.target.value)}
                    placeholder={t("detailsPlaceholder")}
                    rows={4}
                    maxLength={NOTE_MAX_LENGTH}
                    className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <Button
                  onClick={report.submit}
                  disabled={report.submitting}
                  className="w-full gap-2"
                >
                  {report.submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t("submit")}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReportServerButton;
