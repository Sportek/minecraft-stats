"use client";

import { useTranslations } from "next-intl";

const MINUTE_MS = 60_000;

/**
 * Durée d'activité en heures/minutes (« 2 h 15 min »), depuis les millisecondes
 * cumulées par l'analytics. Composant plutôt que helper : le formatage dépend des
 * traductions, et le classement comme le détail utilisateur l'affichent.
 */
export const ActivityDuration = ({ ms }: { ms: number }) => {
  const t = useTranslations("Admin.analytics.activeUsers.duration");

  if (ms < MINUTE_MS) return <>{t("none")}</>;

  const totalMinutes = Math.round(ms / MINUTE_MS);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return <>{hours > 0 ? t("hours", { hours, minutes }) : t("minutes", { minutes })}</>;
};
