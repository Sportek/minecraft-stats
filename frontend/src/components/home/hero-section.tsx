import Link from "next/link";
import { Button } from "../ui/button";
import { useRef, useEffect, useState } from "react";
import { Skeleton } from "../ui/skeleton";

const HeroSection = () => {
  const serverCardsRef = useRef<HTMLElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const scrollToServerCards = () => {
    serverCardsRef.current = document.getElementById('server-cards-section');
    if (serverCardsRef.current) {
      serverCardsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="w-full py-16 md:py-24 flex flex-col items-center md:items-start text-center md:text-left">
      {!isLoaded ? (
        <>
          <Skeleton className="h-14 sm:h-16 w-full max-w-3xl mb-4" />
          <Skeleton className="h-6 w-full max-w-2xl mb-6" />
          <div className="flex gap-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </>
      ) : (
        <>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white max-w-3xl">
            Track Minecraft server popularity in real time.
          </h1>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-300 max-w-2xl">
            Get real-time player counts, analyze trends, and compare servers instantly. Join the stats revolution.
          </p>
          <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-4">
            <Link href="/account/add-server" className="text-white bg-stats-blue-600 hover:bg-stats-blue-700 transition-colors rounded-md px-4 py-2">🚀 Add Your Server</Link>
            <Button variant="outline" size="lg" onClick={scrollToServerCards}>
              🔍 Explore Servers
            </Button>
          </div>
        </>
      )}
    </section>
  );
};

export default HeroSection;
