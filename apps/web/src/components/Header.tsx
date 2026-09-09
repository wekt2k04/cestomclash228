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
