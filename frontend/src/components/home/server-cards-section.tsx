"use client";

import useSWRInfinite from "swr/infinite";
import { useEffect, useMemo, useRef, useState } from "react";
import ServerCard from "@/components/serveur/card";
import { ServerData } from "@/app/(pages)/(index)/page";
import { fetcher } from "@/app/_cheatcode";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import useSWR from "swr";
import { Category, Language } from "@/types/server";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "../ui/card";

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
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<number[]>([]);
  const debouncedSearch = useDebounce(search, 300);

  const { data: categories } = useSWR<Category[]>(`${process.env.NEXT_PUBLIC_API_URL}/categories`, fetcher);
  const { data: languages } = useSWR<Language[]>(`${process.env.NEXT_PUBLIC_API_URL}/languages`, fetcher);

  const getKey = (pageIndex: number, previousPageData: PaginatedResponse | null) => {
    if (previousPageData && previousPageData.meta.currentPage >= previousPageData.meta.lastPage) return null;
  
    const searchParam = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : '';
    const categoriesParam = selectedCategories.length > 0 ? `&categoryIds=${selectedCategories.join(',')}` : '';
    const languagesParam = selectedLanguages.length > 0 ? `&languageIds=${selectedLanguages.join(',')}` : '';
    return `${process.env.NEXT_PUBLIC_API_URL}/servers/paginate?page=${pageIndex + 1}&limit=${PAGE_SIZE}${searchParam}${categoriesParam}${languagesParam}`;
  };

  const { data, setSize, isValidating, mutate } = useSWRInfinite<PaginatedResponse>(getKey, fetcher);

  const observerRef = useRef<HTMLDivElement | null>(null);

  const servers = useMemo(() => {
    return data?.flatMap((page) => page.data) ?? [];
  }, [data]);

  const toggleCategory = (categoryId: number) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleLanguage = (languageId: number) => {
    setSelectedLanguages(prev => 
      prev.includes(languageId) 
        ? prev.filter(id => id !== languageId)
        : [...prev, languageId]
    );
  };

  // Reset pagination when search, categories or languages change
  useEffect(() => {
    setSize(1);
    mutate();
  }, [debouncedSearch, selectedCategories, selectedLanguages, setSize, mutate]);

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

  const clearFilters = () => {
    setSearch("");
    setSelectedCategories([]);
    setSelectedLanguages([]);
  };

  const hasActiveFilters = search || selectedCategories.length > 0 || selectedLanguages.length > 0;

  return (
    <div className="w-full space-y-6">
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between h-9">
            <h2 className="text-lg font-semibold">Search Servers</h2>
            <div className="h-9">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className={cn(
                  "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all",
                  hasActiveFilters ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
              >
                <X className="h-4 w-4 mr-2" />
                Clear filters
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Search servers by name or IP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 transition-colors focus:bg-white dark:focus:bg-zinc-950"
              />
            </div>

            <div className="flex flex-row gap-4">
              <div className="space-y-2">
                <div className="text-sm text-zinc-500">Categories</div>
              <div className="flex flex-wrap gap-2 min-h-[1.75rem]">
                {categories?.map((category) => (
                  <Badge
                    key={category.id}
                    variant="outline"
                    className={cn(
                      "cursor-pointer transition-all hover:scale-105",
                      "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                      selectedCategories.includes(category.id) && "bg-primary/10 border-primary/50 text-primary"
                    )}
                    onClick={() => toggleCategory(category.id)}
                  >
                    {category.name}
                    <span className={cn(
                      "inline-flex ml-1 transition-all",
                      selectedCategories.includes(category.id) ? "w-3 opacity-100" : "w-0 opacity-0"
                    )}>
                      <X className="h-3 w-3" />
                    </span>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-zinc-500">Languages</div>
              <div className="flex flex-wrap gap-2 min-h-[1.75rem]">
                {languages?.map((language) => (
                  <Badge
                    key={language.id}
                    variant="outline"
                    className={cn(
                      "cursor-pointer transition-all hover:scale-105",
                      "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                      selectedLanguages.includes(language.id) && "bg-primary/10 border-primary/50 text-primary"
                    )}
                    onClick={() => toggleLanguage(language.id)}
                  >
                    <span className="mr-1">{language.flag}</span>
                    {language.name}
                    <span className={cn(
                      "inline-flex ml-1 transition-all",
                      selectedLanguages.includes(language.id) ? "w-3 opacity-100" : "w-0 opacity-0"
                    )}>
                      <X className="h-3 w-3" />
                    </span>
                  </Badge>
                ))}
              </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

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
