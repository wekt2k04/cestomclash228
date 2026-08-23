"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const MUTE_STORAGE_KEY = "mindclash_audio_muted";

export type AudioMood = "calm" | "urgent";

// Pistes CC0 (domaine public, aucune attribution requise) - "Short Loops
// Background Music Pack" par cynicmusic, opengameart.org/content/short-loops-background-music-pack
// telechargees le 2026-08-23. Boucles conçues pour du jeu (testees
// GameMaker/PyGame/HTML5), courtes (~265-470 Ko) et silencieuses aux
// coutures pour boucler proprement. Voir apps/web/public/audio/CREDITS.md.
const TRACKS: Partial<Record<AudioMood, string>> = {
  calm: "/audio/calm.ogg",
  urgent: "/audio/urgent.ogg",
};

interface AudioContextValue {
  muted: boolean;
  toggleMuted: () => void;
  setMood: (mood: AudioMood) => void;
}

const AudioContext = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(true);
  const [mood, setMood] = useState<AudioMood>("calm");
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // Lecture localStorage dans un effet, pas un useState paresseux - meme
    // raison qu'auth-context.tsx (evite un mismatch d'hydratation SSR).
    const stored = localStorage.getItem(MUTE_STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored !== null) setMuted(stored === "true");
  }, []);

  // Les navigateurs bloquent l'autoplay avec son avant une interaction -
  // on arme la premiere interaction utilisateur (tap/clic/touche) une seule
  // fois, jamais un audio.play() force au chargement. Si l'utilisateur n'a
  // encore jamais fait de choix explicite (pas de preference en localStorage),
  // ce premier geste demute automatiquement - "demarre en sourdine, fondu des
  // le premier tap" (docs/ARCHITECTURE.md). Un choix explicite deja enregistre
  // est toujours respecte, jamais ecrase.
  useEffect(() => {
    if (hasInteracted) return;
    const arm = () => {
      setHasInteracted(true);
      if (localStorage.getItem(MUTE_STORAGE_KEY) === null) {
        setMuted(false);
      }
    };
    window.addEventListener("pointerdown", arm, { once: true });
    window.addEventListener("keydown", arm, { once: true });
    return () => {
      window.removeEventListener("pointerdown", arm);
      window.removeEventListener("keydown", arm);
    };
  }, [hasInteracted]);

  useEffect(() => {
    const src = TRACKS[mood];
    const audio = audioRef.current;
    if (!audio || !src) return;

    if (audio.src !== src) audio.src = src;
    audio.loop = true;
    audio.volume = 0.35;

    if (!muted && hasInteracted) {
      audio.play().catch(() => {
        // Lecture refusee (ex: geste utilisateur pas reconnu par le
        // navigateur) - pas grave, l'utilisateur peut toujours demuter via
        // le bouton, qui relance play() dans un vrai gestionnaire de clic.
      });
    } else {
      audio.pause();
    }
  }, [mood, muted, hasInteracted]);

  const toggleMuted = () => {
    setMuted((m) => {
      const next = !m;
      localStorage.setItem(MUTE_STORAGE_KEY, String(next));
      return next;
    });
    setHasInteracted(true);
  };

  return (
    <AudioContext.Provider value={{ muted, toggleMuted, setMood }}>
      {children}
      <audio ref={audioRef} preload="none" />
    </AudioContext.Provider>
  );
}

export function useAudio(): AudioContextValue {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error("useAudio doit être utilisé dans <AudioProvider>.");
  return ctx;
}
