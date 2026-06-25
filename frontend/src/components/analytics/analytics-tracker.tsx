"use client";

import { useAuth } from "@/contexts/auth";
import { useConsent } from "@/contexts/consent";
import { identifyVisitor, trackPageView } from "@/http/analytics";
import { getVisitorId } from "@/lib/visitor-id";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * First-party usage tracker. Mounted once (inside Auth + Consent providers).
 * Emits a page view on every route change and links the anonymous visitor to the
 * authenticated account once per logged-in user. Inert until consent is granted.
 */
const AnalyticsTracker = () => {
  const { consent } = useConsent();
  const { user, getToken } = useAuth();
  const pathname = usePathname();
  const identifiedUserId = useRef<number | null>(null);

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
