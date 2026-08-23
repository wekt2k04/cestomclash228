"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Spinner } from "@/components/Spinner";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Validation au blur (pas a chaque frappe - NN/g : signaler une erreur
  // pendant que l'utilisateur tape encore est premature et perçu comme
  // agressif ; attendre la soumission, a l'inverse, est trop tardif et fait
  // perdre un aller-retour complet).
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});

  const emailError =
    touched.email && !EMAIL_RE.test(email) ? "Adresse email invalide." : null;
  const passwordError =
    touched.password && password.length === 0 ? "Le mot de passe est requis." : null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!EMAIL_RE.test(email) || password.length === 0) return;

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

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm text-ink-muted">
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            aria-invalid={!!emailError}
            aria-describedby={emailError ? "login-email-error" : undefined}
            className={`input ${emailError ? "border-red" : ""}`}
          />
          {emailError && (
            <span id="login-email-error" role="alert" className="text-xs text-red">
              {emailError}
            </span>
          )}
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-ink-muted">
          Mot de passe
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            aria-invalid={!!passwordError}
            aria-describedby={passwordError ? "login-password-error" : undefined}
            className={`input ${passwordError ? "border-red" : ""}`}
          />
          {passwordError && (
            <span id="login-password-error" role="alert" className="text-xs text-red">
              {passwordError}
            </span>
          )}
        </label>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner /> Connexion…
            </span>
          ) : (
            "Se connecter"
          )}
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
