"use client";

import { useToast } from "@/components/ui/use-toast";
import { useModerationVerdict } from "@/hooks/use-moderation-verdict";
import { getServerReports, resolveServerReport } from "@/http/server";
import type { AdminServerReport, ModerationVerdict } from "@/types/server";
import { Flag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import ReportRow from "./report-row";

const ModerationReports = ({ token }: { token: string }) => {
  const t = useTranslations("Admin.serversPending");
  const { toast } = useToast();
  const { submitVerdict, actingId } = useModerationVerdict();
  const [reports, setReports] = useState<AdminServerReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  useEffect(() => {
    getServerReports(token)
      .then(setReports)
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, [token]);

  const handleVerdict = async (report: AdminServerReport, verdict: ModerationVerdict) => {
    const saved = await submitVerdict({ id: report.server.id, name: report.server.name }, verdict);
    if (!saved) return;
    setReports((current) =>
      current.map((r) =>
        r.id === report.id ? { ...r, server: { ...r.server, moderationStatus: verdict } } : r
      )
    );
  };

  const handleResolve = async (report: AdminServerReport) => {
    setResolvingId(report.id);
    try {
      await resolveServerReport(report.id, token);
      setReports((current) => current.filter((r) => r.id !== report.id));
      toast({ variant: "success", description: t("reportResolved") });
    } catch (error) {
      toast({ variant: "error", description: error instanceof Error ? error.message : t("error") });
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
      <div className="flex items-center gap-2 border-b border-border p-4">
        <Flag className="h-4 w-4 text-destructive" />
        <p className="text-sm font-semibold text-foreground">
          {t("reportsTitle", { count: reports.length })}
        </p>
      </div>
      {loading ? (
        <div className="px-6 py-8 text-center text-sm text-muted-foreground">{t("loadingList")}</div>
      ) : reports.length === 0 ? (
        <div className="px-6 py-8 text-center text-sm text-muted-foreground">{t("reportsEmpty")}</div>
      ) : (
        <ul className="divide-y divide-border">
          {reports.map((report) => (
            <ReportRow
              key={report.id}
              report={report}
              acting={actingId === report.server.id}
              resolving={resolvingId === report.id}
              onVerdict={(verdict) => handleVerdict(report, verdict)}
              onResolve={() => handleResolve(report)}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default ModerationReports;
