"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
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
        <h1 className="font-head text-2xl font-bold text-ink">Connexion</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Content de te revoir sur MindClash 228.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm text-ink-muted">
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-ink-muted">
          Mot de passe
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
        </label>

        {error && <p className="text-sm text-red">{error}</p>}

        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      <a href={`${API_URL}/auth/google`} className="btn-google">
        Continuer avec Google
      </a>

      <p className="text-center text-sm text-ink-muted">
        Pas encore de compte ?{" "}
        <Link href="/signup" className="text-cyan">
          Rejoindre
        </Link>
      </p>
    </main>
  );
}
