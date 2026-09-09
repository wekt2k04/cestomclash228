"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError } from "@/lib/api";
import type { City } from "@/lib/types";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Spinner } from "@/components/Spinner";
import { EyeIcon, EyeOffIcon } from "@/components/PasswordToggleIcons";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export default function SignupPage() {
  const { signup, user, loading } = useAuth();
  const router = useRouter();
  const [cities, setCities] = useState<City[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [homeCityId, setHomeCityId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  // Meme rebond qu'en connexion (voir login/page.tsx) - un membre deja
  // connecte ne doit pas revoir un formulaire de creation de compte.
  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, user, router]);

  if (loading || user) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <span className="inline-block scale-[2.2] text-terracotta">
          <Spinner />
        </span>
      </main>
    );
  }

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
            autoComplete="name"
            autoFocus
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
            inputMode="email"
            autoComplete="email"
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
          {/* autoComplete="new-password" (pas "current-password") - incite le
              gestionnaire de mots de passe a en GENERER un fort plutot que
              proposer un mot de passe existant, seul comportement correct a
              la creation d'un compte (Regle 45). Bouton oeil ajoute a cote du
              check vert existant (les 2 coexistent : l'un confirme la
              longueur minimale, l'autre permet de relire ce qu'on a tape). */}
          <div className="relative">
            <input
              required
              minLength={MIN_PASSWORD_LENGTH}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              aria-invalid={!!passwordError}
              aria-describedby={passwordError ? "signup-password-error" : undefined}
              className={`input pr-16 ${passwordError ? "border-red" : ""}`}
            />
            {passwordLongEnough && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute right-11 top-1/2 -translate-y-1/2 text-green"
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
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={
                showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"
              }
              aria-pressed={showPassword}
              className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-ink-muted hover:text-ink"
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
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

      {/* "Continuer avec Google" retire le 2026-09-09 : GOOGLE_CLIENT_ID/SECRET
          ne sont pas configures cote Render (401 invalid_client reel constate
          par l'utilisateur) - voir la meme note dans app/login/page.tsx. */}

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
