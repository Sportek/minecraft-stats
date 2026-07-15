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
import { Link } from "@/i18n/navigation";
import { Check, Loader2, ThumbsUp } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useVote } from "./use-vote";

interface VoteButtonProps {
  serverId: number;
  serverName: string;
  initialVoteCount: number;
}

/**
 * Vote control for the server detail page: a split "action + counter" control
 * (GitHub-star style) showing the monthly vote count — the metric used by the
 * rankings — and opening a dialog where a visitor votes with just a Minecraft
 * username. The signature moment is the player's own rendered head on success.
 * Presentational only — all logic lives in {@link useVote}.
 */
const VoteButton = ({ serverId, serverName, initialVoteCount }: VoteButtonProps) => {
  const t = useTranslations("Vote");
  const format = useFormatter();
  const vote = useVote(serverId, initialVoteCount);

  return (
    <div className="flex w-full items-stretch sm:w-auto">
      {vote.canVote ? (
        <Button
          variant="accent"
          onClick={() => vote.setOpen(true)}
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
              {vote.monthly === undefined && (
                <span className="h-3.5 w-5 animate-pulse rounded-md bg-foreground/10" />
              )}
              {vote.monthly === null && "—"}
              {typeof vote.monthly === "number" && format.number(vote.monthly)}
            </span>
          </TooltipTrigger>
          <TooltipContent className="text-center">
            <p>
              {t("votesThisMonth")} · {t("totalVotes", { count: format.number(vote.total) })}
            </p>
            {!vote.canVote && vote.countdown && <p>{t("nextVoteIn", { time: vote.countdown })}</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog
        open={vote.open}
        onOpenChange={(next) => {
          vote.setOpen(next);
          // Le widget est démonté à la fermeture : on jette le token avec lui,
          // sinon une réouverture pourrait soumettre un token périmé.
          if (!next) vote.resetDialog();
        }}
      >
        <DialogContent className="sm:max-w-md">
          {vote.result ? (
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              {vote.headSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={vote.headSrc}
                  alt={vote.result.player.username}
                  onError={vote.onHeadError}
                  className="h-20 w-20 rounded-lg border border-border [image-rendering:pixelated]"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-border bg-secondary text-2xl font-bold uppercase text-muted-foreground">
                  {vote.result.player.username.charAt(0)}
                </div>
              )}
              <div className="flex flex-col gap-1">
                <DialogTitle>{t("success.title")}</DialogTitle>
                <DialogDescription>
                  {t("success.body", { username: vote.result.player.username })}
                </DialogDescription>
              </div>
              {vote.result.nextVoteAt && (
                <span className="text-xs text-muted-foreground">
                  {t("nextVoteIn", { time: vote.countdownFor(vote.result.nextVoteAt) })}
                </span>
              )}
              <Button variant="secondary" onClick={() => vote.setOpen(false)} className="w-full">
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
                    value={vote.username}
                    onChange={(event) => vote.setUsername(event.target.value)}
                    placeholder={t("usernamePlaceholder")}
                    maxLength={16}
                    autoComplete="off"
                  />
                </div>

                {isTurnstileEnabled && <Turnstile key={vote.captchaKey} onToken={vote.setToken} />}

                {vote.needsTerms && (
                  <label className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Checkbox
                      checked={vote.termsChecked}
                      onCheckedChange={(value) => vote.setTermsChecked(value === true)}
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
                  onClick={vote.submit}
                  disabled={vote.submitting || vote.username.length < 3}
                  className="w-full gap-2"
                >
                  {vote.submitting ? (
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
