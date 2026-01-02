"use client";
import { getBaseUrl } from "@/app/_cheatcode";
import { changeUserPassword, getUser, loginUser, registerUser } from "@/http/auth";
import { User } from "@/types/auth";
import { useRouter } from "next/navigation";
import { createContext, startTransition, useCallback, useContext, useEffect, useMemo, useState } from "react";

interface AuthContextProps {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<{ message: string } | undefined>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loginWithDiscord: () => void;
  loginWithGoogle: () => void;
  getToken: () => string | null;
  saveToken: (token: string) => void;
  fetchUser: () => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  isLoggedIn: boolean;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  const getToken = useCallback(() => {
    return localStorage.getItem("accessToken");
  }, []);

  const saveToken = useCallback((token: string) => {
    localStorage.setItem("accessToken", token);
  }, []);

  const removeToken = useCallback(() => {
    localStorage.removeItem("accessToken");
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;
      const response = await getUser(token);
      setUser(response || null);
      setIsLoggedIn(true);
    } catch (error: any) {
      setUser(null);
      setIsLoggedIn(false);
      removeToken();
    }
  }, [getToken, setUser, setIsLoggedIn, removeToken]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await loginUser({ email, password });
        setUser(response.user);
        saveToken(response.accessToken.token);
        setIsLoggedIn(true);
        router.push("/");
      } catch (error: any) {
        setUser(null);
        setIsLoggedIn(false);
        removeToken();
        return { message: error.message };
      }
    },
    [router, setUser, saveToken, setIsLoggedIn, removeToken]
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
    setIsLoggedIn(false);
    removeToken();
    router.push("/");
  }, [router, setUser, setIsLoggedIn, removeToken]);

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

  const loginWithGoogle = useCallback(() => {
    router.push(`${getBaseUrl()}/login/google`);
  }, [router]);

  useEffect(() => {
    startTransition(() => {
      fetchUser();
    });
  }, [fetchUser]);

  const contextValue = useMemo(() => {
    return {
      user,
      setUser,
      login,
      register,
      logout,
      loginWithDiscord,
      loginWithGoogle,
      getToken,
      saveToken,
      fetchUser,
      changePassword,
      isLoggedIn,
      setIsLoggedIn,
    };
  }, [
    user,
    login,
    register,
    logout,
    loginWithDiscord,
    loginWithGoogle,
    getToken,
    saveToken,
    fetchUser,
    changePassword,
    isLoggedIn,
    setIsLoggedIn,
  ]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
