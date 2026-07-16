"use client";

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
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

export type ClaimStep = "choose" | "motd" | "dns" | "manual";
export type TokenMethod = "motd" | "dns";

// Revérification automatique de l'état « en attente » : quelques tentatives espacées,
// en plus du bouton manuel. Couvre la propagation DNS / le redémarrage du serveur.
const AUTO_ATTEMPTS = 4;
const AUTO_INTERVAL_MS = 12_000;

/**
 * Toute la logique de revendication (chargement du statut, génération de jeton,
 * vérification avec revérification auto, demande manuelle, presse-papier), isolée
 * hors du composant de présentation `ClaimServerDialog`.
 */
export function useClaimFlow(serverId: number, open: boolean, onVerified?: () => void) {
  const t = useTranslations("Servers.claim");
  const { toast } = useToast();
  const { getToken } = useAuth();

  const [step, setStep] = useState<ClaimStep>("choose");
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

  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearPoll = () => {
    if (pollRef.current) clearTimeout(pollRef.current);
    pollRef.current = null;
  };

  const notifyError = (error: unknown) =>
    toast({
      variant: "error",
      description: error instanceof Error ? error.message : t("errors.generic"),
    });

  // Charge l'état de propriété à l'ouverture ; arrête toute revérification à la fermeture.
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

  const resetAll = () => {
    resetToChoose();
    setDone(null);
  };

  const generate = async (method: TokenMethod) => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setPending(false);
    try {
      if (method === "motd") setMotd((await startMotdClaim(serverId, token)).motd);
      else setDns((await startDnsClaim(serverId, token)).dns);
      setStep(method);
    } catch (error) {
      notifyError(error);
    } finally {
      setLoading(false);
    }
  };

  // Une tentative de vérification ; s'auto-reprogramme tant qu'il reste des essais auto.
  const attempt = async (method: TokenMethod, autoRemaining = AUTO_ATTEMPTS) => {
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

  const submitManual = async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      await submitManualClaim(serverId, { evidence, evidenceUrl: evidenceUrl || undefined }, token);
      setDone("manual");
    } catch (error) {
      notifyError(error);
    } finally {
      setLoading(false);
    }
  };

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return {
    step,
    status,
    motd,
    dns,
    evidence,
    evidenceUrl,
    loading,
    verifying,
    pending,
    done,
    copied,
    dnsAvailable: status?.methods.dns !== false,
    pendingManual: status?.claim?.status === "pending" && status.claim.method === "manual",
    setStep,
    setEvidence,
    setEvidenceUrl,
    generate,
    attempt,
    submitManual,
    copy,
    resetToChoose,
    resetAll,
  };
}
