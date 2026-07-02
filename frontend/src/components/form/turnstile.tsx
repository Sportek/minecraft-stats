"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

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

interface TurnstileProps {
  onToken: (token: string | null) => void;
  className?: string;
}

/**
 * Cloudflare Turnstile widget (explicit render via the official script). Calls
 * `onToken` with the token on success and `null` when it errors or expires.
 * Renders nothing when no site key is configured, so the captcha is simply
 * disabled in environments without one.
 */
export const Turnstile = ({ onToken, className }: TurnstileProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  // Keep the latest callback without re-rendering the widget on every parent render.
  const onTokenRef = useRef(onToken);

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;

    let cancelled = false;
    let pollId: ReturnType<typeof setInterval> | undefined;

    const renderWidget = () => {
      // Guard against a lost container, a not-yet-ready script, or a double render.
      if (cancelled || !containerRef.current || !window.turnstile || widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: "auto",
        callback: (token) => onTokenRef.current(token),
        "error-callback": () => onTokenRef.current(null),
        "expired-callback": () => onTokenRef.current(null),
      });
    };

    // Ne pas dépendre de `<Script onLoad>` : Next ne le re-déclenche pas quand le
    // script est déjà chargé (navigation SPA depuis une page qui a déjà monté le
    // widget), ce qui laissait le captcha vide jusqu'à un hard refresh. On rend
    // directement si l'API est là, sinon on attend qu'elle soit définie.
    if (window.turnstile) {
      renderWidget();
    } else {
      pollId = setInterval(() => {
        if (!window.turnstile) return;
        clearInterval(pollId);
        pollId = undefined;
        renderWidget();
      }, 100);
    }

    return () => {
      cancelled = true;
      if (pollId) clearInterval(pollId);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, []);

  if (!TURNSTILE_SITE_KEY) return null;

  return (
    <>
      <Script
        id="cf-turnstile"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
      />
      <div ref={containerRef} className={className} />
    </>
  );
};

export default Turnstile;
