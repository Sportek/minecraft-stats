"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import HeroSection from "@/components/home/hero-section";
import { WebsiteStructuredData, OrganizationStructuredData } from "@/components/seo/structured-data";
import { Category, Server, ServerGrowthStat, ServerStat } from "@/types/server";

const StatsSection = dynamic(() => import("@/components/home/stats-section"), {
  loading: () => <div className="w-full h-[100px] bg-white dark:bg-zinc-950 rounded-lg animate-pulse" />,
  ssr: false
});

const GlobalInsightSection = dynamic(() => import("@/components/home/global-insight-section"), {
  loading: () => <div className="w-full h-[400px] bg-white dark:bg-zinc-950 rounded-lg animate-pulse" />,
  ssr: false
});

const ServerCardsSection = dynamic(() => import("@/components/home/server-cards-section"), {
  loading: () => <div className="w-full h-[200px] bg-white dark:bg-zinc-950 rounded-lg animate-pulse" />,
  ssr: false
});

const LatestArticlesSection = dynamic(() => import("@/components/home/latest-articles-section"), {
  loading: () => <div className="w-full h-[300px] bg-white dark:bg-zinc-950 rounded-lg animate-pulse" />,
  ssr: false
});

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
        <Suspense>
          <StatsSection />
        </Suspense>
        <Suspense>
          <GlobalInsightSection />
        </Suspense>
        <Suspense>
          <LatestArticlesSection />
        </Suspense>
        <Suspense>
          <ServerCardsSection />
        </Suspense>
      </main>
    </>
  );
};

export default Home;
