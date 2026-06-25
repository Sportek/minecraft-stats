"use client";

import { useAuth } from "@/contexts/auth";
import { useConsent } from "@/contexts/consent";
import { identifyVisitor, recordHit, trackPageView } from "@/http/analytics";
import { getVisitorId } from "@/lib/visitor-id";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * First-party usage tracker. Mounted once (inside Auth + Consent providers).
 * - Anonymous hit on every route change (no identifier) — fires regardless of
 *   consent, for aggregate visitor/traffic counts.
 * - Consent-gated page view + account linking, only once consent is granted.
 */
const AnalyticsTracker = () => {
  const { consent } = useConsent();
  const { user, getToken } = useAuth();
  const pathname = usePathname();
  const identifiedUserId = useRef<number | null>(null);

  useEffect(() => {
    if (!pathname) return;
    recordHit();
  }, [pathname]);

  useEffect(() => {
    if (consent !== "granted" || !pathname) return;

    const visitorId = getVisitorId();
    if (!visitorId) return;

    trackPageView({
      visitorId,
      path: pathname,
      referrer: document.referrer || null,
      title: document.title || null,
      token: getToken(),
    });
  }, [consent, pathname, getToken]);

  useEffect(() => {
    if (consent !== "granted" || !user) return;
    // Identify once per session for a given account.
    if (identifiedUserId.current === user.id) return;

    const visitorId = getVisitorId();
    const token = getToken();
    if (!visitorId || !token) return;

    identifiedUserId.current = user.id;
    identifyVisitor(visitorId, token);
  }, [consent, user, getToken]);

  return null;
};

export default AnalyticsTracker;
