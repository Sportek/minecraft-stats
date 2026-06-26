"use client";
import { getBaseUrl } from "@/app/_cheatcode";
import { changeUserPassword, getUser, loginUser, logoutAllUser, logoutUser, registerUser } from "@/http/auth";
import { User } from "@/types/auth";
import { useRouter } from "@/i18n/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import useSWR from "swr";

interface AuthContextProps {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (
    email: string,
    password: string,
    turnstileToken?: string | null
  ) => Promise<{ message: string } | undefined>;
  register: (
    username: string,
    email: string,
    password: string,
    turnstileToken?: string | null
  ) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
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
  // `token` is kept in React state (not just localStorage) so it can drive the
  // SWR key reactively: writing a token re-fetches /me, removing it disables the read.
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  });
  const router = useRouter();

  const {
    data: meUser,
    error: meError,
    mutate: mutateMe,
  } = useSWR(token ? (["me", token] as const) : null, ([, t]) => getUser(t));

  const getToken = useCallback(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  }, []);

  const saveToken = useCallback((newToken: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("accessToken", newToken);
    setToken(newToken);
  }, []);

  const removeToken = useCallback(() => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("accessToken");
    setToken(null);
  }, []);

  // A bad/expired token makes /me throw; clear the session like the old fetchUser did.
  // Also drop any synchronous override so isLoggedIn falls back to the (now logged-out)
  // derived value instead of staying stale-true after the token is cleared.
  useEffect(() => {
    if (meError) {
      removeToken();
      setLoggedInOverride(null);
    }
  }, [meError, removeToken]);

  // `isLoggedIn` is derived from the /me read, but consumers (login/logout/OAuth
  // callback) flip it synchronously via setIsLoggedIn. The override lets those
  // synchronous updates win until the next /me read settles. null = use derived.
  const [loggedInOverride, setLoggedInOverride] = useState<boolean | null>(null);

  const user = meError ? null : meUser ?? null;
  const isLoggedIn = loggedInOverride ?? (!meError && Boolean(token) && Boolean(meUser));

  // Compat shims for the previous useState setters exposed in the public API.
  const setUser = useCallback(
    (next: User | null) => {
      mutateMe(next ?? undefined, { revalidate: false });
    },
    [mutateMe]
  );

  const setIsLoggedIn = useCallback((next: boolean) => {
    setLoggedInOverride(next);
  }, []);

  const fetchUser = useCallback(async () => {
    await mutateMe();
  }, [mutateMe]);

  const login = useCallback(
    async (email: string, password: string, turnstileToken?: string | null) => {
      try {
        const response = await loginUser({ email, password, turnstileToken });
        setUser(response.user);
        saveToken(response.accessToken.token);
        setIsLoggedIn(true);
        router.push("/");
      } catch (error) {
        setUser(null);
        setIsLoggedIn(false);
        removeToken();
        return { message: error instanceof Error ? error.message : String(error) };
      }
    },
    [router, setUser, saveToken, setIsLoggedIn, removeToken]
  );

  const register = useCallback(
    async (username: string, email: string, password: string, turnstileToken?: string | null) => {
      try {
        await registerUser({ username, email, password, turnstileToken });
        router.push("/");
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : String(error));
      }
    },
    [router]
  );

  const logout = useCallback(async () => {
    try {
      const token = getToken();
      // Révoque le token côté serveur (sinon il reste valide 30 jours).
      if (token) await logoutUser(token);
    } catch {
      // Même si la révocation serveur échoue (token déjà expiré, réseau HS),
      // on nettoie la session côté client.
    } finally {
      setUser(null);
      setIsLoggedIn(false);
      removeToken();
      router.push("/");
    }
  }, [router, getToken, setUser, setIsLoggedIn, removeToken]);

  const logoutAll = useCallback(async () => {
    try {
      const token = getToken();
      // Révoque TOUS les tokens (tous les appareils), y compris celui-ci.
      if (token) await logoutAllUser(token);
    } catch {
      // Idem : on nettoie la session locale quoi qu'il arrive.
    } finally {
      setUser(null);
      setIsLoggedIn(false);
      removeToken();
      router.push("/");
    }
  }, [router, getToken, setUser, setIsLoggedIn, removeToken]);

  const changePassword = useCallback(
    async (oldPassword: string, newPassword: string) => {
      try {
        await changeUserPassword({ oldPassword, newPassword }, getToken() ?? "");
      } catch (error) {
        console.log("AuthError", error instanceof Error ? error.message : String(error));
        throw new Error(error instanceof Error ? error.message : String(error));
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

  const contextValue = useMemo(() => {
    return {
      user,
      setUser,
      login,
      register,
      logout,
      logoutAll,
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
    setUser,
    login,
    register,
    logout,
    logoutAll,
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
