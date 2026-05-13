import HeroSection from "@/components/home/hero-section";
import GlobalInsightSection from "@/components/home/global-insight-section";
import LatestArticlesSection from "@/components/home/latest-articles-section";
import ServerCardsSection from "@/components/home/server-cards-section";
import StatsSection from "@/components/home/stats-section";
import { OrganizationStructuredData, WebsiteStructuredData } from "@/components/seo/structured-data";
import { Category, Server, ServerGrowthStat, ServerStat } from "@/types/server";

export interface ServerData {
  server: Server;
  stats: ServerStat[];
  categories: Category[];
  growthStat: ServerGrowthStat | null;
  lastOnlineAt: string | null;
  lastPlayerCount: number | null;
  lastStatsAt: string | null;
  lastMaxCount: number | null;
}

const Home = () => {
  return (
    <>
      <WebsiteStructuredData />
      <OrganizationStructuredData />
      <main className="flex w-full flex-1 flex-col gap-10 pb-12">
        <HeroSection />
        <StatsSection />
        <GlobalInsightSection />
        <LatestArticlesSection />
        <ServerCardsSection />
      </main>
    </>
  );
};

export default Home;
