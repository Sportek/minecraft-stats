"use client";

import { useEffect, useRef } from "react";

/**
 * Calques des effets de carte (cf. app/card-effects.css) : surface, anneau et particules.
 * Se place en enfant de la carte, dont il met les animations en pause quand elle est hors
 * écran (`data-fx-idle`) : une page de 24 cartes n'anime ainsi que celles qu'on voit.
 */
const CardEffectLayers = () => {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const card = ref.current?.parentElement;
    if (!card) return;

    const observer = new IntersectionObserver(([entry]) => {
      card.toggleAttribute("data-fx-idle", !entry.isIntersecting);
    });
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  return (
    <span ref={ref} aria-hidden="true" className="fx-layers">
      <span className="fx-surface" />
      <span className="fx-ring" />
      <span className="fx-particles" />
    </span>
  );
};

export default CardEffectLayers;
