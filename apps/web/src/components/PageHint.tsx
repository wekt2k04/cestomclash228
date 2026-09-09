"use client";

import { useEffect, useState } from "react";

// Astuce de navigation dismissible, par ecran (retour utilisateur 2026-09-09 :
// "les pages pour voir des bounties sont ou ? Je ne vois que la carte. Pas
// d'explication.") - contrairement au texte d'accroche de Hero.tsx (toujours
// affiche, se fond dans le reste), celle-ci se distingue visuellement (carte
// dediee) et se souvient d'avoir ete fermee (localStorage, par `id` unique) -
// ne revient jamais ennuyer quelqu'un qui a deja compris. Affichee par defaut
// tant que non explicitement fermee (mieux vaut la montrer une fois de trop
// qu'une fois de moins si le stockage est indisponible).
export function PageHint({ id, children }: { id: string; children: React.ReactNode }) {
  const storageKey = `mindclash_hint_dismissed_${id}`;
  // Cache tant qu'on ne sait pas encore (evite un flash visible avant
  // hydratation si l'astuce a deja ete fermee lors d'une visite precedente).
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let alreadyDismissed = false;
    try {
      alreadyDismissed = localStorage.getItem(storageKey) === "true";
    } catch {
      // Stockage indisponible - reste affichee par defaut pour cette session.
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(!alreadyDismissed);
  }, [storageKey]);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(storageKey, "true");
    } catch {
      // Stockage indisponible - reapparaitra au prochain chargement, pas grave.
    }
  };

  return (
    <div
      role="note"
      className="mx-4 mt-3 flex items-start gap-2.5 rounded-xl border border-gold/40 bg-gold/10 px-3.5 py-3 text-sm text-ink sm:mx-6"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        width="18"
        height="18"
        fill="none"
        className="mt-0.5 shrink-0 text-gold"
      >
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M10 9v4.5M10 6.75h.01"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
      <p className="flex-1 leading-snug text-ink-muted">{children}</p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Fermer cette astuce"
        className="-m-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-muted hover:text-ink"
      >
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none">
          <path
            d="M5 5l10 10M15 5 5 15"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
