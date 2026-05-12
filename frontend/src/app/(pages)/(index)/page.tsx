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
      <main className="w-full h-full flex flex-col flex-1 py-4 gap-4">
        <HeroSection />
        <StatsSection />
        <LatestArticlesSection />
        <GlobalInsightSection />
        <ServerCardsSection />
      </main>
    </>
  );
};

export default Home;
