"use client";

import { useAudio } from "@/lib/audio-context";

// Taille de cible tactile portee a 44x44px (min. 40-44px recommande par
// Nielsen Norman Group / WCAG 2.5.5 pour toute cible tactile) - l'ancienne
// taille (36x36) etait en dessous. `recentlyUnlocked` (nouvel etat expose
// par AudioProvider) declenche un halo pulsant bref juste apres le premier
// geste utilisateur : l'audio demarre silencieusement en arriere-plan sans
// action explicite de l'utilisateur, ce halo rend visible "le son vient de
// demarrer, voici ou le controler" (recommandation issue de la recherche
// NN/g sur la visibilite d'etat systeme, appliquee a l'audio).
export function MuteToggle() {
  const { muted, toggleMuted, recentlyUnlocked } = useAudio();

  return (
    <button
      type="button"
      onClick={toggleMuted}
      aria-label={muted ? "Activer le son" : "Couper le son"}
      aria-pressed={!muted}
      className={`relative flex h-11 w-11 items-center justify-center rounded-full border border-line bg-bg-elevated text-ink-muted transition-colors hover:text-ink ${
        recentlyUnlocked ? "text-cyan" : ""
      }`}
    >
      {recentlyUnlocked && (
        <span
          aria-hidden
          className="absolute inset-0 animate-ping rounded-full bg-cyan/30"
        />
      )}
      {muted ? (
        <svg viewBox="0 0 20 20" width="18" height="18" fill="none" className="relative">
          <path
            d="M4 8v4h3l4 3V5L7 8H4Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M14 7.5 17.5 11M17.5 7.5 14 11"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" width="18" height="18" fill="none" className="relative">
          <path
            d="M4 8v4h3l4 3V5L7 8H4Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M14.5 7c1 .8 1.6 1.8 1.6 3s-.6 2.2-1.6 3"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}
