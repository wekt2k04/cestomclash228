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
    <div className="relative flex flex-1 flex-col">
      <Hero />
      <MoroccoMap onSelectCity={setSelectedCity} />

      <button
        type="button"
        onClick={() => (user ? setCreating(true) : router.push("/login"))}
        className="absolute bottom-6 right-4 z-10 flex h-14 items-center gap-2 rounded-full bg-terracotta px-5 text-sm font-semibold text-terracotta-ink shadow-2xl"
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
