"use client";
import { getBaseUrl } from "@/app/_cheatcode";
import { loginUser, registerUser } from "@/http/auth";
import { User } from "@/types/auth";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface AuthContextProps {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<{ error: string } | undefined>;
  register: (username: string, email: string, password: string) => Promise<{ error: string } | undefined>;
  logout: () => void;
  loginWithDiscord: () => void;
  loginWithGithub: () => void;
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
  const router = useRouter();

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await loginUser({ email, password });
        setUser(response);
        router.push("/");
      } catch (error: any) {
        return { error: error.message };
      }
    },
    [router, setUser]
  );

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      try {
        await registerUser({ username, email, password });
        router.push("/");
      } catch (error: any) {
        return { error: error.message };
      }
    },
    [router]
  );

  const logout = useCallback(() => {
    setUser(null);
    router.push("/");
  }, [router, setUser]);

  const loginWithDiscord = useCallback(() => {
    router.push(`${getBaseUrl()}/login/discord`);
  }, [router]);

  const loginWithGithub = useCallback(() => {
    router.push(`${getBaseUrl()}/login/github`);
  }, [router]);

  const contextValue = useMemo(() => {
    return { user, setUser, login, register, logout, loginWithDiscord, loginWithGithub };
  }, [user, login, register, logout, loginWithDiscord, loginWithGithub]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
