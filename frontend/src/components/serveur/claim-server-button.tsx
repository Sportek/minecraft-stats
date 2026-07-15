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
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth";
import {
  getClaimStatus,
  startDnsClaim,
  submitManualClaim,
  verifyDnsClaim,
} from "@/http/server";
import { useRouter } from "@/i18n/navigation";
import type { ClaimStatus, DnsInstructions } from "@/types/server";
import { BadgeCheck, Check, Copy, Globe, Loader2, ShieldCheck, UserCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface ClaimServerButtonProps {
  serverId: number;
  serverName: string;
  /** Le serveur a-t-il déjà un propriétaire vérifié ? (depuis le serveur, pour tout le monde). */
  verified: boolean;
}

type Step = "choose" | "dns" | "manual";

/**
 * Contrôle « Revendiquer ce serveur » de la page détail. Deux chemins de preuve :
 *  - DNS (self-service) : publier un enregistrement TXT, vérifié automatiquement.
 *  - Manuel (filet)     : soumettre une preuve revue par un admin.
 * Un badge public « Propriété vérifiée » remplace le bouton une fois le serveur revendiqué.
 */
const ClaimServerButton = ({ serverId, serverName, verified }: ClaimServerButtonProps) => {
  const t = useTranslations("Servers.claim");
  const { toast } = useToast();
  const { isLoggedIn, getToken } = useAuth();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("choose");
  const [status, setStatus] = useState<ClaimStatus | null>(null);
  const [dns, setDns] = useState<DnsInstructions | null>(null);
  const [evidence, setEvidence] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<"verified" | "manual" | null>(null);
  const [copied, setCopied] = useState(false);

  // Propriété déjà confirmée : signal de confiance public, pas de bouton.
  if (verified) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
        <BadgeCheck className="h-3.5 w-3.5" />
        {t("verifiedBadge")}
      </span>
    );
  }

  const openDialog = async () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setOpen(true);
    setStep("choose");
    setDone(null);
    const token = getToken();
    if (!token) return;
    const current = await getClaimStatus(serverId, token).catch(() => null);
    if (current) setStatus(current);
  };

  const handleGenerateDns = async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const result = await startDnsClaim(serverId, token);
      setDns(result.dns);
      setStep("dns");
    } catch (error) {
      toast({
        variant: "error",
        description: error instanceof Error ? error.message : t("errors.generic"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDns = async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const result = await verifyDnsClaim(serverId, token);
      if (result.verified) setDone("verified");
    } catch (error) {
      toast({
        variant: "error",
        description: error instanceof Error ? error.message : t("errors.generic"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitManual = async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      await submitManualClaim(serverId, { evidence, evidenceUrl: evidenceUrl || undefined }, token);
      setDone("manual");
    } catch (error) {
      toast({
        variant: "error",
        description: error instanceof Error ? error.message : t("errors.generic"),
      });
    } finally {
      setLoading(false);
    }
  };

  const copyValue = async () => {
    if (!dns) return;
    await navigator.clipboard.writeText(dns.recordValue).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pendingManual = status?.claim?.status === "pending" && status.claim.method === "manual";

  return (
    <>
      <Button variant="secondary" size="sm" onClick={openDialog} className="gap-1.5">
        <ShieldCheck className="h-4 w-4" />
        {t("button")}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setStep("choose");
            setDns(null);
            setDone(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          {done ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
                <Check className="h-7 w-7" />
              </div>
              <DialogTitle>
                {done === "verified" ? t("success.verifiedTitle") : t("success.manualTitle")}
              </DialogTitle>
              <DialogDescription>
                {done === "verified" ? t("success.verifiedBody") : t("success.manualBody")}
              </DialogDescription>
              <Button variant="secondary" onClick={() => setOpen(false)} className="w-full">
                {t("close")}
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{t("dialogTitle", { name: serverName })}</DialogTitle>
                <DialogDescription>{t("dialogDescription")}</DialogDescription>
              </DialogHeader>

              {pendingManual && step === "choose" && (
                <p className="rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm text-muted-foreground">
                  {t("status.pendingManual")}
                </p>
              )}

              {step === "choose" && (
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => (status?.dnsAvailable === false ? undefined : handleGenerateDns())}
                    disabled={status?.dnsAvailable === false || loading}
                    className="flex items-start gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-secondary/50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Globe className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="flex flex-col">
                      <span className="font-medium">{t("method.dns.title")}</span>
                      <span className="text-sm text-muted-foreground">
                        {status?.dnsAvailable === false
                          ? t("method.dns.unavailable")
                          : t("method.dns.subtitle")}
                      </span>
                    </span>
                    {loading && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep("manual")}
                    className="flex items-start gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-secondary/50"
                  >
                    <UserCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="flex flex-col">
                      <span className="font-medium">{t("method.manual.title")}</span>
                      <span className="text-sm text-muted-foreground">
                        {t("method.manual.subtitle")}
                      </span>
                    </span>
                  </button>
                </div>
              )}

              {step === "dns" && dns && (
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-muted-foreground">{t("dns.intro")}</p>
                  <div className="flex flex-col gap-2 rounded-lg border border-border bg-secondary/30 p-3 text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">{t("dns.recordType")}</span>
                      <code className="font-mono">{dns.recordType}</code>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">{t("dns.recordName")}</span>
                      <code className="font-mono">{dns.recordName ?? "@"}</code>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground">{t("dns.recordValue")}</span>
                      <div className="flex items-center gap-2">
                        <code className="min-w-0 flex-1 break-all rounded bg-background px-2 py-1 font-mono text-xs">
                          {dns.recordValue}
                        </code>
                        <Button variant="ghost" size="sm" onClick={copyValue} className="shrink-0 gap-1">
                          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          {copied ? t("dns.copied") : t("dns.copy")}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("dns.hint")}</p>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => setStep("choose")} className="flex-1">
                      {t("back")}
                    </Button>
                    <Button
                      variant="accent"
                      onClick={handleVerifyDns}
                      disabled={loading}
                      className="flex-1 gap-2"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                      {t("dns.verify")}
                    </Button>
                  </div>
                </div>
              )}

              {step === "manual" && (
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-muted-foreground">{t("manual.intro")}</p>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="claim-evidence">{t("manual.evidenceLabel")}</Label>
                    <textarea
                      id="claim-evidence"
                      value={evidence}
                      onChange={(event) => setEvidence(event.target.value)}
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
                      value={evidenceUrl}
                      onChange={(event) => setEvidenceUrl(event.target.value)}
                      placeholder={t("manual.urlPlaceholder")}
                      type="url"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => setStep("choose")} className="flex-1">
                      {t("back")}
                    </Button>
                    <Button
                      variant="accent"
                      onClick={handleSubmitManual}
                      disabled={loading || evidence.trim().length < 10}
                      className="flex-1 gap-2"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                      {t("manual.submit")}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ClaimServerButton;
