"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, POLL_INTERVAL_MS } from "@/lib/api";
import type { BountyStatus, BountyView } from "@/lib/types";
import { BOUNTY_STATUS_BADGE } from "@/lib/badge-styles";
import { DetailSheet } from "@/components/DetailSheet";
import { BountyDetail } from "@/components/BountyDetail";
import { PageHint } from "@/components/PageHint";
import { Spinner } from "@/components/Spinner";
import { ErrorMessage } from "@/components/ErrorMessage";

// Page globale demandee le 2026-09-10, voir la meme note dans app/pins/page.tsx. Onglets plutot
// qu'une liste unique : "Archivées" (= status=resolved) repond directement au retour utilisateur
// explicite ("une fois qu'une bounty est terminee elle peut passer en archive mais pas
// disparaitre") - deja le comportement reel aujourd'hui (RESOLUED n'est jamais supprimee,
// seulement absente de la vue par defaut de CityPanel.tsx qui ne charge que ?status=open), cette
// page le rend enfin consultable. GET /bounties?status=X existe deja, aucun changement backend.
type Tab = Extract<BountyStatus, "open" | "claimed" | "resolved">;
const TABS: Array<{ value: Tab; label: string }> = [
  { value: "open", label: "Ouvertes" },
  { value: "claimed", label: "Prises en charge" },
  { value: "resolved", label: "Archivées" },
];

export default function BountiesPage() {
  const [tab, setTab] = useState<Tab>("open");
  const [bounties, setBounties] = useState<BountyView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<BountyView | null>(null);

  const reload = useCallback(
    async (opts?: { quiet?: boolean }) => {
      try {
        const list = await apiFetch<BountyView[]>(`/bounties?status=${tab}`);
        setBounties(list);
      } catch {
        if (!opts?.quiet) setError("Impossible de charger les Bounties.");
      }
    },
    [tab],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBounties(null);
    void reload();
    const interval = setInterval(() => void reload({ quiet: true }), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [reload]);

  const grouped = bounties ? groupByCity(bounties) : null;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
      <h1 className="font-head text-xl font-bold text-ink">Toutes les Bounties</h1>
      <PageHint id="all-bounties-page">
        Toutes les demandes d&apos;aide de la communauté, ville par ville. Une Bounty{" "}
        <strong className="text-ink">résolue</strong> reste visible ici, dans l&apos;onglet{" "}
        <strong className="text-ink">Archivées</strong> — rien ne disparaît.
      </PageHint>

      <div className="flex gap-2" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => setTab(t.value)}
            className={`flex h-11 flex-1 items-center justify-center rounded-lg border px-2 text-xs font-medium ${
              tab === t.value
                ? "border-terracotta bg-terracotta text-terracotta-ink"
                : "border-line bg-bg-elevated text-ink-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {bounties === null && !error && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {grouped && Object.keys(grouped).length === 0 && (
        <p className="text-sm text-ink-muted">Rien dans cet onglet pour l&apos;instant.</p>
      )}
      {grouped &&
        Object.entries(grouped).map(([cityName, cityBounties]) => (
          <section key={cityName} className="flex flex-col gap-2">
            <h2 className="font-head text-sm font-bold text-ink">{cityName}</h2>
            <div className="flex flex-col gap-2">
              {cityBounties.map((b) => {
                const badge = BOUNTY_STATUS_BADGE[b.status];
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelected(b)}
                    className={`flex items-center justify-between gap-2 rounded-lg border-l-4 ${badge.accentClassName} bg-bg-elevated px-3 py-2 text-left text-sm text-ink`}
                  >
                    <span className="truncate">{b.title}</span>
                    {b.priceMad !== null && (
                      <span className="shrink-0 font-head text-xs font-bold text-terracotta">
                        {b.priceMad} MAD
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        ))}

      {selected && (
        <DetailSheet onClose={() => setSelected(null)}>
          <BountyDetail
            bounty={selected}
            onChanged={(updated) => {
              setSelected(updated);
              setBounties(
                (prev) =>
                  prev?.map((b) => (b.id === updated.id ? updated : b)) ?? null,
              );
            }}
          />
        </DetailSheet>
      )}
    </main>
  );
}

function groupByCity(bounties: BountyView[]): Record<string, BountyView[]> {
  const grouped: Record<string, BountyView[]> = {};
  for (const b of bounties) {
    (grouped[b.cityName] ??= []).push(b);
  }
  return grouped;
}
