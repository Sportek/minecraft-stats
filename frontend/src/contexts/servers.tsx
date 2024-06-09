"use client";

import { addMinecraftServer } from "@/http/server";
import { createContext, useCallback, useContext, useMemo } from "react";
import { useAuth } from "./auth";

interface ServersContextProps {
  addServer: (data: { name: string; address: string; port: number; categories: string[] }) => Promise<void>;
}

export const ServersContext = createContext<ServersContextProps | null>(null);

export const useServers = () => {
  const context = useContext(ServersContext);
  if (!context) {
    throw new Error("useServers must be used within a ServersProvider");
  }
  return context;
};

export const ServersProvider = ({ children }: { children: React.ReactNode }) => {
  const { getToken } = useAuth();

  const addServer = useCallback(
    async (data: { name: string; address: string; port: number; categories: string[] }) => {
      try {
        await addMinecraftServer(data, getToken() ?? "");
      } catch (error: any) {
        throw new Error(error.message);
      }
    },
    [getToken]
  );

  const contextValue = useMemo(() => {
    return {
      addServer,
    };
  }, [addServer]);

  return <ServersContext.Provider value={contextValue}>{children}</ServersContext.Provider>;
};
