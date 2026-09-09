"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError } from "@/lib/api";
import type { PinView } from "@/lib/types";
import { PIN_TYPE_BADGE } from "@/lib/badge-styles";
import { ErrorMessage } from "./ErrorMessage";
import { Spinner } from "./Spinner";

// PAS de <DetailSheet> propre ici (bug reel corrige le 2026-09-09) : quand ce composant
// rendait son propre DetailSheet, passer de la liste (DetailSheet de CityPanel.tsx) a un detail
// de Pin demontait ce 1er DetailSheet et en montait un 2e DANS LE MEME commit React - leurs
// effets pushState()/history.back() (voir DetailSheet.tsx) se chevauchaient (back()
// asynchrone, pushState() synchrone), corrompant la pile d'historique du navigateur de facon
// reproductible (constate via Claude in Chrome : le clic sur une Bounty/un Pin depuis la liste
// atterrissait sur une AUTRE page du site, deja visitee bien plus tot dans la session). Le
// contenu ci-dessous est desormais rendu DANS le DetailSheet unique et persistant de
// CityPanel.tsx, qui decide seul de la fermeture (retour a la liste vs fermeture complete).
export function PinDetail({
  pin,
  onDeleted,
}: {
  pin: PinView;
  onDeleted: (id: string) => void;
}) {
  const { user, role, token } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canDelete =
    user?.id === pin.authorId ||
    (role?.scope === "local" && role.cityId === pin.cityId);

  async function remove() {
    setError(null);
    setBusy(true);
    try {
      await apiFetch(`/pins/${pin.id}`, { method: "DELETE", token });
      onDeleted(pin.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
      setBusy(false);
    }
  }

  const typeBadge = PIN_TYPE_BADGE[pin.type];

  return (
    <div className={`flex flex-col gap-3 border-l-4 ${typeBadge.accentClassName} pl-3`}>
      <span
        className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 font-head text-[10px] font-semibold uppercase tracking-wide ${typeBadge.badgeClassName}`}
      >
        {typeBadge.label}
      </span>
      <h2 className="font-head text-base font-bold text-ink">{pin.title}</h2>
      <p className="text-sm text-ink-muted">{pin.description}</p>
      <p className="text-xs text-ink-faint">
        {pin.cityName} · par {pin.authorDisplayName}
      </p>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {canDelete && (
        <button
          type="button"
          disabled={busy}
          onClick={remove}
          className="rounded-lg border border-red/40 px-3 py-2 text-sm font-medium text-red"
        >
          {busy ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner /> Suppression…
            </span>
          ) : (
            "Supprimer ce Pin"
          )}
        </button>
      )}
    </div>
  );
}
