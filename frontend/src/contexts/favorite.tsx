"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

interface FavoriteContextProps {
  favorites: number[];
  addFavorite: (id: number) => void;
  removeFavorite: (id: number) => void;
}

export const FavoriteContext = createContext<FavoriteContextProps | null>(null);

export const useFavorite = () => {
  const context = useContext(FavoriteContext);
  if (!context) {
    throw new Error("useFavorite must be used within a FavoriteProvider");
  }
  return context;
};

export const FavoriteProvider = ({ children }: { children: React.ReactNode }) => {

   const loadFromLocalStorage = useCallback(() => {
     if (typeof window !== "undefined") {
       const favorites = localStorage.getItem("favorites");
       if (favorites) {
         return JSON.parse(favorites);
       }
     }
    return [];
  }, []);

  const [favorites, setFavorites] = useState<number[]>(loadFromLocalStorage() || []);

  const addFavorite = useCallback(
    (id: number) => {
      setFavorites((prev) => [...prev, id]);
    },
    []
  );

  const removeFavorite = useCallback(
    (id: number) => {
      setFavorites((prev) => prev.filter((f) => f !== id));
    },
    []
  );

  const saveToLocalStorage = useCallback(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    loadFromLocalStorage();
  }, [loadFromLocalStorage]);

  useEffect(() => {
    saveToLocalStorage();
  }, [saveToLocalStorage, favorites]);

  const contextValue = useMemo(() => {
    return {
      favorites,
      addFavorite,
      removeFavorite,
    };
  }, [favorites, addFavorite, removeFavorite]);

  return <FavoriteContext.Provider value={contextValue}>{children}</FavoriteContext.Provider>;
};