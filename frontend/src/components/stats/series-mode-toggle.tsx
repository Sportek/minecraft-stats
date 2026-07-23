"use client";

import { useTranslations } from "next-intl";
import { Segmented } from "./segmented";

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
    <Segmented
      value={value}
      onChange={onChange}
      ariaLabel={t("seriesMode.ariaLabel")}
      options={SERIES_MODES.map((mode) => ({ value: mode, label: t(`seriesMode.${mode}`) }))}
    />
  );
};
