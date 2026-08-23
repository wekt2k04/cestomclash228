"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError } from "@/lib/api";
import type { City } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [cities, setCities] = useState<City[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [homeCityId, setHomeCityId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch<City[]>("/cities")
      .then(setCities)
      .catch(() => setCities([]));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signup(email, password, displayName, homeCityId || undefined);
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-12">
      <div>
        <h1 className="font-head text-2xl font-bold text-ink">Rejoindre MindClash 228</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Explore. Partage. Level-up.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Nom affiché">
          <input
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="input"
            placeholder="Ton prénom ou pseudo"
          />
        </Field>

        <Field label="Email">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="toi@exemple.com"
          />
        </Field>

        <Field label="Mot de passe (8 caractères min.)">
          <input
            required
            minLength={8}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
        </Field>

        <Field label="Ville (optionnel)">
          <select
            value={homeCityId}
            onChange={(e) => setHomeCityId(e.target.value)}
            className="input"
          >
            <option value="">— Choisir une ville —</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        {error && <p className="text-sm text-red">{error}</p>}

        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "Création…" : "Créer mon compte"}
        </button>
      </form>

      <a href={`${API_URL}/auth/google`} className="btn-google">
        Continuer avec Google
      </a>

      <p className="text-center text-sm text-ink-muted">
        Déjà un compte ?{" "}
        <Link href="/login" className="text-cyan">
          Se connecter
        </Link>
      </p>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm text-ink-muted">
      {label}
      {children}
    </label>
  );
}
