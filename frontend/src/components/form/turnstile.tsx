"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

interface TurnstileApi {
  render: (
    el: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "error-callback"?: () => void;
      "expired-callback"?: () => void;
      theme?: "light" | "dark" | "auto";
    }
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/** Whether the captcha is configured; lets forms decide if a token is required. */
export const isTurnstileEnabled = Boolean(TURNSTILE_SITE_KEY);

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

// Large pour absorber un réseau lent ; au-delà, le script est considéré bloqué
// (bloqueur de pub, pare-feu…) et on affiche l'état d'erreur avec « Réessayer ».
const LOAD_TIMEOUT_MS = 15_000;

type LoadState = "loading" | "ready" | "failed";

interface TurnstileProps {
  onToken: (token: string | null) => void;
  className?: string;
}

/**
 * Cloudflare Turnstile widget (explicit render). Calls `onToken` with the token
 * on success and `null` when it errors or expires. Renders nothing when no site
 * key is configured, so the captcha is simply disabled in environments without
 * one. While the script loads, a placeholder holds the widget's space; if the
 * script never arrives (blocked or offline), an error state with a retry button
 * replaces the silent gap that used to leave forms unsubmittable.
 */
export const Turnstile = ({ onToken, className }: TurnstileProps) => {
  const t = useTranslations("Common.captcha");
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  // Keep the latest callback without re-rendering the widget on every parent render.
  const onTokenRef = useRef(onToken);
  const [state, setState] = useState<LoadState>("loading");
  // Incremented by the retry button to re-run the script injection effect.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;

    let cancelled = false;
    let pollId: ReturnType<typeof setInterval> | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let script: HTMLScriptElement | null = null;

    const fail = () => {
      if (cancelled) return;
      if (pollId) clearInterval(pollId);
      setState("failed");
    };

    // On retire le tag en échec pour qu'un « Réessayer » réinjecte le script.
    const handleScriptError = () => {
      script?.remove();
      fail();
    };

    const renderWidget = () => {
      // Guard against a lost container, a not-yet-ready script, or a double render.
      if (cancelled || !containerRef.current || !window.turnstile || widgetIdRef.current) return;
      if (timeoutId) clearTimeout(timeoutId);
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: "auto",
        callback: (token) => onTokenRef.current(token),
        "error-callback": () => onTokenRef.current(null),
        "expired-callback": () => onTokenRef.current(null),
      });
      setState("ready");
    };

    if (window.turnstile) {
      // Script déjà chargé (autre formulaire monté avant, navigation SPA…) :
      // rendre directement — `<Script onLoad>` ne se re-déclenche pas dans ce cas.
      renderWidget();
    } else {
      // Injection manuelle plutôt que next/script : celui-ci ne réessaie jamais
      // un script (même id) dont le chargement a échoué, ce qui laissait un
      // formulaire sans captcha ni message quand Cloudflare est bloqué.
      script = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
      if (!script) {
        script = document.createElement("script");
        script.src = SCRIPT_SRC;
        script.async = true;
        document.head.appendChild(script);
      }
      script.addEventListener("error", handleScriptError);

      pollId = setInterval(() => {
        if (!window.turnstile) return;
        clearInterval(pollId);
        pollId = undefined;
        renderWidget();
      }, 100);
      timeoutId = setTimeout(() => {
        if (!window.turnstile) fail();
      }, LOAD_TIMEOUT_MS);
    }

    return () => {
      cancelled = true;
      if (pollId) clearInterval(pollId);
      if (timeoutId) clearTimeout(timeoutId);
      script?.removeEventListener("error", handleScriptError);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [attempt]);

  if (!TURNSTILE_SITE_KEY) return null;

  if (state === "failed") {
    return (
      <div
        className={cn(
          "flex flex-col items-center gap-2 rounded-md border border-border bg-secondary/50 p-3 text-center text-sm text-muted-foreground",
          className
        )}
      >
        <span>{t("loadError")}</span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            setState("loading");
            setAttempt((n) => n + 1);
          }}
        >
          {t("retry")}
        </Button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("flex min-h-[65px] items-center", className)}>
      {state === "loading" && (
        <div className="h-[65px] w-[300px] max-w-full animate-pulse rounded-md bg-foreground/10" />
      )}
    </div>
  );
};

export default Turnstile;
