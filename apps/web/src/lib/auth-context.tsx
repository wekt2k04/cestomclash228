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

  // localStorage enveloppe dans son propre try/catch, imbrique DANS le try/catch metier
  // (pas autour) - piege reel signale par l'agent Plan du 2026-09-05 : si le try/catch etait
  // un seul bloc et que localStorage.removeItem() (catch) levait a son tour (stockage
  // totalement bloque), le setState qui suit ne s'executerait dans AUCUNE branche - l'appli
  // resterait bloquee en loading:true indefiniment (bug silencieux, pas un crash franc). En
  // isolant le storage, la mise a jour d'etat React s'execute TOUJOURS, que le storage
  // reussisse ou non.
  const hydrate = useCallback(async (token: string) => {
    try {
      const me = await apiFetch<{ user: PublicUser; role: Role | null }>(
        "/auth/me",
        { token },
      );
      try {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
      } catch {
        // Stockage indisponible (navigation privee, quota) - session valide en memoire pour
        // cette visite, juste pas persistee au prochain chargement.
      }
      setState({ token, user: me.user, role: me.role, loading: false });
    } catch {
      // Token invalide/expire - repartir propre plutot que garder un etat
      // incoherent (token present mais utilisateur inconnu).
      try {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      } catch {
        // idem - ne doit jamais empecher la mise a jour d'etat qui suit.
      }
      setState({ token: null, user: null, role: null, loading: false });
    }
  }, []);

  useEffect(() => {
    // Lecture localStorage volontairement dans un effet (pas un useState
    // paresseux) : localStorage n'existe pas cote serveur, un lazy
    // initializer causerait un mismatch d'hydratation si la valeur persistee
    // differe du rendu serveur par defaut.
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      // Stockage indisponible - redemarre sans session persistee plutot que de planter.
    }
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void hydrate(stored);
    } else {
      setState((s) => ({ ...s, loading: false }));
    }
  }, [hydrate]);

  const applyAuthResult = (result: AuthResult) => {
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, result.accessToken);
    } catch {
      // idem hydrate() ci-dessus - ne doit jamais empecher la mise a jour d'etat qui suit.
    }
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
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // idem hydrate() ci-dessus.
    }
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
