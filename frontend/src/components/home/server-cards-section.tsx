"use client";

import useSWR from "swr";
import { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import ServerCard from "@/components/serveur/card";
import { ServerData } from "@/app/(pages)/(index)/page";
import { fetcher } from "@/app/_cheatcode";
import { X } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import useSWRImmutable from "swr/immutable";
import { Category, Language } from "@/types/server";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FancyMultiSelect } from "@/components/ui/fancy-multi-select";
import { Pagination } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getClientApiUrl } from "@/lib/domain";

const PAGE_SIZE_OPTIONS = [12, 24, 36, 48] as const;
const DEFAULT_PAGE_SIZE = 24;

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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const debouncedSearch = useDebounce(search, 300);
  const apiUrl = getClientApiUrl();

  const { data: categories } = useSWRImmutable<Category[]>(`${apiUrl}/categories`, fetcher);
  const { data: languages } = useSWRImmutable<Language[]>(`${apiUrl}/languages`, fetcher);

  const searchParam = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : "";
  const categoriesParam = selectedCategories.length > 0 ? `&categoryIds=${selectedCategories.join(",")}` : "";
  const languagesParam = selectedLanguages.length > 0 ? `&languageIds=${selectedLanguages.join(",")}` : "";

  const { data, isValidating, isLoading } = useSWR<PaginatedResponse>(
    `${apiUrl}/servers/paginate?page=${currentPage}&limit=${pageSize}${searchParam}${categoriesParam}${languagesParam}`,
    fetcher,
    { keepPreviousData: true }
  );

  const servers = data?.data ?? [];
  const totalServers = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.lastPage ?? 1;

  // Chaque changement de filtre remet la pagination à 1.
  const updateSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const updateCategories = (ids: number[]) => {
    setSelectedCategories(ids);
    setCurrentPage(1);
  };

  const updateLanguages = (ids: number[]) => {
    setSelectedLanguages(ids);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const updatePageSize = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedCategories([]);
    setSelectedLanguages([]);
    setCurrentPage(1);
  };

  const hasActiveFilters = search || selectedCategories.length > 0 || selectedLanguages.length > 0;
  const isFetching = isLoading || isValidating;

  const rangeStart = totalServers === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalServers);

  return (
    <section id="server-cards-section" className="w-full scroll-mt-8 space-y-6">
      <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col gap-2 border-b border-border px-6 py-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/10 text-accent">
                <Icon icon="material-symbols:search" className="h-4 w-4" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Browse Servers</h2>
            </div>
            {totalServers > 0 && (
              <span className="text-xs font-medium text-muted-foreground">
                {new Intl.NumberFormat("en-US").format(totalServers)} tracked
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Find a server by name, IP, category or language.
          </p>
        </div>

        <div className="space-y-4 p-6">
          <FancyMultiSelect
            searchOnly
            placeholder="Search by name or IP..."
            onSearch={updateSearch}
            searchValue={search}
            className="w-full"
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FancyMultiSelect
              options={categories?.map((cat) => ({ id: cat.id, name: cat.name })) ?? []}
              selectedIds={selectedCategories}
              onChange={updateCategories}
              placeholder="All categories"
              searchPlaceholder="Search categories..."
              emptyMessage="No categories found."
            />
            <FancyMultiSelect
              options={languages?.map((lang) => ({ id: lang.id, name: lang.name, flag: lang.flag })) ?? []}
              selectedIds={selectedLanguages}
              onChange={updateLanguages}
              placeholder="All languages"
              searchPlaceholder="Search languages..."
              emptyMessage="No languages found."
            />
          </div>

          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className={cn(
                "text-muted-foreground hover:text-foreground transition-opacity",
                hasActiveFilters ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
            >
              <X className="h-3.5 w-3.5 mr-1.5" />
              Clear filters
            </Button>
          </div>
        </div>
      </div>

      {/* Range caption + page size picker */}
      {totalServers > 0 && (
        <div className="flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing <span className="font-medium text-foreground">{rangeStart}–{rangeEnd}</span> of{" "}
            <span className="font-medium text-foreground">{new Intl.NumberFormat("en-US").format(totalServers)}</span>
            <span className="mx-1.5">·</span>
            Page <span className="font-medium text-foreground">{currentPage}</span> of{" "}
            <span className="font-medium text-foreground">{totalPages}</span>
          </span>
          <div className="flex items-center gap-2">
            <span>Per page</span>
            <Select value={String(pageSize)} onValueChange={(v) => updatePageSize(Number(v))}>
              <SelectTrigger aria-label="Servers per page" className="h-8 w-auto min-w-[4.5rem] bg-secondary text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Cards grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: pageSize }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-md" />
          ))}
        </div>
      ) : servers.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card py-16 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Icon icon="material-symbols:search-off" className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">No servers found</p>
            <p className="text-xs text-muted-foreground">Try clearing filters or searching a different term.</p>
          </div>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div
          className={cn(
            "grid grid-cols-1 gap-4 transition-opacity duration-200 sm:grid-cols-2 lg:grid-cols-3",
            isFetching && "opacity-60"
          )}
        >
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
        </div>
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
    </section>
  );
};

export default ServerCardsSection;
