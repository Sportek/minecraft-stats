import { Metadata } from "next";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { Trophy } from "lucide-react";
import { buildAlternates } from "@/lib/domain-server";
import { getRanking } from "@/http/rankings";
import { buildMetric } from "@/components/rankings/metric";
import RankingSection from "@/components/rankings/ranking-section";
import RankingsNav from "@/components/rankings/rankings-nav";
import { PodiumRow } from "@/components/rankings/podium";
import { RANKING_SECTIONS } from "@/components/rankings/sections";

// ISR : la page est régénérée au plus toutes les 10 min, aligné sur le cache backend.
export const revalidate = 600;

// Aperçu par classement (podium 3 + liste 2) ; le classement complet vit sur
// sa page dédiée /rankings/<sort>.
const PREVIEW_LIMIT = 5;

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> => {
  const { locale } = await params;
  const { canonical, languages } = buildAlternates(locale, "/rankings");
  const t = await getTranslations({ locale, namespace: "Rankings" });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    keywords: t("meta.keywords"),
    openGraph: {
      title: t("meta.ogTitle"),
      description: t("meta.ogDescription"),
      type: "website",
      url: canonical,
    },
    alternates: { canonical, languages },
    robots: { index: true, follow: true },
  };
};

const Rankings = async () => {
  const locale = await getLocale();
  const t = await getTranslations("Rankings");
  const format = await getFormatter();

  // Un fetch par classement, en parallèle. Un classement qui échoue ne fait pas
  // tomber la page entière : il rend une section vide avec son message.
  const responses = await Promise.all(
    RANKING_SECTIONS.map((section) => getRanking(section.sort, PREVIEW_LIMIT).catch(() => null)),
  );

  const sections = RANKING_SECTIONS.map((section, index) => {
    const rows: PodiumRow[] = (responses[index]?.data ?? []).map((entry, i) => ({
      rank: i + 1,
      entry,
      metric: buildMetric(section.sort, entry, format, t),
    }));
    return { ...section, rows };
  });

  const navItems = RANKING_SECTIONS.map((section) => ({
    href: `/rankings/${section.sort}`,
    label: t(`sections.${section.sort}.nav`),
    icon: section.icon,
  }));

  return (
    <main className="mx-auto w-full max-w-4xl space-y-12 py-8 overflow-x-clip">
      <header className="space-y-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-accent">
            <Trophy className="h-4 w-4" />
            {t("eyebrow")}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{t("title")}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{t("description")}</p>
        </div>
        <RankingsNav items={navItems} />
      </header>

      {sections.map((section) => (
        <RankingSection
          key={section.id}
          id={section.id}
          icon={section.icon}
          title={t(`sections.${section.sort}.title`)}
          description={t(`sections.${section.sort}.description`)}
          rows={section.rows}
          emptyLabel={t(`sections.${section.sort}.empty`)}
          locale={locale}
          viewAllHref={`/rankings/${section.sort}`}
          viewAllLabel={t("viewAll")}
        />
      ))}
    </main>
  );
};

export default Rankings;
