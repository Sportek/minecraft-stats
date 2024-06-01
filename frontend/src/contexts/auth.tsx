"use client";
import { getBaseUrl } from "@/app/_cheatcode";
import { changeUserPassword, getUser, loginUser, registerUser } from "@/http/auth";
import { User } from "@/types/auth";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

interface AuthContextProps {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<{ message: string } | undefined>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loginWithDiscord: () => void;
  loginWithGithub: () => void;
  getToken: () => string | null;
  saveToken: (token: string) => void;
  fetchUser: () => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
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

  const getToken = useCallback(() => {
    return localStorage.getItem("accessToken");
  }, []);

  const saveToken = useCallback((token: string) => {
    localStorage.setItem("accessToken", token);
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const response = await getUser(getToken() ?? "");
      setUser(response || null);
    } catch (error: any) {
      setUser(null);
    }
  }, [getToken, setUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await loginUser({ email, password });
        setUser(response.user);
        saveToken(response.accessToken.token);
        router.push("/");
      } catch (error: any) {
        return { message: error.message };
      }
    },
    [router, setUser, saveToken]
  );

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      try {
        await registerUser({ username, email, password });
        router.push("/");
      } catch (error: any) {
        throw new Error(error.message);
      }
    },
    [router]
  );

  const logout = useCallback(() => {
    setUser(null);
    router.push("/");
  }, [router, setUser]);

  const changePassword = useCallback(
    async (oldPassword: string, newPassword: string) => {
      try {
        await changeUserPassword({ oldPassword, newPassword }, getToken() ?? "");
      } catch (error: any) {
        console.log("AuthError", error.message);
        throw new Error(error.message);
      }
    },
    [getToken]
  );

  const loginWithDiscord = useCallback(() => {
    router.push(`${getBaseUrl()}/login/discord`);
  }, [router]);

  const loginWithGithub = useCallback(() => {
    router.push(`${getBaseUrl()}/login/github`);
  }, [router]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const contextValue = useMemo(() => {
    return {
      user,
      setUser,
      login,
      register,
      logout,
      loginWithDiscord,
      loginWithGithub,
      getToken,
      saveToken,
      fetchUser,
      changePassword,
    };
  }, [
    user,
    login,
    register,
    logout,
    loginWithDiscord,
    loginWithGithub,
    getToken,
    saveToken,
    fetchUser,
    changePassword,
  ]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
