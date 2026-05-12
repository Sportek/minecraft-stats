"use client";

import { useEffect } from "react";

const CLARITY_DELAY_MS = 3000;

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void) => number;
  cancelIdleCallback?: (id: number) => void;
};

const MicrosoftClarity = () => {
  useEffect(() => {
    const clarityId = process.env.NEXT_PUBLIC_MICROSOFT_CLARITY;
    if (!clarityId) return;

    const w = window as IdleWindow;

    const load = () => {
      if (document.getElementById("microsoft-clarity-init")) return;
      const script = document.createElement("script");
      script.id = "microsoft-clarity-init";
      script.async = true;
      script.text = `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${clarityId}");`;
      document.head.appendChild(script);
    };

    let idleId: number | null = null;
    let timeoutId: number | null = null;

    if (typeof w.requestIdleCallback === "function") {
      idleId = w.requestIdleCallback(() => {
        timeoutId = window.setTimeout(load, CLARITY_DELAY_MS);
      });
    } else {
      timeoutId = window.setTimeout(load, CLARITY_DELAY_MS);
    }

    return () => {
      if (idleId !== null && typeof w.cancelIdleCallback === "function") {
        w.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  return null;
};

export default MicrosoftClarity;
