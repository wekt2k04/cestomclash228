"use client";

import { useEffect } from "react";
import { ErrorMessage } from "@/components/ErrorMessage";

// Filet de secours generique (audit mobile-runtime-audit du 2026-09-05 : aucun error
// boundary n'existait nulle part dans le projet - une exception non catchee dans un effet
// ou un handler d'evenement cassait le rendu de toute l'appli sans aucun message). Convention
// Next App Router : ce fichier ne couvre PAS layout.tsx du meme segment (AuthProvider/
// AudioProvider, montes dans app/layout.tsx lui-meme) - voir app/global-error.tsx pour ce
// cas precis. `retry` (pas `reset`) : prop recommande depuis Next 16.3.0 pour cette meme
// action, verifie dans la doc Next vendue avec ce projet (node_modules/next/dist/docs).
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[error boundary]", error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <ErrorMessage>Une erreur inattendue est survenue.</ErrorMessage>
      <button type="button" onClick={retry} className="btn-primary px-6 py-3 text-sm">
        Réessayer
      </button>
    </div>
  );
}
