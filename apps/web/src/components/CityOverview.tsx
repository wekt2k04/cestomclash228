"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Hero } from "./Hero";
import { MoroccoMap } from "./MoroccoMap";
import { CityPanel } from "./CityPanel";
import { CreateSheet } from "./CreateSheet";
import { WelcomeIntro } from "./WelcomeIntro";
import { PageHint } from "./PageHint";
import { Spinner } from "./Spinner";

// Remplace l'ancien SocialMap (MapLibre) par la vue "carte du Maroc stylisée
// + présence par ville" (voir MoroccoMap.tsx). Orchestration : écran d'accueil
// séparé (WelcomeIntro) avant la carte pour un visiteur non connecté — corrigé
// le 2026-08-31, la carte n'apparaissait auparavant qu'après un simple bandeau
// Hero sur le même scroll, jamais un vrai premier écran malgré la demande
// explicite du 2026-08-24. Un membre déjà connecté saute directement à la carte.
export function CityOverview() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [exploring, setExploring] = useState(false);

  // Bug reel trouve le 2026-09-09 en creusant le retour "deconnexion
  // instantanee" : ce composant decidait avant meme que `loading` existe ici
  // (uniquement sur `user`, initialise a null le temps que auth-context relise
  // le token persiste et rappelle /auth/me). Un membre DEJA connecte qui
  // rechargeait la page ou y revenait voyait donc systematiquement flasher
  // l'ecran d'accueil anonyme (gros logo anime + "Rejoindre la communaute")
  // avant de basculer sur la carte une fois l'appel /auth/me resolu - lu a
  // tort comme une deconnexion reelle. Ce cas est distinct du bug hydrate()
  // deja corrige dans auth-context.tsx (qui ne jouait qu'juste apres un
  // login()/signup() reussi) : celui-ci se declenche a CHAQUE chargement de
  // page, y compris un simple F5, tant qu'une session valide est en cours de
  // restauration depuis le stockage local.
  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10">
        <span className="inline-block scale-[2.2] text-terracotta">
          <Spinner />
        </span>
      </div>
    );
  }

  if (!user && !exploring) {
    return <WelcomeIntro onExplore={() => setExploring(true)} />;
  }

  return (
    // min-h-0 : sans ça, un enfant flex-1 (ce div) refuse par defaut de retrecir sous la
    // taille intrinseque de son contenu (Hero + MoroccoMap) - sur un petit viewport, le
    // contenu deborderait silencieusement au lieu de defiler (audit + validation agent Plan
    // du 2026-09-05 : cause racine du bouton "Creer" qui pouvait sortir de l'ecran visible,
    // pas seulement son position: absolute).
    <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">
      <Hero />
      {/* Retour utilisateur 2026-09-09 : "les pages pour voir des bounties
          sont ou ? Je ne vois que la carte. Pas d'explication." Le texte de
          Hero.tsx donnait deja une piste mais se fondait dans le reste - cette
          astuce se distingue visuellement et nomme explicitement les 2
          concepts produit (Pins/Bounties) plutot qu'une reformulation vague. */}
      <PageHint id="map-pins-bounties">
        Clique sur une ville pour voir ses <strong className="text-ink">Pins</strong> (astuces
        déposées) et <strong className="text-ink">Bounties</strong> (demandes d&apos;aide) — ou
        utilise le bouton <strong className="text-ink">Créer</strong> pour en ajouter un toi-même.
      </PageHint>
      <MoroccoMap onSelectCity={setSelectedCity} />

      {/* fixed, pas absolute : ancre au viewport reel plutot qu'a la hauteur (potentiellement
          etendue) de ce conteneur - un bouton d'action flottant doit rester atteignable peu
          importe le defilement. Insets de zone securisee (encoche/barre de gestes iPhone) -
          necessite viewportFit:"cover" dans layout.tsx pour se resoudre a une vraie valeur. */}
      <button
        type="button"
        onClick={() => (user ? setCreating(true) : router.push("/login"))}
        className="fixed z-10 flex h-14 items-center gap-2 rounded-full bg-terracotta px-5 text-sm font-semibold text-terracotta-ink shadow-2xl"
        style={{
          bottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))",
          right: "calc(1rem + env(safe-area-inset-right, 0px))",
        }}
      >
        <svg viewBox="0 0 20 20" width="20" height="20" fill="none">
          <path
            d="M10 4v12M4 10h12"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
        Créer
      </button>

      {selectedCity && !creating && (
        <CityPanel
          cityName={selectedCity}
          onClose={() => setSelectedCity(null)}
        />
      )}

      {creating && (
        <CreateSheet
          initialCity={selectedCity ?? undefined}
          onClose={() => setCreating(false)}
          onPinCreated={(pin) => setSelectedCity(pin.cityName)}
          onBountyCreated={(bounty) => setSelectedCity(bounty.cityName)}
        />
      )}
    </div>
  );
}
