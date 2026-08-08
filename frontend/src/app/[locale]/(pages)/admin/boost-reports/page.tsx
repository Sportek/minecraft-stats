"use client";

import DashboardHero from "@/components/account/dashboard-hero";
import DashboardLayout from "@/components/account/dashboard-layout";
import { AdminLoadingState, AdminMessageState } from "@/components/admin/admin-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth";
import { getBoostReports, reviewBoostReport } from "@/http/server";
import { Link } from "@/i18n/navigation";
import type { AdminBoostReport, BoostStatus } from "@/types/server";
import { Check, HelpCircle, Loader2, ShieldAlert, X } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

/**
 * Signaux traduits côté interface. L'API peut en émettre de nouveaux avant que la
 * traduction n'existe : on retombe alors sur la clé brute plutôt que de faire planter
 * la page sur un signalement.
 */
const SIGNAL_KEYS = [
  "valueLattice",
  "stepLattice",
  "inertia",
  "rhythm",
  "flatness",
  "granularity",
  "slotsGlued",
] as const;

const isKnownSignal = (key: string): key is (typeof SIGNAL_KEYS)[number] =>
  SIGNAL_KEYS.includes(key as (typeof SIGNAL_KEYS)[number]);

/**
 * File de revue des serveurs suspectés de gonfler leur nombre de connectés.
 *
 * La page montre la preuve avant le verdict : un score nu ne permet pas de décider,
 * donc chaque signalement affiche sa décomposition signal par signal, avec la mesure
 * qui l'a déclenché. Le verdict n'est pas un simple oui/non — « non concluant » est
 * une réponse valide, et elle est enregistrée comme telle dans le journal qui servira
 * à recalibrer les seuils.
 */
const AdminBoostReportsPage = () => {
  const { user, getToken } = useAuth();
  const t = useTranslations("Admin.boostReports");
  const format = useFormatter();
  const { toast } = useToast();
  const token = getToken();

  const [reports, setReports] = useState<AdminBoostReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    getBoostReports(token)
      .then(setReports)
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, [token]);

  if (!user) return <AdminLoadingState label={t("loading")} />;
  if (user.role !== "admin") {
    return (
      <AdminMessageState
        tone="destructive"
        title={t("accessDenied")}
        description={t("adminOnly")}
      />
    );
  }

  const handleVerdict = async (report: AdminBoostReport, verdict: BoostStatus) => {
    if (!token) return;
    if (
      verdict === "boosting" &&
      !confirm(t("confirmBoosting", { server: report.server.name }))
    ) {
      return;
    }
    const note = prompt(t("notePrompt")) ?? undefined;

    setActingId(report.serverId);
    try {
      await reviewBoostReport(report.serverId, verdict, token, note);
      setReports((current) =>
        current.map((r) =>
          r.serverId === report.serverId
            ? { ...r, server: { ...r.server, boostStatus: verdict } }
            : r
        )
      );
      toast({ variant: "success", description: t("saved") });
    } catch (error) {
      toast({
        variant: "error",
        description: error instanceof Error ? error.message : t("error"),
      });
    } finally {
      setActingId(null);
    }
  };

  const pendingCount = reports.filter((r) => r.server.boostStatus === null).length;

  return (
    <DashboardLayout>
      <DashboardHero
        title={t("title")}
        subtitle={t("subtitle")}
        badge={t("queueBadge", { count: pendingCount })}
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
        {loading ? (
          <div className="px-6 py-12 text-center text-muted-foreground">{t("loadingList")}</div>
        ) : reports.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">{t("emptyTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("emptyDescription")}</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {reports.map((report) => (
              <li key={report.serverId} className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/servers/${report.serverId}`}
                      className="font-medium text-foreground hover:text-accent"
                    >
                      {report.server.name}
                    </Link>
                    <Badge variant="secondary">{report.server.address}</Badge>
                    {report.server.boostStatus && (
                      <Badge
                        variant={report.server.boostStatus === "boosting" ? "destructive" : "outline"}
                      >
                        {t(
                          report.server.boostStatus === "boosting"
                            ? "statusBoosting"
                            : report.server.boostStatus === "clean"
                              ? "statusClean"
                              : "statusInconclusive"
                        )}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={report.level === "likely" ? "destructive" : "outline"}>
                      {t(report.level === "likely" ? "levelLikely" : "levelWatch")}
                    </Badge>
                    <span className="font-mono text-lg font-semibold tabular-nums">
                      {report.score}
                      <span className="text-sm text-muted-foreground">/100</span>
                    </span>
                  </div>
                </div>

                {/* Le chiffre annoncé face à l'estimation, quand un multiplicateur est
                    identifié : c'est l'information qui fait basculer une décision. */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                  <span className="text-muted-foreground">
                    {t("announced")}{" "}
                    <span className="font-mono font-medium tabular-nums text-foreground">
                      {report.server.lastPlayerCount ?? "—"}
                    </span>
                  </span>
                  {report.estimatedRealPlayers !== null && (
                    <span className="text-muted-foreground">
                      {t("estimated")}{" "}
                      <span className="font-mono font-medium tabular-nums text-destructive">
                        {report.estimatedRealPlayers}
                      </span>
                    </span>
                  )}
                  {report.detectedFactor !== null && (
                    <Badge variant="destructive">
                      {t("factor", { factor: report.detectedFactor })}
                    </Badge>
                  )}
                </div>

                <div className="rounded-md border border-border bg-secondary/30 px-3 py-2">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("signalsTitle")}
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {report.signals.map((signal) => (
                      <li key={signal.key} className="flex gap-2 text-sm">
                        <span className="w-10 shrink-0 text-right font-mono tabular-nums text-destructive">
                          {t("points", { points: signal.points })}
                        </span>
                        <span>
                          <span className="font-medium">
                            {isKnownSignal(signal.key) ? t(`signals.${signal.key}`) : signal.key}
                          </span>{" "}
                          <span className="text-muted-foreground">— {signal.detail}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="text-xs text-muted-foreground">
                  {t("window", {
                    samples: report.samplesCount,
                    date: format.dateTime(new Date(report.computedAt), { dateStyle: "medium" }),
                  })}
                  {report.server.boostReviewedAt &&
                    ` · ${t("reviewedOn", {
                      date: format.dateTime(new Date(report.server.boostReviewedAt), {
                        dateStyle: "medium",
                      }),
                    })}`}
                </p>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleVerdict(report, "boosting")}
                    disabled={actingId === report.serverId}
                    className="gap-1.5"
                  >
                    {actingId === report.serverId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    {t("verdictBoosting")}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleVerdict(report, "clean")}
                    disabled={actingId === report.serverId}
                    className="gap-1.5"
                  >
                    <X className="h-4 w-4" />
                    {t("verdictClean")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVerdict(report, "inconclusive")}
                    disabled={actingId === report.serverId}
                    className="gap-1.5"
                  >
                    <HelpCircle className="h-4 w-4" />
                    {t("verdictInconclusive")}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminBoostReportsPage;
