"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { MuteToggle } from "./MuteToggle";
import { MindClashMark } from "./MindClashMark";

export function Header() {
  const { user, loading, logout } = useAuth();

  return (
    <header
      className="flex items-center justify-between gap-3 border-b border-line bg-bg px-4 pb-3"
      style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))" }}
    >
      <Link href="/" className="flex items-center gap-2">
        <MindClashMark size={26} />
        <span className="font-head text-[15px] font-bold tracking-wide text-ink">
          CESTOMCLASH<span className="text-gold">228</span>
        </span>
      </Link>

      <div className="flex items-center gap-3">
        {/* Attribution requise par la licence CC-BY 3.0 de la musique - ne pas
            retirer ce lien. Reformule suite au retour utilisateur du 2026-09-05
            ("mène vers autre chose, ça ne me plaît pas") : le libelle precedent
            ("Musique : PlayOnLoop") ressemblait a un controle de lecture alors
            que c'est un simple credit legal vers la source - "(crédit)" et
            l'icone de note clarifient l'intention avant le clic. */}
        <a
          href="https://playonloop.com"
          target="_blank"
          rel="noopener noreferrer"
          title="Ce lien ouvre le site PlayOnLoop (crédit légal requis par la licence CC-BY 3.0) - il ne joue pas la musique ici. Utilise l'icône haut-parleur pour couper/activer le son."
          className="hidden text-[10px] text-ink-faint hover:text-ink-muted sm:inline"
        >
          ♪ Musique (crédit)
        </a>
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
              className="flex h-11 items-center rounded-lg border border-line bg-bg-elevated px-3 text-xs font-medium text-ink-muted transition-colors hover:text-ink"
            >
              Déconnexion
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="flex h-11 items-center rounded-lg border border-line bg-bg-elevated px-3 text-xs font-medium text-ink-muted transition-colors hover:text-ink"
            >
              Connexion
            </Link>
            <Link
              href="/signup"
              className="flex h-11 items-center rounded-lg bg-terracotta px-3 text-xs font-semibold text-terracotta-ink"
            >
              Rejoindre
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
