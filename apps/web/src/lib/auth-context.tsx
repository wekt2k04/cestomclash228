"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { apiFetch } from "./api";
import type { PublicUser, Role } from "./types";

const TOKEN_STORAGE_KEY = "mindclash_token";

interface AuthState {
  token: string | null;
  user: PublicUser | null;
  role: Role | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    displayName: string,
    homeCityId?: string,
  ) => Promise<void>;
  logout: () => void;
  setTokenFromCallback: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthResult {
  accessToken: string;
  user: PublicUser;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    role: null,
    loading: true,
  });

  const hydrate = useCallback(async (token: string) => {
    try {
      const me = await apiFetch<{ user: PublicUser; role: Role | null }>(
        "/auth/me",
        { token },
      );
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      setState({ token, user: me.user, role: me.role, loading: false });
    } catch {
      // Token invalide/expire - repartir propre plutot que garder un etat
      // incoherent (token present mais utilisateur inconnu).
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setState({ token: null, user: null, role: null, loading: false });
    }
  }, []);

  useEffect(() => {
    // Lecture localStorage volontairement dans un effet (pas un useState
    // paresseux) : localStorage n'existe pas cote serveur, un lazy
    // initializer causerait un mismatch d'hydratation si la valeur persistee
    // differe du rendu serveur par defaut.
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void hydrate(stored);
    } else {
      setState((s) => ({ ...s, loading: false }));
    }
  }, [hydrate]);

  const applyAuthResult = (result: AuthResult) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, result.accessToken);
    setState({
      token: result.accessToken,
      user: result.user,
      role: null,
      loading: false,
    });
  };

  const login = async (email: string, password: string) => {
    const result = await apiFetch<AuthResult>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    applyAuthResult(result);
    await hydrate(result.accessToken);
  };

  const signup = async (
    email: string,
    password: string,
    displayName: string,
    homeCityId?: string,
  ) => {
    const result = await apiFetch<AuthResult>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, displayName, homeCityId }),
    });
    applyAuthResult(result);
    await hydrate(result.accessToken);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setState({ token: null, user: null, role: null, loading: false });
  };

  const setTokenFromCallback = async (token: string) => {
    await hydrate(token);
  };

  return (
    <AuthContext.Provider
      value={{ ...state, login, signup, logout, setTokenFromCallback }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>.");
  return ctx;
}
