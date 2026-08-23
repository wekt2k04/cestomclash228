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

// Pas de vrais fichiers audio pour l'instant (voir docs/ARCHITECTURE.md §
// Ambiance sonore - decision actee, bloque sur la fourniture des assets).
// L'architecture (autoplay-safe, mute persistant, mood contextuel) est posee
// des maintenant ; il suffira de remplir cette table pour l'activer, sans
// toucher au reste de l'app.
const TRACKS: Partial<Record<AudioMood, string>> = {};

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
  // fois, jamais un audio.play() force au chargement (voir
  // docs/ARCHITECTURE.md).
  useEffect(() => {
    if (hasInteracted) return;
    const arm = () => setHasInteracted(true);
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
