"use client";

import { Turnstile, isTurnstileEnabled } from "@/components/form/turnstile";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { useConsent } from "@/contexts/consent";
import { getVoteStatus, submitVote, VoteResult } from "@/http/vote";
import { Link } from "@/i18n/navigation";
import { resolveAssetUrl } from "@/lib/domain";
import { getVisitorId } from "@/lib/visitor-id";
import { Check, Loader2, ThumbsUp } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const USERNAME_KEY = "mcstats_vote_username";

interface VoteButtonProps {
  serverId: number;
  serverName: string;
  initialVoteCount: number;
}

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
 * Vote control for the server detail page: a split "action + counter" control
 * (GitHub-star style) showing the monthly vote count — the metric used by the
 * rankings — and opening a dialog where a visitor votes with just a Minecraft
 * username. The signature moment is the player's own rendered head on success.
 */
const VoteButton = ({ serverId, serverName, initialVoteCount }: VoteButtonProps) => {
  const t = useTranslations("Vote");
  const format = useFormatter();
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

  const countdown = formatCountdown(nextVoteAt, now);

  const handleSubmit = async () => {
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

  return (
    <div className="flex w-full items-stretch sm:w-auto">
      {canVote ? (
        <Button
          variant="accent"
          onClick={() => setOpen(true)}
          className="flex-1 gap-2 rounded-r-none sm:flex-none"
        >
          <ThumbsUp className="h-4 w-4" />
          {t("button")}
        </Button>
      ) : (
        <Button
          variant="secondary"
          disabled
          className="flex-1 gap-2 rounded-r-none border-r-0 sm:flex-none"
        >
          <Check className="h-4 w-4" />
          {t("alreadyVoted")}
        </Button>
      )}
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex min-w-12 items-center justify-center rounded-r-md border border-border bg-card px-3 text-sm font-bold tabular-nums text-foreground">
              {monthly === undefined && (
                <span className="h-3.5 w-5 animate-pulse rounded-md bg-foreground/10" />
              )}
              {monthly === null && "—"}
              {typeof monthly === "number" && format.number(monthly)}
            </span>
          </TooltipTrigger>
          <TooltipContent className="text-center">
            <p>
              {t("votesThisMonth")} · {t("totalVotes", { count: format.number(total) })}
            </p>
            {!canVote && countdown && <p>{t("nextVoteIn", { time: countdown })}</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          // Le widget est démonté à la fermeture : on jette le token avec lui,
          // sinon une réouverture pourrait soumettre un token périmé.
          if (!next) {
            setResult(null);
            setToken(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          {result ? (
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              {headSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={headSrc}
                  alt={result.player.username}
                  onError={() => setHeadError(true)}
                  className="h-20 w-20 rounded-lg border border-border [image-rendering:pixelated]"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-border bg-secondary text-2xl font-bold uppercase text-muted-foreground">
                  {result.player.username.charAt(0)}
                </div>
              )}
              <div className="flex flex-col gap-1">
                <DialogTitle>{t("success.title")}</DialogTitle>
                <DialogDescription>
                  {t("success.body", { username: result.player.username })}
                </DialogDescription>
              </div>
              {result.nextVoteAt && (
                <span className="text-xs text-muted-foreground">
                  {t("nextVoteIn", { time: formatCountdown(result.nextVoteAt, now) })}
                </span>
              )}
              <Button variant="secondary" onClick={() => setOpen(false)} className="w-full">
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
                  <Label htmlFor="vote-username">{t("usernameLabel")}</Label>
                  <Input
                    id="vote-username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder={t("usernamePlaceholder")}
                    maxLength={16}
                    autoComplete="off"
                  />
                </div>

                {isTurnstileEnabled && <Turnstile key={captchaKey} onToken={setToken} />}

                {needsTerms && (
                  <label className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Checkbox
                      checked={termsChecked}
                      onCheckedChange={(value) => setTermsChecked(value === true)}
                      className="mt-0.5"
                    />
                    <span>
                      {t.rich("termsLabel", {
                        link: (chunks) => (
                          <Link href="/cgu" className="text-primary underline-offset-4 hover:underline">
                            {chunks}
                          </Link>
                        ),
                      })}
                    </span>
                  </label>
                )}

                <Button
                  variant="accent"
                  onClick={handleSubmit}
                  disabled={submitting || username.length < 3}
                  className="w-full gap-2"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ThumbsUp className="h-4 w-4" />
                  )}
                  {t("button")}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VoteButton;
