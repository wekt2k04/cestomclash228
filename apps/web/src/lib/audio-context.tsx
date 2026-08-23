"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const MUTE_STORAGE_KEY = "mindclash_audio_muted";
const DEFAULT_VOLUME = 0.18; // "faible" - demande explicite de l'utilisateur
const LOOP_FADE_SECONDS = 1.5; // duree du fondu de part et d'autre du point de boucle

export type AudioMood = "calm" | "urgent";

// "Battle March - Epic Orchestral Music Loop" par PlayOnLoop (CC-BY 3.0,
// credit requis - voir apps/web/public/audio/CREDITS.md). En MP3 (pas WAV) :
// la 1ere version telechargee (WAV PCM 8 bits) ne jouait pas du tout sur
// telephone - hypothese la plus probable, le decodeur audio de certains
// navigateurs/OS mobiles ne supporte pas le PCM 8 bits (desktop est plus
// permissif). Le MP3 est un format universellement decode, y compris mobile.
// Meme piste sur les deux mood pour l'instant - un vrai second morceau pour
// "urgent" pourra remplacer cette entree plus tard sans toucher au reste.
const TRACKS: Partial<Record<AudioMood, string>> = {
  calm: "/audio/epic.mp3",
  urgent: "/audio/epic.mp3",
};

// Moteur de boucle Web Audio API avec fondu enchaine au point de bouclage,
// plutot qu'un <audio loop> qui saute sec a 0:00 - demande explicite de
// l'utilisateur ("qu'on ne remarque pas la notion cyclique"). Chaque cycle
// se termine en fondu de sortie pendant que le suivant demarre en fondu
// d'entree (chevauchement), comme un vrai crossfade de sound design plutot
// qu'une simple boucle native.
class LoopEngine {
  private ctx: AudioContext | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private activeSources: AudioBufferSourceNode[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private volume = DEFAULT_VOLUME;
  private playingUrl: string | null = null;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      const Ctor: typeof AudioContext =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new Ctor();
    }
    return this.ctx;
  }

  async preload(url: string): Promise<void> {
    if (this.buffers.has(url)) return;
    const ctx = this.getCtx();
    const res = await fetch(url);
    const data = await res.arrayBuffer();
    const buffer = await ctx.decodeAudioData(data);
    this.buffers.set(url, buffer);
  }

  setVolume(v: number): void {
    this.volume = v;
  }

  get isActive(): boolean {
    return this.playingUrl !== null;
  }

  // Doit etre appelee de façon synchrone dans un gestionnaire d'evenement
  // natif (le resume() de l'AudioContext a la meme contrainte de "geste
  // utilisateur" que audio.play(), voir le commentaire dans AudioProvider).
  async play(url: string): Promise<void> {
    const ctx = this.getCtx();
    if (ctx.state === "suspended") await ctx.resume();
    if (this.playingUrl === url) return;

    this.stop();
    await this.preload(url);
    const buffer = this.buffers.get(url);
    if (!buffer || this.playingUrl !== null) return; // stop() entre temps

    this.playingUrl = url;
    const duration = buffer.duration;
    const fade = Math.min(LOOP_FADE_SECONDS, duration / 4);

    const startCycle = () => {
      if (this.playingUrl !== url) return;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      source.connect(gain).connect(ctx.destination);

      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(this.volume, now + fade);
      gain.gain.setValueAtTime(this.volume, now + duration - fade);
      gain.gain.linearRampToValueAtTime(0, now + duration);

      source.start(now);
      source.stop(now + duration + 0.05);
      this.activeSources.push(source);
      source.onended = () => {
        this.activeSources = this.activeSources.filter((s) => s !== source);
      };

      this.timer = setTimeout(() => startCycle(), (duration - fade) * 1000);
    };

    startCycle();
  }

  stop(): void {
    this.playingUrl = null;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.activeSources.forEach((s) => {
      try {
        s.stop();
      } catch {
        // deja arrete
      }
    });
    this.activeSources = [];
  }
}

interface AudioContextValue {
  muted: boolean;
  toggleMuted: () => void;
  setMood: (mood: AudioMood) => void;
}

const AudioReactContext = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  // useState (jamais appele) plutot qu'un ref initialise pendant le rendu -
  // pattern recommande pour une instance creee une seule fois et stable
  // entre les rendus.
  const [engine] = useState(() => new LoopEngine());
  const moodRef = useRef<AudioMood>("calm");
  const [muted, setMuted] = useState(true);
  const [mood, setMood] = useState<AudioMood>("calm");
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  // Precharge/decode la piste en tache de fond des le montage - ne necessite
  // pas de geste utilisateur (juste un fetch), pour que la lecture demarre
  // instantanement une fois le geste reçu.
  useEffect(() => {
    const src = TRACKS[mood];
    if (src) void engine.preload(src);
  }, [mood, engine]);

  useEffect(() => {
    // Lecture localStorage dans un effet, pas un useState paresseux - evite
    // un mismatch d'hydratation SSR (localStorage n'existe pas cote serveur).
    const stored = localStorage.getItem(MUTE_STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored !== null) setMuted(stored === "true");
  }, []);

  // Les navigateurs mobiles sont stricts : demarrer l'audio (ou reprendre un
  // AudioContext suspendu) ne "compte" comme declenche par un geste
  // utilisateur que si c'est appele de façon SYNCHRONE dans le gestionnaire
  // d'evenement natif lui-meme - pas depuis un useEffect qui reagit a un
  // changement d'etat React (le detour par un re-render arrive trop tard sur
  // mobile, constate : le son ne se declenchait jamais sur telephone alors
  // qu'il marchait au clic sur PC). D'ou l'appel direct ici, avant meme de
  // toucher au state.
  useEffect(() => {
    if (hasInteracted) return;

    const unlock = () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchend", unlock);

      const alreadyChose = localStorage.getItem(MUTE_STORAGE_KEY);
      const shouldPlay = alreadyChose === null || alreadyChose === "false";
      const src = TRACKS[moodRef.current];

      if (shouldPlay && src) {
        void engine.play(src);
      }

      setHasInteracted(true);
      if (alreadyChose === null) setMuted(false);
    };

    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    window.addEventListener("touchend", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchend", unlock);
    };
  }, [hasInteracted, engine]);

  // Reagit aux changements APRES le deverrouillage initial (changement de
  // mood, mute/demute via le bouton) - ici un useEffect est correct car ces
  // actions ne dependent plus d'un geste initial a "consommer" en direct.
  useEffect(() => {
    if (!hasInteracted) return;
    const src = TRACKS[mood];
    if (!src) return;

    if (muted) {
      engine.stop();
    } else if (!engine.isActive) {
      void engine.play(src);
    }
  }, [mood, muted, hasInteracted, engine]);

  useEffect(() => {
    engine.setVolume(DEFAULT_VOLUME);
  }, [engine]);

  const toggleMuted = () => {
    setMuted((m) => {
      const next = !m;
      localStorage.setItem(MUTE_STORAGE_KEY, String(next));
      if (!next) {
        // Demute via clic direct : appel synchrone aussi, meme raison que
        // le deverrouillage initial.
        const src = TRACKS[moodRef.current];
        if (src) void engine.play(src);
      } else {
        engine.stop();
      }
      return next;
    });
    setHasInteracted(true);
  };

  return (
    <AudioReactContext.Provider value={{ muted, toggleMuted, setMood }}>
      {children}
    </AudioReactContext.Provider>
  );
}

export function useAudio(): AudioContextValue {
  const ctx = useContext(AudioReactContext);
  if (!ctx) throw new Error("useAudio doit être utilisé dans <AudioProvider>.");
  return ctx;
}
