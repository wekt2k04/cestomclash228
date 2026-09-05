"use client";

import { useEffect } from "react";

// Filet de secours pour une exception dans app/layout.tsx lui-meme (donc dans AuthProvider/
// AudioProvider) - app/error.tsx seul ne couvre PAS ce cas (convention Next App Router :
// error.js ne wrap jamais le layout.js du meme segment, voir node_modules/next/dist/docs).
// Ce composant definit son PROPRE <html>/<body> et ne beneficie pas automatiquement de
// globals.css/Tailwind (layout.tsx, qui les charge, est precisement ce qui a pu planter) -
// styles inline uniquement, couleurs codees en dur reprises de globals.css (hex plutot
// qu'oklch ici : robustesse maximale pour un dernier recours, aucune dependance externe).
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[global error boundary]", error);
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "1.5rem",
          textAlign: "center",
          background: "#1a0704",
          color: "#f6f1eb",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <p style={{ margin: 0, fontSize: "0.95rem" }}>
          Une erreur inattendue a interrompu l&apos;application.
        </p>
        <button
          type="button"
          onClick={retry}
          style={{
            border: "none",
            borderRadius: "0.6rem",
            background: "#ed7940",
            color: "#120805",
            fontWeight: 600,
            fontSize: "0.9rem",
            padding: "0.65rem 1.5rem",
            cursor: "pointer",
          }}
        >
          Réessayer
        </button>
      </body>
    </html>
  );
}
