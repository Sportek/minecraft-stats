"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "favorites";

interface FavoriteContextProps {
  favorites: number[];
  isFavorite: (id: number) => boolean;
  addFavorite: (id: number) => void;
  removeFavorite: (id: number) => void;
  toggleFavorite: (id: number) => void;
  clearFavorites: () => void;
}

export const FavoriteContext = createContext<FavoriteContextProps | null>(null);

export const useFavorite = () => {
  const context = useContext(FavoriteContext);
  if (!context) {
    throw new Error("useFavorite must be used within a FavoriteProvider");
  }
  return context;
};

const readFromStorage = (): Set<number> => {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((v): v is number => typeof v === "number"));
  } catch {
    return new Set();
  }
};

const writeToStorage = (ids: Set<number>) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // Quota exceeded or private mode — silently ignore, in-memory state still works.
  }
};

export const FavoriteProvider = ({ children }: { children: React.ReactNode }) => {
  const [favoriteSet, setFavoriteSet] = useState<Set<number>>(() => readFromStorage());

  useEffect(() => {
    writeToStorage(favoriteSet);
  }, [favoriteSet]);

  // Sync across tabs: when localStorage changes in another tab, mirror it here.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      setFavoriteSet(readFromStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addFavorite = useCallback((id: number) => {
    setFavoriteSet((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const removeFavorite = useCallback((id: number) => {
    setFavoriteSet((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const toggleFavorite = useCallback((id: number) => {
    setFavoriteSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clearFavorites = useCallback(() => {
    setFavoriteSet((prev) => (prev.size === 0 ? prev : new Set()));
  }, []);

  const isFavorite = useCallback((id: number) => favoriteSet.has(id), [favoriteSet]);

  const favorites = useMemo(() => [...favoriteSet], [favoriteSet]);

  const contextValue = useMemo(
    () => ({ favorites, isFavorite, addFavorite, removeFavorite, toggleFavorite, clearFavorites }),
    [favorites, isFavorite, addFavorite, removeFavorite, toggleFavorite, clearFavorites]
  );

  return <FavoriteContext.Provider value={contextValue}>{children}</FavoriteContext.Provider>;
};
