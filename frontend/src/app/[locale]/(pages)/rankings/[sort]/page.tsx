import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { buildAlternates, getOpenGraphLocales } from "@/lib/domain-server";
import { serverPath } from "@/lib/server-url";
import { getRanking, isRankingSort, RANKING_LIMIT, RANKING_SORTS } from "@/http/rankings";
import { buildMetric } from "@/components/rankings/metric";
import RankingList from "@/components/rankings/ranking-list";
import { PodiumRow } from "@/components/rankings/podium";
import { RankingsStructuredData } from "@/components/seo/structured-data";

// ISR : la page est régénérée au plus toutes les 10 min, aligné sur le cache backend.
export const revalidate = 600;

// Un tri inconnu doit répondre un vrai 404 : avec le loading.tsx, le `notFound()` du
// rendu arriverait après l'envoi du statut 200 (soft-404).
export const dynamicParams = false;

const OG_IMAGE = "/images/minecraft-stats/og-image.webp";

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
  const og = getOpenGraphLocales(locale);
  const title = t(`sections.${sort}.metaTitle`);
  const description = t(`sections.${sort}.metaDescription`);

  // `openGraph` et `twitter` remplacent ceux du layout racine au lieu de les
  // fusionner : on redonne donc site, locale et image, sinon la page les perd
  // (et hérite du titre d'accueil côté Twitter).
  return {
    title,
    description,
    keywords: t(`sections.${sort}.metaKeywords`),
    openGraph: {
      type: "website",
      siteName: "Minecraft Stats",
      title,
      description,
      url: canonical,
      locale: og.locale,
      alternateLocale: og.alternateLocale,
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: title, type: "image/webp" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE],
      creator: "@MinecraftStats",
    },
    alternates: { canonical, languages },
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

  const title = t(`sections.${sort}.title`);

  return (
    <div className="space-y-8 animate-in fade-in duration-300 motion-reduce:animate-none">
      <RankingsStructuredData
        name={title}
        description={t(`sections.${sort}.metaDescription`)}
        pageUrl={buildAlternates(locale, `/rankings/${sort}`).canonical}
        homeUrl={buildAlternates(locale).canonical}
        items={rows.map(({ rank, entry }) => ({
          rank,
          name: entry.server.name,
          url: buildAlternates(locale, serverPath(entry.server.id, entry.server.name)).canonical,
        }))}
        locale={locale}
      />

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h1>
        <p className="max-w-2xl text-muted-foreground">{t(`sections.${sort}.description`)}</p>
      </div>

      <RankingList rows={rows} emptyLabel={t(`sections.${sort}.empty`)} />

      <section className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">{t("aboutTitle")}</h2>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{t(`sections.${sort}.about`)}</p>
      </section>
    </div>
  );
};

export default Ranking;
