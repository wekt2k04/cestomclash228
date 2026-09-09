"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError } from "@/lib/api";
import { formatCountdown } from "@/lib/geo";
import type { BountyView } from "@/lib/types";
import { BOUNTY_STATUS_BADGE } from "@/lib/badge-styles";
import { ErrorMessage } from "./ErrorMessage";
import { Spinner } from "./Spinner";

// PAS de <DetailSheet> propre ici - voir la note equivalente dans PinDetail.tsx (bug reel
// corrige le 2026-09-09 : 2 DetailSheet montes/demontes dans le meme commit React
// corrompaient la pile d'historique du navigateur). Rendu desormais DANS le DetailSheet unique
// et persistant de CityPanel.tsx.
export function BountyDetail({
  bounty,
  onChanged,
}: {
  bounty: BountyView;
  onChanged: (updated: BountyView) => void;
}) {
  const { user, token } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Notation (docs/PLAN_EXTENSION.md § Pivot 2026-08-31, Increment 3bis) :
  // brouillon local avant envoi, jamais transmis tant que l'auteur n'a pas
  // choisi une valeur (pas de note 0 par defaut qui serait une vraie note).
  const [ratingDraft, setRatingDraft] = useState<number | null>(null);
  const [ratingComment, setRatingComment] = useState("");

  const isAuthor = user?.id === bounty.authorId;
  const isClaimant = user?.id === bounty.claimedById;
  const canClaim = Boolean(user) && !isAuthor && bounty.status === "open";
  const canResolve =
    (isAuthor || isClaimant) && bounty.status === "claimed";
  const canRate =
    isAuthor && bounty.status === "resolved" && bounty.ratingValue === null;

  async function act(action: "claim" | "resolve") {
    setError(null);
    setBusy(true);
    try {
      const updated = await apiFetch<BountyView>(
        `/bounties/${bounty.id}/${action}`,
        { method: "PATCH", token },
      );
      onChanged(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  }

  async function submitRating() {
    if (ratingDraft === null) return;
    setError(null);
    setBusy(true);
    try {
      const updated = await apiFetch<BountyView>(`/bounties/${bounty.id}/rate`, {
        method: "PATCH",
        token,
        body: JSON.stringify({
          value: ratingDraft,
          comment: ratingComment.trim() || undefined,
        }),
      });
      onChanged(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  }

  const statusBadge = BOUNTY_STATUS_BADGE[bounty.status];

  return (
    // Barre de couleur sur le bord gauche plutot qu'une bordure decorative uniforme -
    // direction deja actee pour la refonte visuelle (voir le plan), appliquee ici en avance sur
    // ce seul composant : signale le statut au premier coup d'oeil, avant meme de lire le texte
    // de la pastille.
    <div className={`flex flex-col gap-3 border-l-4 ${statusBadge.accentClassName} pl-3`}>
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-head text-[10px] font-semibold uppercase tracking-wide ${statusBadge.badgeClassName}`}
          >
            Bounty · {statusBadge.label}
          </span>
          <span className="font-head text-sm font-bold text-red">
            {formatCountdown(bounty.expiresAt)}
          </span>
        </div>

        <h2 className="font-head text-base font-bold text-ink">{bounty.title}</h2>
        <p className="text-sm text-ink-muted">{bounty.description}</p>
        <p className="text-xs text-ink-faint">
          {bounty.cityName} · par {bounty.authorDisplayName}
          {bounty.claimedByDisplayName
            ? ` · prise en charge par ${bounty.claimedByDisplayName}`
            : ""}
        </p>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        {!user && (
          <Link href="/login" className="btn-primary text-center">
            Se connecter pour agir
          </Link>
        )}
        {canClaim && (
          <button
            type="button"
            disabled={busy}
            onClick={() => act("claim")}
            className="btn-primary"
          >
            {busy ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner /> Prise en charge…
              </span>
            ) : (
              "Prendre en charge cette Bounty"
            )}
          </button>
        )}
        {canResolve && (
          <button
            type="button"
            disabled={busy}
            onClick={() => act("resolve")}
            className="btn-primary"
          >
            {busy ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner /> Mise à jour…
              </span>
            ) : (
              "Marquer résolue"
            )}
          </button>
        )}

        {bounty.ratingValue !== null && (
          <div className="rounded-lg border border-line bg-bg-elevated p-3">
            <p className="font-head text-sm font-bold text-gold">
              Note : {bounty.ratingValue}/5
            </p>
            {bounty.ratingComment && (
              <p className="mt-1 text-xs text-ink-muted">
                « {bounty.ratingComment} »
              </p>
            )}
          </div>
        )}

        {canRate && (
          <div className="flex flex-col gap-2 rounded-lg border border-line bg-bg-elevated p-3">
            <p className="text-sm text-ink-muted">
              Note la personne qui vous a aidé
            </p>
            <div className="flex gap-2" role="radiogroup" aria-label="Note de 1 à 5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={ratingDraft === n}
                  onClick={() => setRatingDraft(n)}
                  className={`flex h-11 flex-1 items-center justify-center rounded-lg border text-sm font-semibold ${
                    ratingDraft === n
                      ? "border-terracotta bg-terracotta text-terracotta-ink"
                      : "border-line bg-bg text-ink-muted"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <textarea
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Un commentaire (optionnel)"
              className="input resize-none"
            />
            <button
              type="button"
              disabled={busy || ratingDraft === null}
              onClick={submitRating}
              className="btn-primary"
            >
              {busy ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner /> Envoi…
                </span>
              ) : (
                "Envoyer la note"
              )}
            </button>
          </div>
        )}
      </div>
  );
}
