"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError, POLL_INTERVAL_MS } from "@/lib/api";
import type {
  BountyInterestCandidateView,
  BountyInterestView,
  BountyView,
  TrustBadge,
} from "@/lib/types";
import { ErrorMessage } from "./ErrorMessage";
import { PageHint } from "./PageHint";
import { Spinner } from "./Spinner";

const TRUST_BADGE_LABEL: Record<TrustBadge, string> = {
  nouveau: "Nouveau",
  actif: "Actif",
  fiable: "Fiable",
};
// Meme grammaire de couleur que badge-styles.ts (statut Bounty/type Pin) - jamais une nouvelle
// teinte : neutre = pas encore d'historique, terracotta = a deja livre, vert = fiable.
const TRUST_BADGE_CLASS: Record<TrustBadge, string> = {
  nouveau: "bg-bg-elevated text-ink-faint",
  actif: "bg-terracotta/15 text-terracotta",
  fiable: "bg-green/15 text-green",
};

// Seuls appelants : BountyDetail.tsx, gate deja le montage sur `bounty.priceMad != null &&
// bounty.status === "open"` - une fois CLAIMED, claimedByDisplayName (deja affiche par
// BountyDetail) suffit, ce panneau n'a plus rien a montrer.
export function BountyInterestsPanel({
  bounty,
  onBountyChanged,
}: {
  bounty: BountyView;
  onBountyChanged: (updated: BountyView) => void;
}) {
  const { user, token } = useAuth();
  if (!user) return null; // BountyDetail affiche deja "Se connecter pour agir"

  if (user.id === bounty.authorId) {
    return (
      <AuthorView bounty={bounty} token={token} onBountyChanged={onBountyChanged} />
    );
  }
  return (
    <CandidateView bounty={bounty} token={token} onBountyChanged={onBountyChanged} />
  );
}

function AuthorView({
  bounty,
  token,
  onBountyChanged,
}: {
  bounty: BountyView;
  token: string | null;
  onBountyChanged: (updated: BountyView) => void;
}) {
  const [candidates, setCandidates] = useState<
    BountyInterestCandidateView[] | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(
    async (opts?: { quiet?: boolean }) => {
      try {
        const list = await apiFetch<BountyInterestCandidateView[]>(
          `/bounties/${bounty.id}/interests`,
          { token },
        );
        setCandidates(list);
      } catch (err) {
        if (!opts?.quiet) {
          setError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
        }
      }
    },
    [bounty.id, token],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
    const interval = setInterval(() => void reload({ quiet: true }), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [reload]);

  async function accept(interestId: string) {
    setBusyId(interestId);
    setError(null);
    try {
      await apiFetch(`/bounty-interests/${interestId}/accept`, {
        method: "PATCH",
        token,
      });
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmPayment(interestId: string) {
    setBusyId(interestId);
    setError(null);
    try {
      await apiFetch(`/bounty-interests/${interestId}/confirm-payment`, {
        method: "PATCH",
        token,
      });
      // La Bounty elle-meme change de statut (claimed) - BountyDetail doit en etre informe
      // pour basculer sur le bon affichage (chat, etc.), pas seulement cette proposition.
      const updatedBounty = await apiFetch<BountyView>(`/bounties/${bounty.id}`);
      onBountyChanged(updatedBounty);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
    } finally {
      setBusyId(null);
    }
  }

  if (candidates === null) {
    return (
      <div className="flex justify-center py-2">
        <Spinner />
      </div>
    );
  }

  const hasAccepted = candidates.some(
    (c) => c.status === "accepted" || c.status === "confirmed",
  );

  return (
    <div className="flex flex-col gap-2 border-t border-line pt-3">
      <h3 className="font-head text-sm font-bold text-ink">
        Propositions reçues ({candidates.length})
      </h3>
      {candidates.length > 0 && (
        <PageHint id="bounty-interests-how-to-choose">
          Regarde le badge de confiance de chacun (calculé sur son historique réel de Bounties
          menées à bien) avant de choisir — une fois quelqu&apos;un accepté, les autres
          propositions sont automatiquement déclinées.
        </PageHint>
      )}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {candidates.length === 0 && (
        <p className="text-sm text-ink-muted">
          Personne n&apos;a encore proposé son aide.
        </p>
      )}
      {candidates.map((c) => (
        <div
          key={c.id}
          className="flex flex-col gap-2 rounded-lg border border-line bg-bg-elevated p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-ink">{c.displayName}</span>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 font-head text-[9px] font-semibold uppercase tracking-wide ${TRUST_BADGE_CLASS[c.trustBadge]}`}
            >
              {TRUST_BADGE_LABEL[c.trustBadge]}
              {c.completedCount > 0 &&
                ` · ${c.completedCount}${c.averageRating !== null ? ` · ${c.averageRating.toFixed(1)}/5` : ""}`}
            </span>
          </div>

          {c.status === "pending" && (
            <button
              type="button"
              disabled={busyId === c.id || hasAccepted}
              onClick={() => accept(c.id)}
              className="btn-primary"
            >
              {busyId === c.id ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner /> Acceptation…
                </span>
              ) : (
                `Accepter ${c.displayName}`
              )}
            </button>
          )}

          {c.status === "declined" && (
            <p className="text-xs text-ink-faint">Non retenu·e.</p>
          )}

          {(c.status === "accepted" || c.status === "confirmed") && (
            <>
              {c.proofImageUrl ? (
                <>
                  <a
                    href={c.proofImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-terracotta underline"
                  >
                    Voir la preuve de paiement →
                  </a>
                  {c.status === "accepted" && (
                    <button
                      type="button"
                      disabled={busyId === c.id}
                      onClick={() => confirmPayment(c.id)}
                      className="btn-primary"
                    >
                      {busyId === c.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <Spinner /> Confirmation…
                        </span>
                      ) : (
                        "Confirmer la réception du paiement"
                      )}
                    </button>
                  )}
                </>
              ) : (
                <p className="text-xs text-gold">
                  Accepté·e — en attente de la preuve de paiement.
                </p>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function CandidateView({
  bounty,
  token,
  onBountyChanged,
}: {
  bounty: BountyView;
  token: string | null;
  onBountyChanged: (updated: BountyView) => void;
}) {
  const [mine, setMine] = useState<BountyInterestView | null | "loading">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [proofUrl, setProofUrl] = useState("");

  const reload = useCallback(
    async (opts?: { quiet?: boolean }) => {
      try {
        const result = await apiFetch<BountyInterestView | null>(
          `/bounties/${bounty.id}/interests/mine`,
          { token },
        );
        setMine(result);
        if (result?.status === "confirmed") {
          const updatedBounty = await apiFetch<BountyView>(`/bounties/${bounty.id}`);
          onBountyChanged(updatedBounty);
        }
      } catch {
        if (!opts?.quiet) setMine(null);
      }
    },
    [bounty.id, token, onBountyChanged],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
    const interval = setInterval(() => void reload({ quiet: true }), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [reload]);

  async function express() {
    setBusy(true);
    setError(null);
    try {
      const created = await apiFetch<BountyInterestView>(
        `/bounties/${bounty.id}/interests`,
        { method: "POST", token },
      );
      setMine(created);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  }

  async function submitProof() {
    if (!mine || mine === "loading") return;
    setBusy(true);
    setError(null);
    try {
      const updated = await apiFetch<BountyInterestView>(
        `/bounty-interests/${mine.id}/proof`,
        {
          method: "PATCH",
          token,
          body: JSON.stringify({ proofImageUrl: proofUrl.trim() }),
        },
      );
      setMine(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  }

  if (mine === "loading") {
    return (
      <div className="flex justify-center py-2">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 border-t border-line pt-3">
      {error && <ErrorMessage>{error}</ErrorMessage>}

      {mine === null && (
        <button type="button" disabled={busy} onClick={express} className="btn-primary">
          {busy ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner /> Envoi…
            </span>
          ) : (
            "Proposer mon aide"
          )}
        </button>
      )}

      {mine?.status === "pending" && (
        <p className="text-sm text-ink-muted">
          Proposition envoyée — en attente de réponse de l&apos;auteur.
        </p>
      )}

      {mine?.status === "declined" && (
        <p className="text-sm text-ink-faint">
          Une autre personne a été choisie pour cette Bounty.
        </p>
      )}

      {mine?.status === "accepted" &&
        (mine.proofImageUrl ? (
          <p className="text-sm text-gold">
            Preuve envoyée — en attente de confirmation par l&apos;auteur.
          </p>
        ) : (
          <div className="flex flex-col gap-2 rounded-lg border border-line bg-bg-elevated p-3">
            <p className="text-sm text-ink">
              Tu as été choisi·e ! Envoie exactement <strong>{bounty.priceMad} MAD</strong> puis
              colle ici le lien vers une capture de la confirmation (CIH ou autre moyen).
            </p>
            <input
              type="url"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="https://…"
              className="input"
            />
            <button
              type="button"
              disabled={busy || !proofUrl.trim()}
              onClick={submitProof}
              className="btn-primary"
            >
              {busy ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner /> Envoi…
                </span>
              ) : (
                "Envoyer la preuve de paiement"
              )}
            </button>
          </div>
        ))}
    </div>
  );
}
