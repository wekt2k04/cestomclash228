"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const MUTE_STORAGE_KEY = "mindclash_audio_muted";
// Releve de 0.18 a 0.32 le 2026-09-05 : retour utilisateur "le son ne se joue
// pas" sur telephone - le volume precedent (deja tres faible par demande
// explicite anterieure) le rendait probablement impercetible plutot que reellement
// absent (aucune erreur JS/console associee, voir LoopEngine.play - le
// deverrouillage lui-meme fonctionne). Reste une ambiance de fond, pas un
// premier plan.
const DEFAULT_VOLUME = 0.32;
// Releve de 1.5 a 2.2s le 2026-09-09 (retour utilisateur : le demarrage devait
// "ne pas surprendre... etre cool") - s'applique a la fois au tout premier
// demarrage (le seul vraiment perceptible comme un "demarrage", les suivants
// sont masques par la musique deja en cours) et a chaque point de boucle.
const LOOP_FADE_SECONDS = 2.2; // duree du fondu de part et d'autre du point de boucle
const DUCK_FACTOR = 0.3; // volume pendant qu'une sheet/formulaire est ouvert(e)
const RECENTLY_UNLOCKED_MS = 2500; // duree du signal visuel post-deverrouillage

export type AudioMood = "calm" | "urgent";

// "A Picture of Beauty" par PlayOnLoop (CC-BY 3.0, credit requis - voir
// apps/web/public/audio/CREDITS.md). Remplace "Battle March" le 2026-09-05 -
// demande explicite de l'utilisateur pour un morceau "neutre, vecteur
// d'emotions, sans caracteristique particuliere" (l'ancien etait volontairement
// epique/intense, plus adapte a une ambiance "combat" qu'a une ambiance de
// fond neutre). Meme format (MP3, deja confirme universellement decode y
// compris mobile) et meme moteur de boucle a fondu enchaine (LoopEngine plus
// bas) - le "sans impression de loop" demande vient du CODE (crossfade a
// chaque cycle), pas du fichier audio lui-meme, donc valable quel que soit le
// morceau charge ici.
const TRACKS: Partial<Record<AudioMood, string>> = {
  calm: "/audio/ambient.mp3",
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
  private silentlyUnlocked = false;

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

  // Bug reel constate le 2026-09-12 (retour utilisateur, iPhone d'un tiers) : aucun son ne
  // joue jamais, sans erreur JS associee. Cause probable, specifique a Safari/WebKit iOS :
  // ctx.resume() peut se resoudre et ctx.state passer reellement a "running" (donc la
  // verification plus bas ne detecte rien d'anormal) SANS que la sortie audio ne soit
  // vraiment debloquee materiellement, tant qu'aucun son n'a ete demarre tres pres du geste
  // d'origine. Or ici, la lecture reelle (startCycle -> source.start) n'arrive qu'apres DEUX
  // creux asynchrones supplementaires (le `await ctx.resume()` puis `await this.preload()` -
  // fetch+decodeAudioData du MP3, potentiellement plusieurs centaines de ms) - largement
  // hors de la fenetre que WebKit associe encore au geste. Palliatif standard (utilise par ex.
  // par Howler.js) : demarrer un buffer SILENCIEUX d'un seul echantillon de facon synchrone,
  // ici, avant le moindre `await` - "amorce" reellement la sortie materielle pendant qu'on est
  // encore dans la pile d'appel du geste, independamment du chargement asynchrone de la vraie
  // piste. Sans effet audible ni sur Android ni sur desktop (ou le probleme ne se produit pas),
  // donc rien de deja fonctionnel n'est modifie par cet ajout.
  private unlockSilently(ctx: AudioContext): void {
    if (this.silentlyUnlocked) return;
    this.silentlyUnlocked = true;
    try {
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    } catch {
      // Si meme ce buffer trivial echoue, le deblocage plus bas echouera aussi et sera
      // rattrape par le catch existant de l'appelant (attemptUnlock) - pas de plan B ici.
    }
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
    this.unlockSilently(ctx);
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
  // instantanement une fois le geste reçu. Saute ce telechargement (2.6 Mo,
  // audit mobile-runtime-audit du 2026-09-05) si l'utilisateur a deja coupe
  // le son lors d'une visite precedente - inutile de le lui faire payer en
  // data/CPU pour une fonctionnalite qu'il a explicitement refusee.
  useEffect(() => {
    let alreadyMuted = false;
    try {
      alreadyMuted = localStorage.getItem(MUTE_STORAGE_KEY) === "true";
    } catch {
      // Stockage indisponible - precharge par defaut (comportement inchange).
    }
    if (alreadyMuted) return;
    const src = TRACKS[mood];
    if (src) void engine.preload(src);
  }, [mood, engine]);

  useEffect(() => {
    // Lecture localStorage dans un effet, pas un useState paresseux - evite
    // un mismatch d'hydratation SSR (localStorage n'existe pas cote serveur).
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(MUTE_STORAGE_KEY);
    } catch {
      // Stockage indisponible - demarre non-muet par defaut plutot que de planter (ce
      // useEffect est dans AudioProvider, monte a la racine de app/layout.tsx - une
      // exception non catchee ici casserait le rendu de toute l'appli, voir audit
      // mobile-runtime-audit du 2026-09-05).
    }
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

      // Ce handler est un vrai listener DOM natif (window.addEventListener plus bas), pas un
      // gestionnaire synthetique React - une exception ici n'est JAMAIS rattrapee par un
      // error boundary React, quel qu'il soit (audit + validation agent Plan du 2026-09-05).
      // Seul un try/catch direct protege ce site.
      let alreadyChose: string | null = null;
      try {
        alreadyChose = localStorage.getItem(MUTE_STORAGE_KEY);
      } catch {
        // Stockage indisponible - traite comme "jamais choisi", comportement par defaut.
      }
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

  // Reprise apres mise en arriere-plan (verrouillage d'ecran, changement d'onglet) - les
  // navigateurs mobiles suspendent agressivement l'AudioContext en arriere-plan, et rien
  // avant ce fix ne le relançait au retour au premier plan (audit mobile-runtime-audit du
  // 2026-09-05). Tente quand meme un rappel a engine.play() : ctx.resume() se produit AVANT
  // le court-circuit "meme URL deja en cours" dans LoopEngine.play(), donc l'appel tente
  // reellement de debloquer l'AudioContext plutot que d'etre un no-op. Pas de garantie de
  // succes sur iOS strict pour autant : visibilitychange n'est PAS un contexte de geste
  // utilisateur reconnu par les politiques d'autoplay - LoopEngine.play() leve deja une
  // erreur explicite si ctx.state n'est pas "running" apres coup (voir plus haut dans ce
  // fichier), auquel cas on retombe sur le meme signal visuel que le premier deverrouillage
  // (recentlyUnlocked, deja cable sur MuteToggle.tsx) plutot que de pretendre une reprise
  // silencieuse garantie. Ne verifie PAS engine.isActive (ne reflete que "stop() n'a pas ete
  // appele", pas l'etat reel de l'AudioContext sous-jacent - un faux sentiment de securite).
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        // Arret explicite a la mise en arriere-plan (2026-09-09, retours
        // utilisateur reels) - jusqu'ici seul le sens "reprise" (ci-dessous)
        // etait gere. Sans cet arret, `this.timer` (setTimeout en horloge
        // murale dans LoopEngine, decorrele de l'horloge AudioContext qui se
        // met en pause pendant une suspension) continue de decompter en temps
        // reel pendant l'arriere-plan et peut declencher un nouveau cycle
        // AVANT que l'ancien (suspendu, jamais annule) n'ait fini de jouer au
        // retour au premier plan - deux sources actives simultanement,
        // d'ou "l'audio se joue 2 fois". Meme absence de handler expliquait
        // aussi "le son continue a jouer meme quand on quitte le navigateur"
        // (rien n'arretait jamais rien). engine.stop() est sur, meme appele
        // plusieurs fois ou si rien ne jouait (no-op) : ne touche ni
        // duckFactor/baseVolume (ducking preserve), ni le cache preload()
        // (pas de re-telechargement au retour) - verifie par l'audit
        // mobile-runtime-audit du 2026-09-09 avant d'ecrire ce correctif.
        engine.stop();
        return;
      }
      if (!hasInteracted || muted) return;
      const src = TRACKS[moodRef.current];
      if (!src) return;
      engine.play(src).catch(() => {
        // Meme signal, meme duree que le premier deverrouillage (voir attemptUnlock plus
        // haut) - pas de reprise silencieuse garantie sur iOS strict, on attire l'oeil vers
        // MuteToggle.tsx pour un retap manuel (geste reel, fiable) plutot que rien du tout.
        setRecentlyUnlocked(true);
        setTimeout(() => setRecentlyUnlocked(false), RECENTLY_UNLOCKED_MS);
      });
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [hasInteracted, muted, engine]);

  useEffect(() => {
    engine.setVolume(DEFAULT_VOLUME);
  }, [engine]);

  const toggleMuted = () => {
    setMuted((m) => {
      const next = !m;
      // Dans l'updater fonctionnel d'un handler d'evenement React - React ne rattrape par
      // design aucune exception issue d'un gestionnaire d'evenement (audit + validation
      // agent Plan du 2026-09-05), meme raison que le site attemptUnlock plus haut.
      try {
        localStorage.setItem(MUTE_STORAGE_KEY, String(next));
      } catch {
        // Stockage indisponible - le mute fonctionne quand meme pour cette session, juste
        // pas persiste au prochain chargement.
      }
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
