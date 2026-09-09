"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { MuteToggle } from "./MuteToggle";
import { MindClashMark } from "./MindClashMark";

export function Header() {
  const { user, loading, logout } = useAuth();

  return (
    <header
      className="flex items-center justify-between gap-2 border-b border-line bg-bg px-3 pb-3 sm:gap-3 sm:px-4"
      style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))" }}
    >
      {/* Debordement horizontal reel constate (retour utilisateur + captures
          Android, 2026-09-09) : "CESTOMCLASH228" (aucun espace dans le JSX
          entre "CESTOMCLASH" et le span "228") + "Connexion"/"Rejoindre" sont
          chacun un mot insecable (pas de point de coupure CSS possible) -
          leur largeur cumulee depassait la largeur utile sur les viewports
          etroits, et rien ne contenait ce debordement (voir overflow-x-hidden
          ajoute sur body, app/layout.tsx) : toute la page devenait
          scrollable horizontalement, decalant visuellement TOUT le contenu
          en dessous. Tailles/espacements reduits sous `sm:` pour rester dans
          la largeur utile sans rien tronquer ni cacher (les 2 CTA restent
          tous les deux visibles et entiers, contrairement a une option
          envisagee de masquer "Connexion" - un visiteur qui revient doit
          pouvoir se connecter depuis l'accueil sur mobile). */}
      <Link href="/" className="flex min-w-0 items-center gap-1.5 sm:gap-2">
        <MindClashMark size={22} />
        <span className="truncate font-head text-[13px] font-bold tracking-wide text-ink sm:text-[15px]">
          CESTOMCLASH<span className="text-gold">228</span>
        </span>
      </Link>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Link
          href="/sponsoring"
          className="hidden text-xs text-ink-muted hover:text-ink sm:inline"
        >
          Sponsoring
        </Link>
        <MuteToggle />
        {loading ? null : user ? (
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-ink-muted sm:inline">
              {user.displayName}
            </span>
            <button
              type="button"
              onClick={logout}
              className="flex h-11 items-center rounded-lg border border-line bg-bg-elevated px-2.5 text-xs font-medium text-ink-muted transition-colors hover:text-ink sm:px-3"
            >
              Déconnexion
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              href="/login"
              className="flex h-11 items-center rounded-lg border border-line bg-bg-elevated px-2.5 text-xs font-medium text-ink-muted transition-colors hover:text-ink sm:px-3"
            >
              Connexion
            </Link>
            <Link
              href="/signup"
              className="flex h-11 items-center rounded-lg bg-terracotta px-2.5 text-xs font-semibold text-terracotta-ink sm:px-3"
            >
              Rejoindre
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
