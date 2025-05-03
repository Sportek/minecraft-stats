"use client";

import GlobalInsightSection from "@/components/home/global-insight-section";
import HeroSection from "@/components/home/hero-section";
import ServerCardsSection from "@/components/home/server-cards-section";

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
    <main className="w-full h-full flex flex-col flex-1 py-4 gap-4">
      <HeroSection />
      <GlobalInsightSection />
      <ServerCardsSection />
    </main>
  );
};
export default Home;
