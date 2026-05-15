"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "favorites";
export const MAX_FAVORITES = 20;

interface FavoriteContextProps {
  favorites: number[];
  hydrated: boolean;
  isFavorite: (id: number) => boolean;
  addFavorite: (id: number) => boolean;
  removeFavorite: (id: number) => void;
  toggleFavorite: (id: number) => boolean;
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
  // Démarrer vide pour matcher le SSR (pas de localStorage côté serveur).
  // L'hydratation depuis le storage se fait après mount → évite l'hydration mismatch.
  const [favoriteSet, setFavoriteSet] = useState<Set<number>>(() => new Set());
  const [hydrated, setHydrated] = useState(false);

  // Hydratation après mount : seul moyen propre de lire le localStorage sans
  // provoquer de hydration mismatch (server rend `[]`, client lit ses favoris).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFavoriteSet(readFromStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeToStorage(favoriteSet);
  }, [favoriteSet, hydrated]);

  // Sync across tabs: when localStorage changes in another tab, mirror it here.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      setFavoriteSet(readFromStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Retourne true si l'action a été appliquée (ou est déjà l'état désiré).
  // false uniquement si on a dû refuser l'ajout pour cause de cap atteint.
  const addFavorite = useCallback(
    (id: number): boolean => {
      if (favoriteSet.has(id)) return true;
      if (favoriteSet.size >= MAX_FAVORITES) return false;
      setFavoriteSet((prev) => {
        if (prev.has(id) || prev.size >= MAX_FAVORITES) return prev;
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      return true;
    },
    [favoriteSet]
  );

  const removeFavorite = useCallback((id: number) => {
    setFavoriteSet((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const toggleFavorite = useCallback(
    (id: number): boolean => {
      if (favoriteSet.has(id)) {
        setFavoriteSet((prev) => {
          if (!prev.has(id)) return prev;
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        return true;
      }
      if (favoriteSet.size >= MAX_FAVORITES) return false;
      setFavoriteSet((prev) => {
        if (prev.has(id) || prev.size >= MAX_FAVORITES) return prev;
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      return true;
    },
    [favoriteSet]
  );

  const clearFavorites = useCallback(() => {
    setFavoriteSet((prev) => (prev.size === 0 ? prev : new Set()));
  }, []);

  const isFavorite = useCallback((id: number) => favoriteSet.has(id), [favoriteSet]);

  const favorites = useMemo(() => [...favoriteSet], [favoriteSet]);

  const contextValue = useMemo(
    () => ({
      favorites,
      hydrated,
      isFavorite,
      addFavorite,
      removeFavorite,
      toggleFavorite,
      clearFavorites,
    }),
    [favorites, hydrated, isFavorite, addFavorite, removeFavorite, toggleFavorite, clearFavorites]
  );

  return <FavoriteContext.Provider value={contextValue}>{children}</FavoriteContext.Provider>;
};
