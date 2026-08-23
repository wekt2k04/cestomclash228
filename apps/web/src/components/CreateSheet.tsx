"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError } from "@/lib/api";
import { CITIES } from "@/lib/morocco-geo";
import type { BountyView, PinType, PinView } from "@/lib/types";
import { DetailSheet } from "./DetailSheet";

const PIN_TYPES: Array<{ value: PinType; label: string }> = [
  { value: "astuce", label: "Astuce" },
  { value: "lieu_sur", label: "Lieu sûr" },
  { value: "piege_administratif", label: "Piège administratif" },
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
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

  return (
    <DetailSheet onClose={onClose}>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
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

        <input
          required
          maxLength={120}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre"
          className="input"
        />
        <textarea
          required
          maxLength={2000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          rows={3}
          className="input resize-none"
        />

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
          <select
            value={pinType}
            onChange={(e) => setPinType(e.target.value as PinType)}
            className="input"
          >
            {PIN_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        )}

        {error && <p className="text-sm text-red">{error}</p>}

        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "Publication…" : "Publier"}
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
      className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium ${
        active
          ? "border-cyan bg-cyan text-cyan-ink"
          : "border-line bg-bg-elevated text-ink-muted"
      }`}
    >
      {children}
    </button>
  );
}
