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
const DUCK_FACTOR = 0.3; // volume pendant qu'une sheet/formulaire est ouvert(e)
const RECENTLY_UNLOCKED_MS = 2500; // duree du signal visuel post-deverrouillage

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
//
// Chaine de routage : source -> gain de cycle (0..1, forme le fondu au
// point de boucle) -> gain maitre (niveau utilisateur x ducking) -> sortie.
// Separer les deux gains permet de faire varier le niveau maitre (ducking)
// INSTANTANEMENT, sans attendre la fin du cycle en cours - un simple
// `this.volume` relu au debut de chaque cycle (ancienne version) ne
// changerait le niveau qu'au prochain bouclage, potentiellement plusieurs
// secondes plus tard.
class LoopEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private activeSources: AudioBufferSourceNode[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private baseVolume = DEFAULT_VOLUME;
  private duckFactor = 1;
  private playingUrl: string | null = null;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      const Ctor: typeof AudioContext =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new Ctor();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.baseVolume * this.duckFactor;
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  private applyMasterGain(smoothSeconds: number): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const target = this.baseVolume * this.duckFactor;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    if (smoothSeconds > 0) {
      this.masterGain.gain.linearRampToValueAtTime(target, now + smoothSeconds);
    } else {
      this.masterGain.gain.setValueAtTime(target, now);
    }
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
    this.baseVolume = v;
    this.applyMasterGain(0);
  }

  // Baisse temporaire du volume (sheet/formulaire ouvert - recommandation
  // NN/g : reduire la charge cognitive ambiante pendant une tache de
  // lecture/saisie). Fondu doux (0.4s), pas un saut sec.
  setDucked(ducked: boolean): void {
    this.duckFactor = ducked ? DUCK_FACTOR : 1;
    this.applyMasterGain(0.4);
  }

  get isActive(): boolean {
    return this.playingUrl !== null;
  }

  // Doit etre appelee de façon synchrone dans un gestionnaire d'evenement
  // natif (le resume() de l'AudioContext a la meme contrainte de "geste
  // utilisateur" que audio.play(), voir le commentaire dans AudioProvider).
  // Leve une erreur explicite si le contexte reste suspendu malgre l'appel -
  // resume() peut se RESOUDRE sans que l'etat ne passe reellement a
  // "running" sur certains navigateurs mobiles si le geste d'origine n'est
  // pas reconnu comme valide ; sans cette verification l'appelant croit a
  // tort que la lecture a demarre.
  async play(url: string): Promise<void> {
    const ctx = this.getCtx();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    if (ctx.state !== ("running" as AudioContextState)) {
      throw new Error(`AudioContext non debloque (etat: ${ctx.state})`);
    }
    if (this.playingUrl === url) return;

    this.stop();
    await this.preload(url);
    const buffer = this.buffers.get(url);
    if (!buffer || this.playingUrl !== null) return; // stop() entre temps

    this.playingUrl = url;
    const duration = buffer.duration;
    const fade = Math.min(LOOP_FADE_SECONDS, duration / 4);
    const master = this.masterGain!;

    const startCycle = () => {
      if (this.playingUrl !== url) return;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const cycleGain = ctx.createGain();
      source.connect(cycleGain).connect(master);

      const now = ctx.currentTime;
      cycleGain.gain.setValueAtTime(0, now);
      cycleGain.gain.linearRampToValueAtTime(1, now + fade);
      cycleGain.gain.setValueAtTime(1, now + duration - fade);
      cycleGain.gain.linearRampToValueAtTime(0, now + duration);

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
  duck: () => void;
  unduck: () => void;
  recentlyUnlocked: boolean;
}

const AudioReactContext = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  // useState (jamais appele) plutot qu'un ref initialise pendant le rendu -
  // pattern recommande pour une instance creee une seule fois et stable
  // entre les rendus.
  const [engine] = useState(() => new LoopEngine());
  const moodRef = useRef<AudioMood>("calm");
  const duckCountRef = useRef(0);
  const [muted, setMuted] = useState(true);
  const [mood, setMood] = useState<AudioMood>("calm");
  const [hasInteracted, setHasInteracted] = useState(false);
  const [recentlyUnlocked, setRecentlyUnlocked] = useState(false);

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
  // changement d'etat React. D'ou l'appel direct ici, avant meme de toucher
  // au state.
  //
  // Bug reel constate (retour utilisateur 2026-08-23, persistant apres le
  // passage au MP3) : le son ne demarrait TOUJOURS pas sur telephone.
  // Cause racine identifiee a la lecture du code - `pointerdown` se
  // declenche AVANT `touchend` dans la sequence d'un tap tactile, et
  // l'ancienne version retirait tous les ecouteurs des le premier evenement
  // reçu, quel qu'il soit. Or `pointerdown` seul est un declencheur
  // documente comme peu fiable pour debloquer un AudioContext sur certains
  // navigateurs mobiles (WebKit/iOS notamment - a la difference de
  // `touchend`/`click`/`keydown`, universellement reconnus). Consequence :
  // le tap "consommait" le geste via l'evenement le MOINS fiable et
  // desactivait `touchend` (le fiable) avant qu'il n'ait sa chance -
  // echec systematique, pas intermittent. Corrige par deux changements
  // complementaires : (1) `pointerdown` retire de la liste des declencheurs,
  // (2) les ecouteurs ne sont retires qu'APRES verification reelle que
  // `ctx.state === "running"` (voir LoopEngine.play) - si un geste ne
  // suffit pas a debloquer l'audio, on continue d'ecouter le geste suivant
  // au lieu d'abandonner silencieusement.
  useEffect(() => {
    if (hasInteracted) return;

    let settled = false;
    let attempting = false;

    const attemptUnlock = () => {
      if (settled || attempting) return;
      attempting = true;

      const alreadyChose = localStorage.getItem(MUTE_STORAGE_KEY);
      const shouldPlay = alreadyChose === null || alreadyChose === "false";
      const src = TRACKS[moodRef.current];

      const finish = () => {
        settled = true;
        window.removeEventListener("touchend", attemptUnlock);
        window.removeEventListener("click", attemptUnlock);
        window.removeEventListener("keydown", attemptUnlock);
        setHasInteracted(true);
        if (alreadyChose === null) setMuted(false);
        setRecentlyUnlocked(true);
        setTimeout(() => setRecentlyUnlocked(false), RECENTLY_UNLOCKED_MS);
      };

      if (!shouldPlay || !src) {
        // Preference "muet" deja enregistree : rien a jouer, mais le geste
        // a bien ete reçu - pas la peine de continuer a ecouter.
        finish();
        return;
      }

      engine
        .play(src)
        .then(finish)
        .catch((err: unknown) => {
          // Geste insuffisant pour ce navigateur (voir commentaire ci-
          // dessus) - on retente au prochain geste plutot que d'abandonner.
          console.error(
            "[audio] deverrouillage echoue, nouvelle tentative au prochain geste",
            err,
          );
        })
        .finally(() => {
          attempting = false;
        });
    };

    window.addEventListener("touchend", attemptUnlock);
    window.addEventListener("click", attemptUnlock);
    window.addEventListener("keydown", attemptUnlock);
    return () => {
      window.removeEventListener("touchend", attemptUnlock);
      window.removeEventListener("click", attemptUnlock);
      window.removeEventListener("keydown", attemptUnlock);
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
      void engine.play(src).catch((err: unknown) => {
        console.error("[audio] reprise de lecture echouee", err);
      });
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
        // le deverrouillage initial. Un clic reel est deja un geste fiable
        // sur tous les navigateurs, pas besoin de la logique de retry.
        const src = TRACKS[moodRef.current];
        if (src) {
          void engine.play(src).catch((err: unknown) => {
            console.error("[audio] activation manuelle echouee", err);
          });
        }
      } else {
        engine.stop();
      }
      return next;
    });
    setHasInteracted(true);
  };

  // Ducking par compteur (pas un simple booleen) : robuste si plusieurs
  // sources de ducking se chevauchaient un jour (actuellement une seule
  // sheet a la fois via CityOverview, mais evite un bug latent si ça change).
  const duck = () => {
    duckCountRef.current += 1;
    engine.setDucked(true);
  };
  const unduck = () => {
    duckCountRef.current = Math.max(0, duckCountRef.current - 1);
    if (duckCountRef.current === 0) engine.setDucked(false);
  };

  return (
    <AudioReactContext.Provider
      value={{ muted, toggleMuted, setMood, duck, unduck, recentlyUnlocked }}
    >
      {children}
    </AudioReactContext.Provider>
  );
}

export function useAudio(): AudioContextValue {
  const ctx = useContext(AudioReactContext);
  if (!ctx) throw new Error("useAudio doit être utilisé dans <AudioProvider>.");
  return ctx;
}
