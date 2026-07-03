import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { Trophy } from "lucide-react";
import { buildAlternates } from "@/lib/domain-server";
import { getRanking, isRankingSort, RANKING_SORTS } from "@/http/rankings";
import { buildMetric } from "@/components/rankings/metric";
import RankingList from "@/components/rankings/ranking-list";
import RankingsNav from "@/components/rankings/rankings-nav";
import { PodiumRow } from "@/components/rankings/podium";
import { RANKING_SECTIONS } from "@/components/rankings/sections";

// ISR : la page est régénérée au plus toutes les 10 min, aligné sur le cache backend.
export const revalidate = 600;

// Classement complet : podium 3 + liste 22.
const RANKING_LIMIT = 25;

type Props = {
  params: Promise<{ locale: string; sort: string }>;
};

export function generateStaticParams() {
  return RANKING_SORTS.map((sort) => ({ sort }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, sort } = await params;
  if (!isRankingSort(sort)) {
    return {};
  }

  const { canonical, languages } = buildAlternates(locale, `/rankings/${sort}`);
  const t = await getTranslations({ locale, namespace: "Rankings" });

  return {
    title: t(`sections.${sort}.metaTitle`),
    description: t(`sections.${sort}.metaDescription`),
    keywords: t(`sections.${sort}.metaKeywords`),
    openGraph: {
      title: t(`sections.${sort}.title`),
      description: t(`sections.${sort}.metaDescription`),
      type: "website",
      url: canonical,
    },
    alternates: { canonical, languages },
    robots: { index: true, follow: true },
  };
}

const Ranking = async ({ params }: Props) => {
  const { sort } = await params;
  if (!isRankingSort(sort)) {
    notFound();
  }

  const locale = await getLocale();
  const t = await getTranslations("Rankings");
  const format = await getFormatter();

  const response = await getRanking(sort, RANKING_LIMIT).catch(() => null);
  const rows: PodiumRow[] = (response?.data ?? []).map((entry, i) => ({
    rank: i + 1,
    entry,
    metric: buildMetric(sort, entry, format, t),
  }));

  const navItems = RANKING_SECTIONS.map((section) => ({
    href: `/rankings/${section.sort}`,
    label: t(`sections.${section.sort}.nav`),
    icon: section.icon,
    active: section.sort === sort,
  }));

  return (
    <main className="mx-auto w-full max-w-4xl space-y-8 py-8 overflow-x-clip">
      <header className="space-y-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-accent">
            <Trophy className="h-4 w-4" />
            {t("eyebrow")}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t(`sections.${sort}.title`)}
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{t(`sections.${sort}.description`)}</p>
        </div>
        <RankingsNav items={navItems} />
      </header>

      <RankingList
        name={t(`sections.${sort}.title`)}
        rows={rows}
        emptyLabel={t(`sections.${sort}.empty`)}
        locale={locale}
      />
    </main>
  );
};

export default Ranking;
