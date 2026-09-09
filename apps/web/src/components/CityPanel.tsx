"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { BountyView, PinView } from "@/lib/types";
import { DetailSheet } from "./DetailSheet";
import { ErrorMessage } from "./ErrorMessage";
import { PinDetail } from "./PinDetail";
import { BountyDetail } from "./BountyDetail";

// Filtre cote client sur les listes completes (/pins, /bounties) plutot
// qu'un vrai parametre cityId sur l'API - volume de test actuel largement
// suffisant pour ça, pas necessaire de changer le contrat API pour ce seul
// usage d'affichage (voir agent architecture-review si ça devient un vrai
// probleme de performance).
export function CityPanel({
  cityName,
  onClose,
}: {
  cityName: string;
  onClose: () => void;
}) {
  const [pins, setPins] = useState<PinView[]>([]);
  const [bounties, setBounties] = useState<BountyView[]>([]);
  const [loading, setLoading] = useState(true);
  // Etat d'erreur explicite : l'ancienne version avalait silencieusement tout
  // echec reseau (.catch(() => {})), violation directe de l'heuristique NN/g
  // "visibilite de l'etat du systeme" - l'utilisateur voyait un panneau
  // vide sans savoir si la ville n'a vraiment rien, ou si le chargement a
  // echoue.
  const [loadError, setLoadError] = useState(false);
  const [selectedPin, setSelectedPin] = useState<PinView | null>(null);
  const [selectedBounty, setSelectedBounty] = useState<BountyView | null>(
    null,
  );

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    Promise.all([
      apiFetch<PinView[]>("/pins"),
      apiFetch<BountyView[]>("/bounties?status=open"),
    ])
      .then(([allPins, allBounties]) => {
        if (cancelled) return;
        setPins(allPins.filter((p) => p.cityName === cityName));
        setBounties(allBounties.filter((b) => b.cityName === cityName));
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cityName]);

  // `load` declenche un fetch reseau (cas d'usage canonique d'un effet) et
  // met a jour l'etat de chargement de façon synchrone en reponse - reste
  // aussi exposee telle quelle au bouton "Reessayer" plus bas, d'ou
  // l'indirection par useCallback plutot qu'un effet inline.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => load(), [load]);

  if (selectedPin) {
    return (
      <PinDetail
        pin={selectedPin}
        onClose={() => setSelectedPin(null)}
        onDeleted={(id) => {
          setSelectedPin(null);
          setPins((prev) => prev.filter((p) => p.id !== id));
        }}
      />
    );
  }

  if (selectedBounty) {
    return (
      <BountyDetail
        bounty={selectedBounty}
        onClose={() => setSelectedBounty(null)}
        onChanged={(updated) => {
          setSelectedBounty(updated);
          setBounties((prev) =>
            prev.map((b) => (b.id === updated.id ? updated : b)),
          );
        }}
      />
    );
  }

  return (
    <DetailSheet onClose={onClose}>
      <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto">
        <h2 className="font-head text-base font-bold text-ink">{cityName}</h2>

        {loading && <CityPanelSkeleton />}

        {!loading && loadError && (
          <div className="flex flex-col items-start gap-2 py-2">
            <ErrorMessage>Impossible de charger le contenu de cette ville.</ErrorMessage>
            <button
              type="button"
              onClick={load}
              className="flex h-11 items-center rounded-lg border border-line bg-bg-elevated px-3 text-xs font-medium text-ink-muted hover:text-ink"
            >
              Réessayer
            </button>
          </div>
        )}

        {!loading && !loadError && pins.length === 0 && bounties.length === 0 && (
          <p className="text-sm text-ink-muted">
            Rien pour l&apos;instant dans cette ville — sois le premier à déposer une astuce ou
            une demande d&apos;aide avec le bouton « Créer ».
          </p>
        )}

        {!loading && !loadError && bounties.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Bounties ouvertes
            </span>
            {bounties.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBounty(b)}
                className="rounded-lg border border-line bg-bg-elevated px-3 py-2 text-left text-sm text-ink"
              >
                {b.title}
              </button>
            ))}
          </div>
        )}

        {!loading && !loadError && pins.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Pins
            </span>
            {pins.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPin(p)}
                className="rounded-lg border border-line bg-bg-elevated px-3 py-2 text-left text-sm text-ink"
              >
                {p.title}
              </button>
            ))}
          </div>
        )}
      </div>
    </DetailSheet>
  );
}

// Forme previsible du contenu a venir (2 lignes-titre) plutot qu'un texte
// "Chargement..." qui ne dit rien de la forme du resultat - recommandation
// NN/g sur les skeleton screens (percus comme plus rapides qu'un spinner nu
// a duree egale, et evitent le saut de mise en page au chargement reel).
function CityPanelSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      <div className="h-3 w-24 animate-pulse rounded bg-bg-elevated" />
      <div className="h-9 animate-pulse rounded-lg bg-bg-elevated" />
      <div className="h-9 animate-pulse rounded-lg bg-bg-elevated" />
    </div>
  );
}
