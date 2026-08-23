"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { BountyView, PinView } from "@/lib/types";
import { DetailSheet } from "./DetailSheet";
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
  const [selectedPin, setSelectedPin] = useState<PinView | null>(null);
  const [selectedBounty, setSelectedBounty] = useState<BountyView | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    // Reinitialise l'etat de chargement a chaque changement de ville - fetch
    // reseau declenche par un effet, cas d'usage canonique de useEffect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([
      apiFetch<PinView[]>("/pins"),
      apiFetch<BountyView[]>("/bounties?status=open"),
    ])
      .then(([allPins, allBounties]) => {
        if (cancelled) return;
        setPins(allPins.filter((p) => p.cityName === cityName));
        setBounties(allBounties.filter((b) => b.cityName === cityName));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cityName]);

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

        {loading && <p className="text-sm text-ink-muted">Chargement…</p>}

        {!loading && pins.length === 0 && bounties.length === 0 && (
          <p className="text-sm text-ink-muted">
            Rien pour l&apos;instant dans cette ville.
          </p>
        )}

        {bounties.length > 0 && (
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

        {pins.length > 0 && (
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
