"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

// Retour utilisateur du 2026-08-23 : l'accueil se resumait a la carte, "rien
// d'interessant qui donne envie de continuer". Ajoute un accroc d'accueil
// avec la proposition de valeur reelle du canevas strategique (pas de
// contenu invente) plutot qu'un ecran qui va droit aux donnees.
export function Hero() {
  const { user, loading } = useAuth();

  return (
    <section className="border-b border-line bg-bg px-4 py-5 sm:px-6">
      <p className="font-head text-lg font-bold tracking-wide text-ink sm:text-xl">
        {!loading && user ? (
          <>
            Content de te revoir, <span className="text-gold">{user.displayName}</span>.
          </>
        ) : (
          <>
            Explore<span className="text-terracotta">.</span> Partage
            <span className="text-green">.</span> Level-up
            <span className="text-gold">.</span>
          </>
        )}
      </p>
      <p className="mt-1.5 max-w-xl text-sm text-ink-muted">
        {!loading && user
          ? "Une astuce à déposer ? Une main à trouver avant ce soir ? Choisis une ville sur la carte."
          : "Le premier moteur de survie géolocalisé pour la diaspora étudiante togolaise au Maroc — l'entraide et le vécu du terrain, ancrés ville par ville."}
      </p>
      {!loading && !user && (
        <Link
          href="/signup"
          className="mt-3 inline-block rounded-lg bg-terracotta px-4 py-2 text-sm font-semibold text-terracotta-ink"
        >
          Rejoindre la communauté
        </Link>
      )}
      {/* Bug de decouvrabilite reel trouve le 2026-09-09 en creusant le retour "les pages sont
          ou ?" : ces liens sont `hidden sm:inline` dans le Header (economie de largeur voulue
          et documentee, budget deja au maximum mesure) - sur mobile, ecran principal vise par
          ce projet, ces pages n'avaient ALORS plus aucun point d'entree. Repris ici, visibles a
          toutes les tailles ; "Pins"/"Bounties" ajoutes le 2026-09-10 (memes pages globales que
          les nouveaux liens du Header). */}
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-muted">
        <Link href="/pins" className="underline hover:text-ink">
          Voir tous les Pins →
        </Link>
        <Link href="/bounties" className="underline hover:text-ink">
          Voir toutes les Bounties →
        </Link>
        <Link href="/sponsoring" className="underline hover:text-ink">
          Voir les sponsors vérifiés →
        </Link>
      </div>
    </section>
  );
}
