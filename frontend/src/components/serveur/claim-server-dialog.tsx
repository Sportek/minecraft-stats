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
  startMotdClaim,
  submitManualClaim,
  verifyDnsClaim,
  verifyMotdClaim,
} from "@/http/server";
import type { ClaimStatus, DnsInstructions, MotdInstructions } from "@/types/server";
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
import { useEffect, useRef, useState } from "react";

interface ClaimServerDialogProps {
  serverId: number;
  serverName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Appelé une fois la propriété vérifiée (pour rafraîchir la page appelante). */
  onVerified?: () => void;
}

type Step = "choose" | "motd" | "dns" | "manual";
type TokenMethod = "motd" | "dns";

// Revérification automatique de l'état « en attente » : quelques tentatives espacées,
// en plus du bouton manuel. Couvre la propagation DNS / le redémarrage du serveur.
const AUTO_ATTEMPTS = 4;
const AUTO_INTERVAL_MS = 12_000;

/**
 * Modale de revendication de propriété, contrôlée par l'appelant (bouton, bandeau,
 * page « Mes serveurs »). Trois preuves : MOTD (couverture max), DNS (sans coupure),
 * manuelle (revue admin). L'état « en attente » se revérifie tout seul + bouton manuel.
 */
const ClaimServerDialog = ({
  serverId,
  serverName,
  open,
  onOpenChange,
  onVerified,
}: ClaimServerDialogProps) => {
  const t = useTranslations("Servers.claim");
  const { toast } = useToast();
  const { getToken } = useAuth();

  const [step, setStep] = useState<Step>("choose");
  const [status, setStatus] = useState<ClaimStatus | null>(null);
  const [motd, setMotd] = useState<MotdInstructions | null>(null);
  const [dns, setDns] = useState<DnsInstructions | null>(null);
  const [evidence, setEvidence] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState<"verified" | "manual" | null>(null);
  const [copied, setCopied] = useState(false);

  const activeMethod: TokenMethod | null = step === "motd" ? "motd" : step === "dns" ? "dns" : null;
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearPoll = () => {
    if (pollRef.current) clearTimeout(pollRef.current);
    pollRef.current = null;
  };

  // Charge l'état de propriété à l'ouverture ; nettoie tout à la fermeture.
  useEffect(() => {
    if (!open) return;
    const token = getToken();
    if (token) getClaimStatus(serverId, token).then(setStatus).catch(() => setStatus(null));
    return clearPoll;
  }, [open, serverId, getToken]);

  const resetToChoose = () => {
    clearPoll();
    setStep("choose");
    setMotd(null);
    setDns(null);
    setPending(false);
  };

  const handleGenerate = async (method: TokenMethod) => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setPending(false);
    try {
      if (method === "motd") {
        const result = await startMotdClaim(serverId, token);
        setMotd(result.motd);
      } else {
        const result = await startDnsClaim(serverId, token);
        setDns(result.dns);
      }
      setStep(method);
    } catch (error) {
      toast({
        variant: "error",
        description: error instanceof Error ? error.message : t("errors.generic"),
      });
    } finally {
      setLoading(false);
    }
  };

  // Une tentative de vérification ; s'auto-reprogramme tant qu'il reste des essais auto.
  const attempt = async (method: TokenMethod, autoRemaining: number) => {
    const token = getToken();
    if (!token) return;
    clearPoll();
    setVerifying(true);
    let verified = false;
    try {
      const res =
        method === "motd"
          ? await verifyMotdClaim(serverId, token)
          : await verifyDnsClaim(serverId, token);
      verified = res.verified;
    } catch {
      // 400 attendu tant que la preuve n'est pas encore visible → on passe en attente.
    } finally {
      setVerifying(false);
    }
    if (verified) {
      setDone("verified");
      setPending(false);
      onVerified?.();
      return;
    }
    setPending(true);
    if (autoRemaining > 0) {
      pollRef.current = setTimeout(() => attempt(method, autoRemaining - 1), AUTO_INTERVAL_MS);
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

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const close = () => onOpenChange(false);
  const dnsAvailable = status?.methods.dns !== false;
  const pendingManual = status?.claim?.status === "pending" && status.claim.method === "manual";

  // Bloc de vérification partagé MOTD/DNS : bouton « Vérifier » + état « en attente ».
  const verifyFooter = (method: TokenMethod) => (
    <>
      {pending && (
        <div className="rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm">
          <p className="font-medium text-foreground">{t("pending.title")}</p>
          <p className="mt-0.5 text-muted-foreground">{t(`pending.${method}`)}</p>
          {verifying && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              {t("pending.auto")}
            </p>
          )}
        </div>
      )}
      <div className="flex gap-2">
        <Button variant="ghost" onClick={resetToChoose} className="flex-1">
          {t("back")}
        </Button>
        <Button
          variant="accent"
          onClick={() => attempt(method, AUTO_ATTEMPTS)}
          disabled={verifying}
          className="flex-1 gap-2"
        >
          {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {pending ? t("recheck") : t("verify")}
        </Button>
      </div>
    </>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          resetToChoose();
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

            {step === "choose" && (
              <div className="flex flex-col gap-3">
                {pendingManual && (
                  <p className="rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm text-muted-foreground">
                    {t("status.pendingManual")}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => handleGenerate("motd")}
                  disabled={loading}
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

                {dnsAvailable && (
                  <button
                    type="button"
                    onClick={() => handleGenerate("dns")}
                    disabled={loading}
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
                  onClick={() => setStep("manual")}
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

            {step === "motd" && motd && (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">{t("motd.intro")}</p>
                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 break-all rounded bg-secondary/40 px-2 py-1.5 font-mono text-xs">
                    {motd.value}
                  </code>
                  <Button variant="ghost" size="sm" onClick={() => copy(motd.value)} className="shrink-0 gap-1">
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? t("copied") : t("copy")}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{t("motd.hint")}</p>
                {verifyFooter("motd")}
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
                      <Button variant="ghost" size="sm" onClick={() => copy(dns.recordValue)} className="shrink-0 gap-1">
                        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? t("copied") : t("copy")}
                      </Button>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{t("dns.hint")}</p>
                {verifyFooter("dns")}
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
                  <Button variant="ghost" onClick={resetToChoose} className="flex-1">
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
  );
};

export default ClaimServerDialog;
