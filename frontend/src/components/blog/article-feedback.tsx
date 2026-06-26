"use client";

import { useAuth } from "@/contexts/auth";
import { submitPostFeedback } from "@/http/post";
import { cn } from "@/lib/utils";
import { getVisitorId } from "@/lib/visitor-id";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type Vote = "yes" | "no";

const buttonClass =
  "inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent/50 hover:bg-secondary disabled:opacity-50";

/**
 * "Was this article helpful?" widget. The reader votes once; the choice is
 * remembered locally so returning readers see a thank-you instead of the prompt.
 * Aggregate results are admin-only (surfaced on the post stats page).
 */
export default function ArticleFeedback({ slug }: { slug: string }) {
  const t = useTranslations("Blog");
  const { getToken } = useAuth();
  const [vote, setVote] = useState<Vote | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  const storageKey = `mcstats_post_feedback_${slug}`;

  // Restore a prior vote so returning readers see their choice, not the prompt.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored === "yes" || stored === "no") setVote(stored);
    } catch {
      // localStorage unavailable: just show the prompt.
    }
  }, [storageKey]);

  const handleVote = async (choice: Vote) => {
    if (submitting || vote) return;

    const visitorId = getVisitorId();
    if (!visitorId) return;

    setSubmitting(true);
    setError(false);
    try {
      await submitPostFeedback(slug, choice === "yes", visitorId, getToken());
      setVote(choice);
      try {
        localStorage.setItem(storageKey, choice);
      } catch {
        // Non-fatal: the vote is recorded server-side regardless.
      }
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-16 rounded-xl border border-border bg-card p-6 text-center text-card-foreground">
      {vote ? (
        <p className="text-sm font-medium text-foreground">
          {t("feedback.thanks")} {vote === "yes" ? "🎉" : "🙏"}
        </p>
      ) : (
        <>
          <p className="mb-4 text-sm font-semibold text-foreground">{t("feedback.prompt")}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => handleVote("yes")}
              disabled={submitting}
              className={cn(buttonClass, "hover:text-success")}
            >
              <ThumbsUp className="h-4 w-4" />
              {t("feedback.yes")}
            </button>
            <button
              type="button"
              onClick={() => handleVote("no")}
              disabled={submitting}
              className={cn(buttonClass, "hover:text-destructive")}
            >
              <ThumbsDown className="h-4 w-4" />
              {t("feedback.no")}
            </button>
          </div>
          {error && (
            <p className="mt-3 text-xs text-destructive">{t("feedback.error")}</p>
          )}
        </>
      )}
    </div>
  );
}
