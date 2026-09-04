"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError } from "@/lib/api";
import type { City } from "@/lib/types";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Spinner } from "@/components/Spinner";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

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
  const [touched, setTouched] = useState<{
    displayName?: boolean;
    email?: boolean;
    password?: boolean;
  }>({});

  useEffect(() => {
    apiFetch<City[]>("/cities")
      .then(setCities)
      .catch(() => setCities([]));
  }, []);

  const displayNameError =
    touched.displayName && displayName.trim().length === 0
      ? "Le nom affiché est requis."
      : null;
  const emailError =
    touched.email && !EMAIL_RE.test(email) ? "Adresse email invalide." : null;
  const passwordLongEnough = password.length >= MIN_PASSWORD_LENGTH;
  const passwordError =
    touched.password && !passwordLongEnough
      ? `Encore ${MIN_PASSWORD_LENGTH - password.length} caractère(s) minimum.`
      : null;

  const isValid =
    displayName.trim().length > 0 && EMAIL_RE.test(email) && passwordLongEnough;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ displayName: true, email: true, password: true });
    if (!isValid) return;

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
        <h1 className="font-head text-2xl font-bold text-ink">Rejoindre CestomClash228</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Explore. Partage. Level-up.
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <Field label="Nom affiché" error={displayNameError} errorId="signup-displayname-error">
          <input
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, displayName: true }))}
            aria-invalid={!!displayNameError}
            aria-describedby={displayNameError ? "signup-displayname-error" : undefined}
            className={`input ${displayNameError ? "border-red" : ""}`}
            placeholder="Ton prénom ou pseudo"
          />
        </Field>

        <Field label="Email" error={emailError} errorId="signup-email-error">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            aria-invalid={!!emailError}
            aria-describedby={emailError ? "signup-email-error" : undefined}
            className={`input ${emailError ? "border-red" : ""}`}
            placeholder="toi@exemple.com"
          />
        </Field>

        <Field
          label={`Mot de passe (${MIN_PASSWORD_LENGTH} caractères min.)`}
          error={passwordError}
          errorId="signup-password-error"
        >
          <div className="relative">
            <input
              required
              minLength={MIN_PASSWORD_LENGTH}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              aria-invalid={!!passwordError}
              aria-describedby={passwordError ? "signup-password-error" : undefined}
              className={`input pr-9 ${passwordError ? "border-red" : ""}`}
            />
            {passwordLongEnough && (
              <span
                aria-hidden="true"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-green"
              >
                <svg viewBox="0 0 20 20" width="16" height="16" fill="none">
                  <path
                    d="M5 10.5 8.5 14 15 6.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            )}
          </div>
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

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner /> Création…
            </span>
          ) : (
            "Créer mon compte"
          )}
        </button>
      </form>

      <a href={`${API_URL}/auth/google`} className="btn-google">
        Continuer avec Google
      </a>

      <p className="text-center text-sm text-ink-muted">
        Déjà un compte ?{" "}
        <Link href="/login" className="text-terracotta">
          Se connecter
        </Link>
      </p>
    </main>
  );
}

function Field({
  label,
  error,
  errorId,
  children,
}: {
  label: string;
  error?: string | null;
  errorId?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm text-ink-muted">
      {label}
      {children}
      {error && (
        <span id={errorId} role="alert" className="text-xs text-red">
          {error}
        </span>
      )}
    </label>
  );
}
