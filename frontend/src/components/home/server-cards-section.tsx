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
import { FancyMultiSelect } from "@/components/ui/fancy-multi-select";

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
            <FancyMultiSelect
              searchOnly
              placeholder="Search servers by name or IP..."
              onSearch={setSearch}
              searchValue={search}
              className="w-full"
            />

            <div className="flex flex-row gap-4">
              <div className="flex-1">
                <FancyMultiSelect
                  options={categories?.map(cat => ({ id: cat.id, name: cat.name })) ?? []}
                  selectedIds={selectedCategories}
                  onChange={setSelectedCategories}
                  placeholder="Select categories"
                  searchPlaceholder="Search categories..."
                  emptyMessage="No categories found."
                />
              </div>

              <div className="flex-1">
                <FancyMultiSelect
                  options={languages?.map(lang => ({ id: lang.id, name: lang.name, flag: lang.flag })) ?? []}
                  selectedIds={selectedLanguages}
                  onChange={setSelectedLanguages}
                  placeholder="Select languages"
                  searchPlaceholder="Search languages..."
                  emptyMessage="No languages found."
                />
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
