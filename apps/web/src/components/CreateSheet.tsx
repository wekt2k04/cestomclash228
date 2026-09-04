"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError } from "@/lib/api";
import { CITIES } from "@/lib/morocco-geo";
import type { BountyView, PinType, PinView } from "@/lib/types";
import { DetailSheet } from "./DetailSheet";
import { ErrorMessage } from "./ErrorMessage";
import { Spinner } from "./Spinner";

const PIN_TYPES: Array<{ value: PinType; label: string }> = [
  { value: "astuce", label: "Astuce" },
  { value: "lieu_sur", label: "Lieu sûr" },
  { value: "piege_administratif", label: "Piège admin." },
  { value: "alerte", label: "Alerte" },
];

const DURATIONS = [2, 12, 24];

export function CreateSheet({
  initialCity,
  onClose,
  onPinCreated,
  onBountyCreated,
}: {
  initialCity?: string;
  onClose: () => void;
  onPinCreated: (pin: PinView) => void;
  onBountyCreated: (bounty: BountyView) => void;
}) {
  const { token } = useAuth();
  const [kind, setKind] = useState<"pin" | "bounty">("bounty");
  const [cityName, setCityName] = useState(initialCity ?? CITIES[0].name);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pinType, setPinType] = useState<PinType>("astuce");
  const [durationHours, setDurationHours] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Validation au blur, pas a chaque frappe (NN/g : signaler une erreur
  // pendant que l'utilisateur tape encore est premature et percu comme
  // agressif) - un champ ne montre son erreur qu'une fois "touche".
  const [touched, setTouched] = useState<{ title?: boolean; description?: boolean }>({});

  const titleError =
    touched.title && title.trim().length === 0 ? "Le titre est requis." : null;
  const descriptionError =
    touched.description && description.trim().length === 0
      ? "La description est requise."
      : null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ title: true, description: true });
    if (title.trim().length === 0 || description.trim().length === 0) return;

    setError(null);
    setSubmitting(true);
    try {
      // Pas de carte cliquable : la position soumise est le centre
      // approximatif de la ville choisie (voir lib/morocco-geo.ts).
      const city = CITIES.find((c) => c.name === cityName) ?? CITIES[0];
      if (kind === "bounty") {
        const bounty = await apiFetch<BountyView>("/bounties", {
          method: "POST",
          token,
          body: JSON.stringify({
            title,
            description,
            lat: city.lat,
            lng: city.lng,
            durationHours,
          }),
        });
        onBountyCreated(bounty);
      } else {
        const pin = await apiFetch<PinView>("/pins", {
          method: "POST",
          token,
          body: JSON.stringify({
            type: pinType,
            title,
            description,
            lat: city.lat,
            lng: city.lng,
          }),
        });
        onPinCreated(pin);
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  const hasDraft = title.trim().length > 0 || description.trim().length > 0;

  return (
    <DetailSheet
      onClose={onClose}
      confirmClose={() =>
        !hasDraft ||
        window.confirm("Abandonner ce brouillon ? Le contenu saisi sera perdu.")
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
        <div className="flex gap-2">
          <TabButton active={kind === "bounty"} onClick={() => setKind("bounty")}>
            Bounty (entraide)
          </TabButton>
          <TabButton active={kind === "pin"} onClick={() => setKind("pin")}>
            Pin (astuce)
          </TabButton>
        </div>

        <label className="flex flex-col gap-1.5 text-sm text-ink-muted">
          Ville
          <select
            value={cityName}
            onChange={(e) => setCityName(e.target.value)}
            className="input"
          >
            {CITIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-ink-muted">
          Titre
          <input
            required
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, title: true }))}
            aria-invalid={!!titleError}
            aria-describedby={titleError ? "create-title-error" : undefined}
            placeholder="Ex. Photocopieur gratuit à la fac"
            className={`input ${titleError ? "border-red" : ""}`}
          />
          {titleError && (
            <span id="create-title-error" role="alert" className="text-xs text-red">
              {titleError}
            </span>
          )}
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-ink-muted">
          Description
          <textarea
            required
            maxLength={2000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, description: true }))}
            aria-invalid={!!descriptionError}
            aria-describedby={descriptionError ? "create-description-error" : undefined}
            placeholder="Donne assez de détails pour être utile à quelqu'un qui découvre la ville"
            rows={3}
            className={`input resize-none ${descriptionError ? "border-red" : ""}`}
          />
          {descriptionError && (
            <span id="create-description-error" role="alert" className="text-xs text-red">
              {descriptionError}
            </span>
          )}
        </label>

        {kind === "bounty" ? (
          <div className="flex gap-2">
            {DURATIONS.map((h) => (
              <TabButton
                key={h}
                active={durationHours === h}
                onClick={() => setDurationHours(h)}
              >
                {h} h
              </TabButton>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {PIN_TYPES.map((t) => (
              <TabButton
                key={t.value}
                active={pinType === t.value}
                onClick={() => setPinType(t.value)}
              >
                {t.label}
              </TabButton>
            ))}
          </div>
        )}

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner /> Publication…
            </span>
          ) : (
            "Publier"
          )}
        </button>
      </form>
    </DetailSheet>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex-1 rounded-lg border px-2 py-2 text-xs font-medium ${
        active
          ? "border-terracotta bg-terracotta text-terracotta-ink"
          : "border-line bg-bg-elevated text-ink-muted"
      }`}
    >
      {children}
    </button>
  );
}
