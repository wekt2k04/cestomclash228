"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError } from "@/lib/api";
import type { ApprovedSponsor, SponsorshipRequestView } from "@/lib/types";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Spinner } from "@/components/Spinner";

const STATUS_LABEL: Record<SponsorshipRequestView["status"], string> = {
  pending: "En attente",
  approved: "Approuvée",
  rejected: "Rejetée",
};
const STATUS_COLOR: Record<SponsorshipRequestView["status"], string> = {
  pending: "text-gold",
  approved: "text-green",
  rejected: "text-red",
};

// Sponsoring vérifié (docs/PLAN_EXTENSION.md § Pivot 2026-08-31, Incrément 3) : un
// payeur soumet une demande + preuve de virement, un rôle national (vérificateur)
// l'approuve/rejette, la liste des sponsors approuvés est publique. Page unique
// plutôt que plusieurs routes séparées — les 3 vues (soumettre, suivre ses
// demandes, vérifier) partagent le même contexte et le même vocabulaire, et un
// vérificateur est aussi potentiellement demandeur.
export default function SponsoringPage() {
  const { user, token, role, loading } = useAuth();
  const isVerifier = role?.scope === "national";

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-8 px-6 py-8">
      <div>
        <h1 className="font-head text-2xl font-bold text-ink">Sponsoring vérifié</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Un virement réel vers un compte CESTOM dédié, une preuve soumise ici, un
          rôle national qui vérifie — aucune passerelle de paiement, tout reste
          traçable.
        </p>
      </div>

      {!loading && !user && (
        <p className="text-sm text-ink-muted">
          <Link href="/login" className="text-terracotta">
            Se connecter
          </Link>{" "}
          pour soumettre une demande.
        </p>
      )}

      {user && <SubmitForm token={token} />}
      {user && <MyRequests token={token} />}
      {!loading && isVerifier && <VerifierQueue token={token} />}
      <ApprovedList />
    </main>
  );
}

function SubmitForm({ token }: { token: string | null }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [proofImageUrl, setProofImageUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  const canSubmit =
    description.trim().length > 0 &&
    Number(amount) > 0 &&
    proofImageUrl.trim().length > 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;

    setError(null);
    setSuccess(false);
    setSubmitting(true);
    try {
      await apiFetch("/sponsorship-requests", {
        method: "POST",
        token,
        body: JSON.stringify({
          description,
          amountDeclared: Number(amount),
          proofImageUrl,
        }),
      });
      setDescription("");
      setAmount("");
      setProofImageUrl("");
      setTouched(false);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-line bg-bg-elevated p-4">
      <h2 className="font-head text-sm font-bold text-ink">Soumettre une demande</h2>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5 text-sm text-ink-muted">
          Ce que vous voulez mettre en avant
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => setTouched(true)}
            maxLength={500}
            rows={2}
            placeholder="Ex. Mon commerce à Rabat, visible sur la carte"
            className="input resize-none"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-ink-muted">
          Montant viré (MAD)
          <input
            type="number"
            min="1"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onBlur={() => setTouched(true)}
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-ink-muted">
          Lien vers la preuve de virement (image, https uniquement)
          <input
            type="url"
            value={proofImageUrl}
            onChange={(e) => setProofImageUrl(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="https://…"
            className="input"
          />
        </label>
        {touched && !canSubmit && (
          <span role="alert" className="text-xs text-red">
            Remplis les 3 champs (montant &gt; 0, lien en https) avant d&apos;envoyer.
          </span>
        )}
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && (
          <p className="text-sm text-green">
            Demande envoyée — en attente de vérification.
          </p>
        )}
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner /> Envoi…
            </span>
          ) : (
            "Envoyer la demande"
          )}
        </button>
      </form>
    </section>
  );
}

function MyRequests({ token }: { token: string | null }) {
  const [items, setItems] = useState<SponsorshipRequestView[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setItems(await apiFetch<SponsorshipRequestView[]>("/sponsorship-requests/mine", { token }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, [reload]);

  if (error) return <ErrorMessage>{error}</ErrorMessage>;
  if (!items) return <Spinner />;
  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-head text-sm font-bold text-ink">Mes demandes</h2>
      {items.map((r) => (
        <div
          key={r.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-line bg-bg-elevated p-3"
        >
          <div>
            <p className="text-sm text-ink">{r.description}</p>
            {r.status === "rejected" && r.rejectionReason && (
              <p className="mt-0.5 text-xs text-ink-faint">« {r.rejectionReason} »</p>
            )}
          </div>
          <span className={`shrink-0 text-xs font-semibold ${STATUS_COLOR[r.status]}`}>
            {STATUS_LABEL[r.status]}
          </span>
        </div>
      ))}
    </section>
  );
}

function VerifierQueue({ token }: { token: string | null }) {
  const [items, setItems] = useState<SponsorshipRequestView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setItems(
        await apiFetch<SponsorshipRequestView[]>("/sponsorship-requests/pending", { token }),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, [reload]);

  async function decide(id: string, action: "approve" | "reject") {
    setBusyId(id);
    setError(null);
    try {
      await apiFetch(`/sponsorship-requests/${id}/${action}`, { method: "PATCH", token });
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
    } finally {
      setBusyId(null);
    }
  }

  if (error) return <ErrorMessage>{error}</ErrorMessage>;
  if (!items) return <Spinner />;

  return (
    <section className="flex flex-col gap-2 border-t border-line pt-6">
      <h2 className="font-head text-sm font-bold text-ink">
        File de vérification ({items.length})
      </h2>
      {items.length === 0 && (
        <p className="text-sm text-ink-muted">Rien à vérifier pour l&apos;instant.</p>
      )}
      {items.map((r) => (
        <div key={r.id} className="flex flex-col gap-2 rounded-lg border border-line bg-bg-elevated p-3">
          <p className="text-sm text-ink">{r.description}</p>
          <p className="text-xs text-ink-muted">
            {r.requester.displayName} · {r.amountDeclared} MAD ·{" "}
            <a
              href={r.proofImageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-terracotta"
            >
              voir la preuve
            </a>
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busyId === r.id}
              onClick={() => decide(r.id, "approve")}
              className="flex-1 rounded-lg bg-green px-3 py-2 text-xs font-semibold text-terracotta-ink"
            >
              Approuver
            </button>
            <button
              type="button"
              disabled={busyId === r.id}
              onClick={() => decide(r.id, "reject")}
              className="flex-1 rounded-lg border border-red px-3 py-2 text-xs font-semibold text-red"
            >
              Rejeter
            </button>
          </div>
        </div>
      ))}
    </section>
  );
}

function ApprovedList() {
  const [items, setItems] = useState<ApprovedSponsor[] | null>(null);

  useEffect(() => {
    apiFetch<ApprovedSponsor[]>("/sponsorship-requests/approved")
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  if (!items || items.length === 0) return null;

  return (
    <section className="flex flex-col gap-2 border-t border-line pt-6">
      <h2 className="font-head text-sm font-bold text-ink">Sponsors vérifiés</h2>
      <ul className="flex flex-col gap-1.5">
        {items.map((s) => (
          <li key={s.id} className="text-sm text-ink-muted">
            <span className="text-gold">★</span> {s.description} —{" "}
            <span className="text-ink">{s.requesterDisplayName}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
