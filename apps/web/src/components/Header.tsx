"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { MuteToggle } from "./MuteToggle";
import { MindClashMark } from "./MindClashMark";

export function Header() {
  const { user, loading, logout } = useAuth();

  return (
    <header className="flex items-center justify-between gap-3 border-b border-line bg-bg px-4 py-3">
      <Link href="/" className="flex items-center gap-2">
        <MindClashMark size={26} />
        <span className="font-head text-[15px] font-bold tracking-wide text-ink">
          MINDCLASH <span className="text-gold">228</span>
        </span>
      </Link>

      <div className="flex items-center gap-3">
        <MuteToggle />
        {loading ? null : user ? (
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-ink-muted sm:inline">
              {user.displayName}
            </span>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-line bg-bg-elevated px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:text-ink"
            >
              Déconnexion
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg border border-line bg-bg-elevated px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:text-ink"
            >
              Connexion
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-cyan px-3 py-1.5 text-xs font-semibold text-cyan-ink"
            >
              Rejoindre
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
