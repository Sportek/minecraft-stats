"use client";

import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export const SERIES_MODES = ["average", "peak"] as const;
export type SeriesMode = (typeof SERIES_MODES)[number];

interface SeriesModeToggleProps {
  value: SeriesMode;
  onChange: (mode: SeriesMode) => void;
}

/**
 * Moyenne ou pic : les deux courbes sont toujours tracées (le backend renvoie les
 * deux dans la même réponse), ce sélecteur décide seulement laquelle passe au
 * premier plan. Il vit à côté du titre du graphique, pas dans le sélecteur de
 * période : il change la lecture de la courbe, pas les données demandées.
 */
export const SeriesModeToggle = ({ value, onChange }: SeriesModeToggleProps) => {
  const t = useTranslations("Stats");

  return (
    <div
      role="group"
      aria-label={t("seriesMode.ariaLabel")}
      className="inline-flex h-9 items-center gap-0.5 rounded-md border border-border bg-secondary p-0.5"
    >
      {SERIES_MODES.map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          aria-pressed={value === mode}
          className={cn(
            "rounded-sm px-2.5 py-1 text-xs font-medium transition-colors",
            "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
            value === mode
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t(`seriesMode.${mode}`)}
        </button>
      ))}
    </div>
  );
};
