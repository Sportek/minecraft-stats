import { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Trophy } from "lucide-react";
import RankingsNav from "@/components/rankings/rankings-nav";
import { RANKING_SECTIONS } from "@/components/rankings/sections";

/**
 * Coque commune aux pages /rankings/<sort> : eyebrow et onglets restent montés
 * quand on change de classement, seul le contenu de la page est remplacé.
 */
const RankingsLayout = async ({ children }: { children: ReactNode }) => {
  const t = await getTranslations("Rankings");

  const navItems = RANKING_SECTIONS.map((section) => ({
    sort: section.sort,
    label: t(`sections.${section.sort}.nav`),
    icon: section.icon,
  }));

  return (
    <main className="mx-auto w-full max-w-4xl space-y-8 py-8 overflow-x-clip">
      <header className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-accent">
          <Trophy className="h-4 w-4" />
          {t("eyebrow")}
        </div>
        <RankingsNav label={t("eyebrow")} items={navItems} />
      </header>
      {children}
    </main>
  );
};

export default RankingsLayout;
