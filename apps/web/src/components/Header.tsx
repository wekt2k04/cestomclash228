"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { MuteToggle } from "./MuteToggle";
import { MindClashMark } from "./MindClashMark";

export function Header() {
  const { user, loading, logout } = useAuth();

  return (
    <header
      className="flex items-center justify-between gap-1.5 border-b border-line bg-bg px-2 pb-3 sm:gap-3 sm:px-4"
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
          en dessous.

          Grille de largeurs reelles testees en direct (Claude in Chrome,
          2026-09-09, mesure sur elements reellement rendus - fonts/tailles
          exactes du site en prod, pas une estimation) :
            320px (iPhone SE 1e gen 2016, pratiquement inexistant en usage
                   reel en 2026)      -> ne rentre pas (~325px necessaires) ;
                   arbitrage delibere : descendre a 12px de police + padding
                   quasi nul degraderait la lisibilite pour TOUS les mobiles
                   pour un gain sur une classe d'appareil eteinte - non
                   retenu, filet overflow-x-hidden gere le residu.
            360px (plancher reel des Android actuels)  -> rentre, ~16px de
                   marge (344px necessaires).
            390-430px (iPhone 12+ standard/Pro/Max, Pixel, Galaxy standard)
                   -> rentre largement.
          "Connexion" perd son style de bouton (bordure/fond/padding) sous
          `sm:` et redevient un simple lien texte souligne au survol - c'est
          la plus grosse economie de largeur trouvee (bouton ~80px -> lien nu
          ~60px) sans jamais le cacher : un visiteur qui revient sur mobile
          garde un acces direct a la connexion depuis l'accueil (option
          "juste masquer Connexion" ecartee pour cette raison). Reste un vrai
          lien avec cible tactile de 44px (h-11), juste sans habillage
          visuel de bouton. */}
      <Link href="/" className="flex min-w-0 items-center gap-1 sm:gap-2">
        <MindClashMark size={19} />
        <span className="truncate font-head text-[13px] font-bold tracking-normal text-ink sm:tracking-wide sm:text-[15px]">
          CESTOMCLASH<span className="text-gold">228</span>
        </span>
      </Link>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
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
              className="flex h-11 items-center rounded-lg border border-line bg-bg-elevated px-2 text-xs font-medium text-ink-muted transition-colors hover:text-ink sm:px-3"
            >
              Déconnexion
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/login"
              className="flex h-11 items-center rounded-lg px-0 text-xs font-medium text-ink-muted transition-colors hover:text-ink sm:border sm:border-line sm:bg-bg-elevated sm:px-3"
            >
              Connexion
            </Link>
            <Link
              href="/signup"
              className="flex h-11 items-center rounded-lg bg-terracotta px-2 text-xs font-semibold text-terracotta-ink sm:px-3"
            >
              Rejoindre
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
