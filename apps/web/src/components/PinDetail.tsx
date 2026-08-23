"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError } from "@/lib/api";
import type { PinType, PinView } from "@/lib/types";
import { DetailSheet } from "./DetailSheet";
import { ErrorMessage } from "./ErrorMessage";
import { Spinner } from "./Spinner";

const TYPE_LABEL: Record<PinType, string> = {
  astuce: "Astuce",
  lieu_sur: "Lieu sûr",
  piege_administratif: "Piège administratif",
  alerte: "Alerte",
};

export function PinDetail({
  pin,
  onClose,
  onDeleted,
}: {
  pin: PinView;
  onClose: () => void;
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

  return (
    <DetailSheet onClose={onClose}>
      <div className="flex flex-col gap-3">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-bg-elevated px-2.5 py-1 font-head text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
          {TYPE_LABEL[pin.type]}
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
    </DetailSheet>
  );
}
