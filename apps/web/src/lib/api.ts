const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// Rafraichissement passif des listes (Pins/Bounties, Sponsoring) pendant
// qu'un ecran reste ouvert - demande explicite utilisateur 2026-09-09 (pas
// de WebSocket, deja tranche dans le plan de deploiement : Render gratuit
// tue toute connexion persistante des sa mise en veille). 20s : assez court
// pour qu'une nouvelle demande d'aide se voie sans recharger manuellement,
// assez long pour rester negligeable face au vrai risque - le sommeil
// Render (15 min sans requete) - que ce polling aide d'ailleurs a repousser
// pendant qu'un ecran reste ouvert, en complement du ping keep-alive.
export const POLL_INTERVAL_MS = 20_000;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiFetchOptions extends RequestInit {
  token?: string | null;
}

// Client HTTP minimal partagé par tout le front - une seule fonction qui
// sait parler au backend (base URL, header d'auth, forme des erreurs),
// plutôt que du fetch() disséminé composant par composant.
export async function apiFetch<T>(
  path: string,
  { token, headers, ...options }: ApiFetchOptions = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message =
      (Array.isArray(body?.message) ? body.message.join(", ") : body?.message) ??
      `Erreur ${res.status}`;
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
