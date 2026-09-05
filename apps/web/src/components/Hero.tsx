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
    </section>
  );
}
