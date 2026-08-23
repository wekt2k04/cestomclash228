// Composant partage (utilise a l'origine dans CreateSheet/CityPanel/
// BountyDetail/PinDetail/login/signup - 3+ duplications du meme motif avant
// extraction). Deux points de la recherche NN/g appliques ici :
// - `role="alert"` : sans lui, un lecteur d'ecran ne signale jamais
//   l'apparition d'un message d'erreur inject apres coup dans le DOM (pas de
//   rechargement de page qui la ferait lire naturellement).
// - Icone + texte, pas seulement une couleur rouge : la couleur seule est
//   invisible pour un daltonisme rouge-vert (~1 homme sur 12).
export function ErrorMessage({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="flex items-center gap-1.5 text-sm text-red">
      <svg viewBox="0 0 20 20" width="14" height="14" fill="none" className="shrink-0">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6" />
        <path d="M10 6v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="10" cy="13.5" r="1" fill="currentColor" />
      </svg>
      {children}
    </p>
  );
}
