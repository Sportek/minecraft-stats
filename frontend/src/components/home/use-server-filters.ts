"use client";

import { ServerData } from "@/app/[locale]/(pages)/(index)/page";
import { fetcher } from "@/app/_cheatcode";
import { useDebounce } from "@/hooks/use-debounce";
import { getClientApiUrl } from "@/lib/domain";
import { Category, Language } from "@/types/server";
import { useMemo, useState } from "react";
import useSWR from "swr";
import useSWRImmutable from "swr/immutable";

const DEFAULT_PAGE_SIZE = 24;

export type ServerTypeFilter = "all" | "java" | "bedrock";

interface PaginatedResponse {
  data: ServerData[];
  meta: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
  };
}

/**
 * État et données de la grille de serveurs de l'accueil : recherche (debouncée),
 * filtres catégories/langues/édition, pagination, et le fetch SWR paginé. Chaque
 * changement de filtre remet la page à 1. Isolé hors du composant de présentation.
 */
export function useServerFilters() {
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<number[]>([]);
  const [selectedType, setSelectedType] = useState<ServerTypeFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const debouncedSearch = useDebounce(search, 300);
  const apiUrl = getClientApiUrl();

  const { data: categories } = useSWRImmutable<Category[]>(`${apiUrl}/categories`, fetcher);
  const { data: languages } = useSWRImmutable<Language[]>(`${apiUrl}/languages`, fetcher);

  const searchParam = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : "";
  const categoriesParam =
    selectedCategories.length > 0 ? `&categoryIds=${selectedCategories.join(",")}` : "";
  const languagesParam =
    selectedLanguages.length > 0 ? `&languageIds=${selectedLanguages.join(",")}` : "";
  const typeParam = selectedType !== "all" ? `&type=${selectedType}` : "";

  const { data, isValidating, isLoading } = useSWR<PaginatedResponse>(
    `${apiUrl}/servers/paginate?page=${currentPage}&limit=${pageSize}${searchParam}${categoriesParam}${languagesParam}${typeParam}`,
    fetcher,
    { keepPreviousData: true }
  );

  const servers = useMemo(() => data?.data ?? [], [data?.data]);
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

  const updateType = (type: ServerTypeFilter) => {
    setSelectedType(type);
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
    setSelectedType("all");
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    search || selectedCategories.length > 0 || selectedLanguages.length > 0 || selectedType !== "all"
  );
  const isFetching = isLoading || isValidating;

  const rangeStart = totalServers === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalServers);

  return {
    categories,
    languages,
    search,
    updateSearch,
    selectedCategories,
    updateCategories,
    selectedLanguages,
    updateLanguages,
    selectedType,
    updateType,
    clearFilters,
    hasActiveFilters,
    currentPage,
    handlePageChange,
    pageSize,
    updatePageSize,
    totalServers,
    totalPages,
    rangeStart,
    rangeEnd,
    servers,
    isLoading,
    isFetching,
  };
}
