"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, POLL_INTERVAL_MS } from "@/lib/api";
import type { PinView } from "@/lib/types";
import { PIN_TYPE_BADGE } from "@/lib/badge-styles";
import { DetailSheet } from "@/components/DetailSheet";
import { PinDetail } from "@/components/PinDetail";
import { PageHint } from "@/components/PageHint";
import { Spinner } from "@/components/Spinner";
import { ErrorMessage } from "@/components/ErrorMessage";

// Page globale demandee le 2026-09-10 ("2 boutons dans la nav : toutes les Pins / toutes les
// Bounties") - jusqu'ici, un Pin n'etait visible que depuis le panneau d'UNE ville (CityPanel.tsx)
// deja selectionnee sur la carte, aucune vue d'ensemble. Aucun changement backend : GET /pins
// accepte deja l'absence de bbox (voir apps/api/src/pins/pins.controller.ts).
export default function PinsPage() {
  const [pins, setPins] = useState<PinView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PinView | null>(null);

  const reload = useCallback(async (opts?: { quiet?: boolean }) => {
    try {
      const list = await apiFetch<PinView[]>("/pins");
      setPins(list);
    } catch {
      if (!opts?.quiet) setError("Impossible de charger les Pins.");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
    const interval = setInterval(() => void reload({ quiet: true }), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [reload]);

  const grouped = pins ? groupByCity(pins) : null;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
      <h1 className="font-head text-xl font-bold text-ink">Tous les Pins</h1>
      <PageHint id="all-pins-page">
        Toutes les <strong className="text-ink">astuces</strong>,{" "}
        <strong className="text-ink">lieux sûrs</strong>,{" "}
        <strong className="text-ink">pièges administratifs</strong> et{" "}
        <strong className="text-ink">alertes</strong> déposés par la communauté, ville par
        ville — rien ne disparaît.
      </PageHint>

      {pins === null && !error && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {grouped && Object.keys(grouped).length === 0 && (
        <p className="text-sm text-ink-muted">
          Rien pour l&apos;instant — sois le·la premier·ère à déposer une astuce.
        </p>
      )}
      {grouped &&
        Object.entries(grouped).map(([cityName, cityPins]) => (
          <section key={cityName} className="flex flex-col gap-2">
            <h2 className="font-head text-sm font-bold text-ink">{cityName}</h2>
            <div className="flex flex-col gap-2">
              {cityPins.map((p) => {
                const badge = PIN_TYPE_BADGE[p.type];
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelected(p)}
                    className={`flex items-center gap-2 rounded-lg border-l-4 ${badge.accentClassName} bg-bg-elevated px-3 py-2 text-left text-sm text-ink`}
                  >
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 font-head text-[9px] font-semibold uppercase tracking-wide ${badge.badgeClassName}`}
                    >
                      {badge.label}
                    </span>
                    <span className="truncate">{p.title}</span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}

      {selected && (
        <DetailSheet onClose={() => setSelected(null)}>
          <PinDetail
            pin={selected}
            onDeleted={(id) => {
              setSelected(null);
              setPins((prev) => prev?.filter((p) => p.id !== id) ?? null);
            }}
          />
        </DetailSheet>
      )}
    </main>
  );
}

function groupByCity(pins: PinView[]): Record<string, PinView[]> {
  const grouped: Record<string, PinView[]> = {};
  for (const p of pins) {
    (grouped[p.cityName] ??= []).push(p);
  }
  return grouped;
}
