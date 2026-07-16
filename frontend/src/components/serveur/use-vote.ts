"use client";

import { isTurnstileEnabled } from "@/components/form/turnstile";
import { useToast } from "@/components/ui/use-toast";
import { useConsent } from "@/contexts/consent";
import { getVoteStatus, submitVote, VoteResult } from "@/http/vote";
import { resolveAssetUrl } from "@/lib/domain";
import { getVisitorId } from "@/lib/visitor-id";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const USERNAME_KEY = "mcstats_vote_username";

/** Formats a remaining duration as "1h 23m" / "23m" / "<1m". */
function formatCountdown(untilIso: string | null, now: number): string {
  if (!untilIso) return "";
  const diff = new Date(untilIso).getTime() - now;
  if (diff <= 0) return "";
  const minutes = Math.ceil(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours > 0) return `${hours}h ${rest.toString().padStart(2, "0")}m`;
  return `${minutes}m`;
}

/**
 * Toute la logique du contrôle de vote (statut visiteur, cooldown, soumission avec
 * captcha + resync), isolée hors du composant de présentation `VoteButton`.
 */
export function useVote(serverId: number, initialVoteCount: number) {
  const t = useTranslations("Vote");
  const { toast } = useToast();
  const { consent, grant } = useConsent();

  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [termsChecked, setTermsChecked] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  // Bumping this key remounts the widget to get a fresh token after a failure
  // (Turnstile tokens are single-use).
  const [captchaKey, setCaptchaKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<VoteResult | null>(null);
  const [headError, setHeadError] = useState(false);

  const [total, setTotal] = useState(initialVoteCount);
  // undefined = statut en cours de chargement, null = indisponible (requête échouée).
  const [monthly, setMonthly] = useState<number | null | undefined>(undefined);
  const [canVote, setCanVote] = useState(true);
  const [nextVoteAt, setNextVoteAt] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Consentement déjà donné (via ce vote ou la bannière) ⇒ on ne redemande pas la case.
  const needsTerms = consent !== "granted";

  useEffect(() => {
    setUsername(localStorage.getItem(USERNAME_KEY) ?? "");

    const visitorId = getVisitorId();
    if (!visitorId) return;

    getVoteStatus(serverId, visitorId)
      .then((status) => {
        setCanVote(status.canVote);
        setNextVoteAt(status.nextVoteAt);
        setTotal(status.voteCount);
        setMonthly(status.monthlyVoteCount);
      })
      .catch(() => setMonthly(null));
  }, [serverId]);

  // Rafraîchit le compte à rebours du cooldown et réactive le bouton quand il
  // expire — sans ça, l'état « Déjà voté » persisterait jusqu'au rechargement.
  useEffect(() => {
    if (canVote || !nextVoteAt) return;
    const expiry = new Date(nextVoteAt).getTime();
    const id = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= expiry) setCanVote(true);
    }, 30000);
    return () => clearInterval(id);
  }, [canVote, nextVoteAt]);

  const submit = async () => {
    const acceptedTerms = !needsTerms || termsChecked;
    if (!acceptedTerms) {
      toast({ variant: "error", description: t("errors.termsRequired") });
      return;
    }
    if (isTurnstileEnabled && !token) {
      toast({ variant: "error", description: t("errors.captcha") });
      return;
    }

    const visitorId = getVisitorId();
    if (!visitorId) return;

    setSubmitting(true);
    try {
      const voteResult = await submitVote(serverId, {
        username,
        visitorId,
        turnstileToken: token,
        acceptedTerms,
      });

      // Cocher la case vaut consentement RGPD : on l'active pour de bon.
      if (needsTerms) grant();
      localStorage.setItem(USERNAME_KEY, username);

      setResult(voteResult);
      setHeadError(false);
      setTotal(voteResult.voteCount);
      setMonthly(voteResult.monthlyVoteCount);
      setCanVote(false);
      setNextVoteAt(voteResult.nextVoteAt);
      toast({ variant: "success", description: t("success.toast") });
    } catch (error) {
      setToken(null);
      setCaptchaKey((key) => key + 1);
      toast({
        variant: "error",
        description: error instanceof Error ? error.message : t("errors.generic"),
      });
      // Un 429 signifie qu'on est désormais en cooldown : on resynchronise l'état.
      const status = await getVoteStatus(serverId, visitorId).catch(() => null);
      if (status && !status.canVote) {
        setCanVote(false);
        setNextVoteAt(status.nextVoteAt);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const headSrc =
    result?.player.headPath && !headError
      ? resolveAssetUrl(`${result.player.headPath}.webp`)
      : null;

  // Réinitialise l'état de la modale à sa fermeture (jette le token périmé + le résultat).
  const resetDialog = () => {
    setResult(null);
    setToken(null);
  };

  return {
    open,
    setOpen,
    username,
    setUsername,
    termsChecked,
    setTermsChecked,
    token,
    setToken,
    captchaKey,
    needsTerms,
    submitting,
    result,
    total,
    monthly,
    canVote,
    countdown: formatCountdown(nextVoteAt, now),
    countdownFor: (iso: string | null) => formatCountdown(iso, now),
    headSrc,
    onHeadError: () => setHeadError(true),
    submit,
    resetDialog,
  };
}
