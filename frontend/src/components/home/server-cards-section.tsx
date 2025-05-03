"use client";

import useSWRInfinite from "swr/infinite";
import { useEffect, useMemo, useRef, useState } from "react";
import ServerCard from "@/components/serveur/card";
import { ServerData } from "@/app/(pages)/(index)/page";
import { fetcher } from "@/app/_cheatcode";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

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

const ServerCardsSection = () => {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const getKey = (pageIndex: number, previousPageData: PaginatedResponse | null) => {
    if (previousPageData && previousPageData.meta.currentPage >= previousPageData.meta.lastPage) return null;
  
    const searchParam = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : '';
    return `${process.env.NEXT_PUBLIC_API_URL}/servers/paginate?page=${pageIndex + 1}&limit=${PAGE_SIZE}${searchParam}`;
  };

  const { data, setSize, isValidating, mutate } = useSWRInfinite<PaginatedResponse>(getKey, fetcher);

  const observerRef = useRef<HTMLDivElement | null>(null);

  // Flatten all ServerData arrays from .data
  const servers = useMemo(() => {
    return data?.flatMap((page) => page.data) ?? [];
  }, [data]);

  // Reset pagination when search changes
  useEffect(() => {
    setSize(1);
    mutate();
  }, [debouncedSearch, setSize, mutate]);

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
    <div className="w-full space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <Input
          placeholder="Search servers by name or IP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <section id="server-cards-section" className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
          {isValidating ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-zinc-500">Loading more...</p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
};

export default ServerCardsSection;
