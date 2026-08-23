"use client";

import { useEffect } from "react";
import { useAudio } from "@/lib/audio-context";

// Recherche NN/g appliquee ici (voir .claude/HANDOFF/LOG.md pour le detail
// des sources par element) :
// - Scrim (fond assombri, cliquable pour fermer) : une sheet sans overlay
//   laisse le contenu derriere interactif, ambigu sur ce qui a le focus.
// - Cible tactile de fermeture portee a 44x44px (WCAG 2.5.5 / NN/g).
// - Integration au bouton "retour" du navigateur : une sheet ouverte pousse
//   une entree d'historique ; le geste "retour" natif (bouton Android,
//   swipe iOS, bouton navigateur) la ferme comme n'importe quel overlay
//   natif le ferait - au lieu d'un etat React invisible pour l'historique
//   du navigateur, incoherent avec l'attente de l'utilisateur.
// - `confirmClose` (optionnel) : laisse un consommateur (CreateSheet)
//   intercepter la fermeture pour confirmer l'abandon d'une saisie non
//   enregistree ("Cancel vs Close", NN/g) - les sheets en lecture seule
//   (CityPanel/PinDetail/BountyDetail) n'en ont pas besoin et ne le passent
//   pas.
// - Ducking audio pendant l'ouverture (voir lib/audio-context.tsx) : reduit
//   le volume ambiant le temps d'une tache de lecture/saisie.
export function DetailSheet({
  onClose,
  confirmClose,
  children,
}: {
  onClose: () => void;
  confirmClose?: () => boolean;
  children: React.ReactNode;
}) {
  useEffect(() => {
    window.history.pushState({ mindclashSheet: true }, "");
    let closedViaPopState = false;
    const onPopState = () => {
      closedViaPopState = true;
      onClose();
    };
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
      // Fermeture via la croix/le scrim (pas via le bouton retour) : on
      // "consomme" nous-memes l'entree d'historique poussee au montage,
      // pour que back/forward restent coherents apres coup. Le listener est
      // deja retire juste au-dessus, donc le popstate declenche par ce
      // back() ne re-declenchera pas onClose une seconde fois.
      if (!closedViaPopState) window.history.back();
    };
  }, [onClose]);

  const { duck, unduck } = useAudio();
  useEffect(() => {
    duck();
    return () => unduck();
  }, [duck, unduck]);

  const requestClose = () => {
    if (confirmClose && !confirmClose()) return;
    window.history.back();
  };

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={requestClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-t-2xl border border-line bg-bg-card p-4 shadow-2xl sm:m-4 sm:rounded-2xl">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={requestClose}
            aria-label="Fermer"
            className="-m-2 flex h-11 w-11 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-bg-elevated hover:text-ink"
          >
            <svg viewBox="0 0 20 20" width="18" height="18" fill="none">
              <path
                d="M5 5l10 10M15 5 5 15"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
