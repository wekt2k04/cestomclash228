"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Hero } from "./Hero";
import { MoroccoMap } from "./MoroccoMap";
import { CityPanel } from "./CityPanel";
import { CreateSheet } from "./CreateSheet";
import { WelcomeIntro } from "./WelcomeIntro";

// Remplace l'ancien SocialMap (MapLibre) par la vue "carte du Maroc stylisée
// + présence par ville" (voir MoroccoMap.tsx). Orchestration : écran d'accueil
// séparé (WelcomeIntro) avant la carte pour un visiteur non connecté — corrigé
// le 2026-08-31, la carte n'apparaissait auparavant qu'après un simple bandeau
// Hero sur le même scroll, jamais un vrai premier écran malgré la demande
// explicite du 2026-08-24. Un membre déjà connecté saute directement à la carte.
export function CityOverview() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [exploring, setExploring] = useState(false);

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
