"use client";
import { loginUser, registerUser } from "@/http/auth";
import { User } from "@/types/auth";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface AuthContextProps {
  user: User | null;
  login: (email: string, password: string) => Promise<{ error: string } | undefined>;
  register: (username: string, email: string, password: string) => Promise<{ error: string } | undefined>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within a AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await loginUser({ email, password });
      setUser(response);
    } catch (error: any) {
      return { error: error.message };
    }
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    try {
      await registerUser({ username, email, password });
    } catch (error: any) {
      return { error: error.message };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const contextValue = useMemo(() => {
    return { user, login, register, logout };
  }, [user, login, register, logout]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
