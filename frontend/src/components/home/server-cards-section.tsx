"use client";

import useSWRInfinite from "swr/infinite";
import { useEffect, useMemo, useRef } from "react";
import ServerCard from "@/components/serveur/card";
import { ServerData } from "@/app/(pages)/(index)/page";
import { fetcher } from "@/app/_cheatcode";

const PAGE_SIZE = 10;

interface PaginatedResponse {
  data: ServerData[];
  meta: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
  };
}

const getKey = (pageIndex: number, previousPageData: PaginatedResponse | null) => {
  if (previousPageData && previousPageData.meta.currentPage >= previousPageData.meta.lastPage) return null;

  return `${process.env.NEXT_PUBLIC_API_URL}/servers/paginate?page=${pageIndex + 1}&limit=${PAGE_SIZE}`;
};

const ServerCardsSection = () => {
  const { data, setSize, isValidating } = useSWRInfinite<PaginatedResponse>(getKey, fetcher);

  const observerRef = useRef<HTMLDivElement | null>(null);

  // Flatten all ServerData arrays from .data
  const servers = useMemo(() => {
    return data?.flatMap((page) => page.data) ?? [];
  }, [data]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setSize((prev) => prev + 1);
        }
      },
      { threshold: 1 }
    );

    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [setSize]);

  return (
    <section className="w-full mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {servers
        .filter((item) => item?.server)
        .map((item) => (
          <ServerCard
            key={item.server.id}
            server={item.server}
            stats={item.stats}
            categories={item.categories}
            growthStat={item.growthStat}
            isFull={false}
          />
        ))}
      <div ref={observerRef} className="h-10 flex items-center justify-center col-span-full">
        {isValidating ? <p className="text-sm text-zinc-500">Loading more...</p> : null}
      </div>
    </section>
  );
};

export default ServerCardsSection;
