import Link from "next/link";
import { MindClashMark } from "./MindClashMark";

// Ecran d'accueil separe, affiche avant la carte pour un visiteur non connecte -
// demande explicite du 2026-08-24 ("la carte ne doit pas etre la premiere chose
// qu'on voit... il doit y avoir quelque chose qui explique a quoi sert le site"),
// jamais codee jusqu'ici malgre 3 maquettes qui le montraient (CityOverview.tsx se
// contentait d'un bandeau Hero colle au-dessus de la carte sur le meme scroll -
// corrige ici). Un membre deja connecte passe directement a la carte (voir
// CityOverview.tsx) : pas besoin de re-expliquer le produit a chaque visite.
export function WelcomeIntro({ onExplore }: { onExplore: () => void }) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10 text-center">
      <MindClashMark size={56} />

      <div>
        <h1 className="font-head text-3xl font-bold tracking-wide text-ink">
          CESTOMCLASH<span className="text-gold">228</span>
        </h1>
        <p className="mt-2 font-head text-base font-semibold text-terracotta">
          Explore. Partage. Level-up.
        </p>
        <p className="mx-auto mt-3 max-w-sm text-sm text-ink-muted">
          Le premier moteur de survie géolocalisé pour la diaspora étudiante
          togolaise au Maroc — l&apos;entraide et le vécu du terrain, ancrés
          ville par ville.
        </p>
      </div>

      <div className="grid w-full max-w-sm gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-bg-elevated p-4 text-left">
          <p className="font-head text-sm font-bold text-gold">Pins</p>
          <p className="mt-1 text-xs text-ink-muted">
            Des astuces, bons plans et alertes qui restent affichés sur la
            carte, pour tous.
          </p>
        </div>
        <div className="rounded-xl border border-line bg-bg-elevated p-4 text-left">
          <p className="font-head text-sm font-bold text-terracotta">Bounties</p>
          <p className="mt-1 text-xs text-ink-muted">
            Une demande d&apos;aide concrète, résolue par quelqu&apos;un qui
            est déjà passé par là.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onExplore}
        className="btn-primary flex items-center gap-2 px-6 py-3 text-sm"
      >
        Explorer la carte
      </button>
      <Link href="/signup" className="text-xs text-ink-muted underline">
        Rejoindre la communauté
      </Link>
    </section>
  );
}
