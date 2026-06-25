"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type ConsentState = "unknown" | "granted" | "denied";

const STORAGE_KEY = "mcstats_analytics_consent";

interface ConsentContextProps {
  consent: ConsentState;
  grant: () => void;
  deny: () => void;
}

const ConsentContext = createContext<ConsentContextProps | null>(null);

export const useConsent = () => {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error("useConsent must be used within a ConsentProvider");
  }
  return context;
};

export const ConsentProvider = ({ children }: { children: React.ReactNode }) => {
  // Starts "unknown" on both server and first client render to avoid hydration
  // mismatch; the persisted choice is read right after mount.
  const [consent, setConsent] = useState<ConsentState>("unknown");

  // Reading the persisted choice in an effect (rather than a lazy initializer)
  // keeps the first render SSR-safe at "unknown", avoiding a hydration mismatch
  // on the banner. Syncing once from localStorage is a valid effect use here.
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "granted" || stored === "denied") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConsent(stored);
    }
  }, []);

  const grant = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "granted");
    setConsent("granted");
  }, []);

  const deny = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "denied");
    setConsent("denied");
  }, []);

  const value = useMemo(() => ({ consent, grant, deny }), [consent, grant, deny]);

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
};
