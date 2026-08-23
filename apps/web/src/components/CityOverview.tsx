"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { MoroccoMap } from "./MoroccoMap";
import { CityPanel } from "./CityPanel";
import { CreateSheet } from "./CreateSheet";

// Remplace l'ancien SocialMap (MapLibre) par la vue "carte du Maroc stylisée
// + présence par ville" (voir MoroccoMap.tsx). Orchestration identique dans
// l'esprit : bouton "+" pour créer, panneau de détail au clic.
export function CityOverview() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="relative flex flex-1 flex-col">
      <MoroccoMap onSelectCity={setSelectedCity} />

      <button
        type="button"
        onClick={() => (user ? setCreating(true) : router.push("/login"))}
        aria-label="Créer un Pin ou une Bounty"
        className="absolute bottom-6 right-4 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-cyan text-cyan-ink shadow-2xl"
      >
        <svg viewBox="0 0 20 20" width="24" height="24" fill="none">
          <path
            d="M10 4v12M4 10h12"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
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
