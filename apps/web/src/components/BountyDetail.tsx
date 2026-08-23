"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError } from "@/lib/api";
import { formatCountdown } from "@/lib/geo";
import type { BountyView } from "@/lib/types";
import { DetailSheet } from "./DetailSheet";

const STATUS_LABEL: Record<BountyView["status"], string> = {
  open: "Ouverte",
  claimed: "Réclamée",
  resolved: "Résolue",
  expired: "Expirée",
};

export function BountyDetail({
  bounty,
  onClose,
  onChanged,
}: {
  bounty: BountyView;
  onClose: () => void;
  onChanged: (updated: BountyView) => void;
}) {
  const { user, token } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isAuthor = user?.id === bounty.authorId;
  const isClaimant = user?.id === bounty.claimedById;
  const canClaim = Boolean(user) && !isAuthor && bounty.status === "open";
  const canResolve =
    (isAuthor || isClaimant) && bounty.status === "claimed";

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

  return (
    <DetailSheet onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-bg-elevated px-2.5 py-1 font-head text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
            Bounty · {STATUS_LABEL[bounty.status]}
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
            ? ` · réclamée par ${bounty.claimedByDisplayName}`
            : ""}
        </p>

        {error && <p className="text-sm text-red">{error}</p>}

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
            {busy ? "…" : "Réclamer cette Bounty"}
          </button>
        )}
        {canResolve && (
          <button
            type="button"
            disabled={busy}
            onClick={() => act("resolve")}
            className="btn-primary"
          >
            {busy ? "…" : "Marquer résolue"}
          </button>
        )}
      </div>
    </DetailSheet>
  );
}
