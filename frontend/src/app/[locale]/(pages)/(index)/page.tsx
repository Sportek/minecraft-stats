import HeroSection from "@/components/home/hero-section";
import GlobalInsightSection from "@/components/home/global-insight-section";
import LatestArticlesSection from "@/components/home/latest-articles-section";
import FavoritesSection from "@/components/home/favorites-section";
import ServerCardsSection from "@/components/home/server-cards-section";
import StatsSection from "@/components/home/stats-section";
import AdSlot from "@/components/ads/ad-slot";
import { OrganizationStructuredData, WebsiteStructuredData } from "@/components/seo/structured-data";
import { Category, Server, ServerGrowthStat, ServerStat } from "@/types/server";
import { buildAlternates, localeOrigin } from "@/lib/domain-server";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

export interface ServerData {
  server: Server;
  stats: ServerStat[];
  categories: Category[];
  growthStat: ServerGrowthStat | null;
}

// The locale layout no longer knows the request path, so every indexable page
// declares its own canonical/hreflang.
export const generateMetadata = async ({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> => {
  const { locale } = await params;
  return {
    alternates: {
      ...buildAlternates(locale),
      types: { "application/rss+xml": `${localeOrigin(locale)}/feed.xml` },
    },
  };
};

const Home = async ({ params }: { params: Promise<{ locale: string }> }) => {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <WebsiteStructuredData locale={locale} />
      <OrganizationStructuredData />
      <main className="flex w-full flex-1 flex-col gap-10 pb-12">
        <HeroSection />
        <StatsSection />
        <GlobalInsightSection />
        <AdSlot placement="home" />
        <LatestArticlesSection />
        <FavoritesSection />
        <ServerCardsSection />
      </main>
    </>
  );
};

export default Home;
