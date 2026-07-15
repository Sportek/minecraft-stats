"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Check,
  Copy,
  Globe,
  Loader2,
  MessageSquareText,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { TokenMethod, useClaimFlow } from "./use-claim-flow";

interface ClaimServerDialogProps {
  serverId: number;
  serverName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Appelé une fois la propriété vérifiée (pour rafraîchir la page appelante). */
  onVerified?: () => void;
}

/**
 * Modale de revendication de propriété, contrôlée par l'appelant (bouton, bandeau,
 * page « Mes serveurs »). Purement présentationnelle : toute la logique vit dans
 * `useClaimFlow`. Trois preuves : MOTD (couverture max), DNS (sans coupure), manuelle.
 */
const ClaimServerDialog = ({
  serverId,
  serverName,
  open,
  onOpenChange,
  onVerified,
}: ClaimServerDialogProps) => {
  const t = useTranslations("Servers.claim");
  const flow = useClaimFlow(serverId, open, onVerified);

  const close = () => onOpenChange(false);

  // Bloc de vérification partagé MOTD/DNS : bouton « Vérifier » + état « en attente ».
  const verifyFooter = (method: TokenMethod) => (
    <>
      {flow.pending && (
        <div className="rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm">
          <p className="font-medium text-foreground">{t("pending.title")}</p>
          <p className="mt-0.5 text-muted-foreground">{t(`pending.${method}`)}</p>
          {flow.verifying && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              {t("pending.auto")}
            </p>
          )}
        </div>
      )}
      <div className="flex gap-2">
        <Button variant="ghost" onClick={flow.resetToChoose} className="flex-1">
          {t("back")}
        </Button>
        <Button
          variant="accent"
          onClick={() => flow.attempt(method)}
          disabled={flow.verifying}
          className="flex-1 gap-2"
        >
          {flow.verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {flow.pending ? t("recheck") : t("verify")}
        </Button>
      </div>
    </>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) flow.resetAll();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        {flow.done ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
              <Check className="h-7 w-7" />
            </div>
            <DialogTitle>
              {flow.done === "verified" ? t("success.verifiedTitle") : t("success.manualTitle")}
            </DialogTitle>
            <DialogDescription>
              {flow.done === "verified" ? t("success.verifiedBody") : t("success.manualBody")}
            </DialogDescription>
            <Button variant="secondary" onClick={close} className="w-full">
              {t("close")}
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t("dialogTitle", { name: serverName })}</DialogTitle>
              <DialogDescription>{t("dialogDescription")}</DialogDescription>
            </DialogHeader>

            {flow.step === "choose" && (
              <div className="flex flex-col gap-3">
                {flow.pendingManual && (
                  <p className="rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm text-muted-foreground">
                    {t("status.pendingManual")}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => flow.generate("motd")}
                  disabled={flow.loading}
                  className="flex items-start gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-secondary/50 disabled:opacity-50"
                >
                  <MessageSquareText className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="flex flex-col">
                    <span className="flex items-center gap-2 font-medium">
                      {t("method.motd.title")}
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                        {t("recommended")}
                      </span>
                    </span>
                    <span className="text-sm text-muted-foreground">{t("method.motd.subtitle")}</span>
                  </span>
                </button>

                {flow.dnsAvailable && (
                  <button
                    type="button"
                    onClick={() => flow.generate("dns")}
                    disabled={flow.loading}
                    className="flex items-start gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-secondary/50 disabled:opacity-50"
                  >
                    <Globe className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="flex flex-col">
                      <span className="font-medium">{t("method.dns.title")}</span>
                      <span className="text-sm text-muted-foreground">{t("method.dns.subtitle")}</span>
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => flow.setStep("manual")}
                  className="flex items-start gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-secondary/50"
                >
                  <UserCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="flex flex-col">
                    <span className="font-medium">{t("method.manual.title")}</span>
                    <span className="text-sm text-muted-foreground">{t("method.manual.subtitle")}</span>
                  </span>
                </button>
              </div>
            )}

            {flow.step === "motd" && flow.motd && (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">{t("motd.intro")}</p>
                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 break-all rounded bg-secondary/40 px-2 py-1.5 font-mono text-xs">
                    {flow.motd.value}
                  </code>
                  <Button variant="ghost" size="sm" onClick={() => flow.copy(flow.motd!.value)} className="shrink-0 gap-1">
                    {flow.copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {flow.copied ? t("copied") : t("copy")}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{t("motd.hint")}</p>
                {verifyFooter("motd")}
              </div>
            )}

            {flow.step === "dns" && flow.dns && (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">{t("dns.intro")}</p>
                <div className="flex flex-col gap-2 rounded-lg border border-border bg-secondary/30 p-3 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">{t("dns.recordType")}</span>
                    <code className="font-mono">{flow.dns.recordType}</code>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">{t("dns.recordName")}</span>
                    <code className="font-mono">{flow.dns.recordName ?? "@"}</code>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">{t("dns.recordValue")}</span>
                    <div className="flex items-center gap-2">
                      <code className="min-w-0 flex-1 break-all rounded bg-background px-2 py-1 font-mono text-xs">
                        {flow.dns.recordValue}
                      </code>
                      <Button variant="ghost" size="sm" onClick={() => flow.copy(flow.dns!.recordValue)} className="shrink-0 gap-1">
                        {flow.copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {flow.copied ? t("copied") : t("copy")}
                      </Button>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{t("dns.hint")}</p>
                {verifyFooter("dns")}
              </div>
            )}

            {flow.step === "manual" && (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">{t("manual.intro")}</p>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="claim-evidence">{t("manual.evidenceLabel")}</Label>
                  <textarea
                    id="claim-evidence"
                    value={flow.evidence}
                    onChange={(event) => flow.setEvidence(event.target.value)}
                    placeholder={t("manual.evidencePlaceholder")}
                    rows={4}
                    maxLength={2000}
                    className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="claim-url">{t("manual.urlLabel")}</Label>
                  <Input
                    id="claim-url"
                    value={flow.evidenceUrl}
                    onChange={(event) => flow.setEvidenceUrl(event.target.value)}
                    placeholder={t("manual.urlPlaceholder")}
                    type="url"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={flow.resetToChoose} className="flex-1">
                    {t("back")}
                  </Button>
                  <Button
                    variant="accent"
                    onClick={flow.submitManual}
                    disabled={flow.loading || flow.evidence.trim().length < 10}
                    className="flex-1 gap-2"
                  >
                    {flow.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                    {t("manual.submit")}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ClaimServerDialog;
