"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Spinner } from "@/components/Spinner";
import { EyeIcon, EyeOffIcon } from "@/components/PasswordToggleIcons";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
          Content de te revoir sur CestomClash228.
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm text-ink-muted">
          Email
          <input
            required
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
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
          {/* autoComplete="current-password" (pas "new-password") - Regle 45 du
              referentiel UX/UI : distingue explicitement une connexion d'une
              creation de compte, seul le 2e cas doit inciter le gestionnaire
              de mots de passe a EN GENERER un nouveau. Bouton oeil
              montrer/cacher (Regle 8, "saisie redondante" - verifier ce qu'on
              vient de taper sans tout retaper) : pattern attendu par defaut sur
              un champ mot de passe en 2026, absent jusqu'ici sur ce formulaire. */}
          <div className="relative">
            <input
              required
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              aria-invalid={!!passwordError}
              aria-describedby={passwordError ? "login-password-error" : undefined}
              className={`input pr-11 ${passwordError ? "border-red" : ""}`}
            />
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

      {/* "Continuer avec Google" retire le 2026-09-09 : GOOGLE_CLIENT_ID/SECRET
          ne sont pas configures cote Render (401 invalid_client reel constate
          par l'utilisateur) - obtenir de vraies cles necessite de creer un
          projet OAuth dans Google Cloud Console (acces utilisateur requis, pas
          faisable depuis ici). L'email+mot de passe reste la voie principale,
          pleinement fonctionnelle. Route backend /auth/google toujours cablee
          (voir apps/api/src/auth/) - reactiver ce lien des que de vraies cles
          sont fournies. */}

      <p className="text-center text-sm text-ink-muted">
        Pas encore de compte ?{" "}
        <Link href="/signup" className="text-terracotta">
          Rejoindre
        </Link>
      </p>
    </main>
  );
}
