"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

// Le backend redirige ici avec #token=... (fragment, jamais envoye au
// serveur) apres le callback Google OAuth - voir auth.controller.ts.
export default function AuthCallbackPage() {
  const { setTokenFromCallback } = useAuth();
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    // Lecture de window.location.hash volontairement dans un effet - pas
    // disponible cote serveur, doit s'executer apres l'hydratation.
    const token = new URLSearchParams(window.location.hash.slice(1)).get(
      "token",
    );
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(true);
      return;
    }
    setTokenFromCallback(token)
      .then(() => router.replace("/"))
      .catch(() => setError(true));
  }, [setTokenFromCallback, router]);

  return (
    <main className="flex flex-1 items-center justify-center px-6 text-center">
      <p className="text-sm text-ink-muted">
        {error
          ? "La connexion Google a échoué. Réessaie depuis la page de connexion."
          : "Connexion en cours…"}
      </p>
    </main>
  );
}
