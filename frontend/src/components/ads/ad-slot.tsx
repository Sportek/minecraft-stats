"use client";

import { buildAdClickUrl, getActiveAds, recordAdImpression } from "@/http/advertisement";
import { AdPlacement, PublicAd } from "@/types/advertisement";
import { useEffect, useMemo, useState } from "react";

/** Délai minimal entre deux impressions comptées pour une même pub (5 min). */
const IMPRESSION_DEDUP_MS = 5 * 60 * 1000;

interface AdSlotProps {
  placement: AdPlacement;
  /** Sur les pages serveur : id du serveur et catégories, pour le ciblage et les stats. */
  serverId?: number;
  serverCategoryIds?: number[];
  className?: string;
}

/**
 * Tire une publicité au hasard, pondérée par son poids.
 */
function pickWeightedAd(ads: PublicAd[]): PublicAd | null {
  if (ads.length === 0) return null;
  const total = ads.reduce((sum, ad) => sum + Math.max(1, ad.weight), 0);
  let cursor = Math.random() * total;
  for (const ad of ads) {
    cursor -= Math.max(1, ad.weight);
    if (cursor <= 0) return ad;
  }
  return ads[ads.length - 1];
}

/**
 * Vrai si une impression a déjà été comptée pour cette pub il y a moins de 5 min.
 */
function impressionRecentlyCounted(adId: number): boolean {
  try {
    const raw = window.localStorage.getItem(`ms_ad_imp_${adId}`);
    if (!raw) return false;
    return Date.now() - Number(raw) < IMPRESSION_DEDUP_MS;
  } catch {
    return false;
  }
}

function markImpressionCounted(adId: number): void {
  try {
    window.localStorage.setItem(`ms_ad_imp_${adId}`, String(Date.now()));
  } catch {
    // localStorage indisponible : on ignore.
  }
}

/**
 * Construit le document HTML isolé injecté dans l'iframe sandboxée.
 * Les liens sont réécrits vers l'endpoint de redirection traquée.
 */
function buildSrcDoc(
  ad: PublicAd,
  placement: AdPlacement,
  serverId: number | undefined
): string {
  const doc = new DOMParser().parseFromString(ad.htmlContent, "text/html");

  doc.querySelectorAll("a[href]").forEach((anchor) => {
    const href = anchor.getAttribute("href") ?? "";
    if (/^https?:\/\//i.test(href)) {
      anchor.setAttribute("href", buildAdClickUrl(ad.id, href, placement, serverId));
    }
    anchor.setAttribute("target", "_blank");
    anchor.setAttribute("rel", "noopener noreferrer nofollow sponsored");
  });

  // Minimal reset only: drop the default 8px body margin and white background so
  // the iframe blends with the page (incl. dark mode). The ad still controls its
  // own visual — if it sets its own background, that wins.
  const reset = "<style>html,body{margin:0;padding:0;background:transparent}</style>";
  return `<!DOCTYPE html><html><head><meta charset="utf-8">${reset}${doc.head.innerHTML}</head><body>${doc.body.innerHTML}</body></html>`;
}

/**
 * Emplacement publicitaire. Récupère les pubs actives, en affiche une au hasard
 * (rotation pondérée) dans une iframe sandboxée, et compte les impressions.
 */
const AdSlot = ({ placement, serverId, serverCategoryIds, className }: AdSlotProps) => {
  const [ads, setAds] = useState<PublicAd[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getActiveAds(placement, serverCategoryIds)
      .then((result) => {
        if (!cancelled) setAds(result);
      })
      .catch(() => {
        if (!cancelled) setAds([]);
      });
    return () => {
      cancelled = true;
    };
    // serverCategoryIds est sérialisé pour éviter les re-fetch sur référence instable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placement, (serverCategoryIds ?? []).join(",")]);

  // Tirage effectué une fois par montage : chaque navigation relance la rotation.
  const selectedAd = useMemo(() => (ads ? pickWeightedAd(ads) : null), [ads]);

  const srcDoc = useMemo(
    () => (selectedAd ? buildSrcDoc(selectedAd, placement, serverId) : null),
    [selectedAd, placement, serverId]
  );

  useEffect(() => {
    if (!selectedAd) return;
    if (impressionRecentlyCounted(selectedAd.id)) return;
    recordAdImpression(selectedAd.id, placement, serverId);
    markImpressionCounted(selectedAd.id);
  }, [selectedAd, placement, serverId]);

  if (!selectedAd || !srcDoc) return null;

  return (
    <div className={`w-full ${className ?? ""}`}>
      <p className="mb-1 text-center text-[10px] uppercase tracking-wider text-muted-foreground/70">
        Publicité
      </p>
      <iframe
        title={`Publicité — ${selectedAd.name}`}
        srcDoc={srcDoc}
        sandbox="allow-popups allow-popups-to-escape-sandbox"
        loading="lazy"
        className="block h-[110px] w-full bg-transparent sm:h-[130px]"
      />
    </div>
  );
};

export default AdSlot;
