"use client";

import { useEffect } from "react";
import { useAudio } from "@/lib/audio-context";

// Compteur module-level (pas un useRef expose via Context - effet de bord DOM pur, local a
// ce fichier) : toutes les sheets du projet (CityPanel/PinDetail/BountyDetail/CreateSheet)
// passent par ce seul composant, donc un verrou pose ici couvre tout. Meme pattern que
// duckCountRef dans lib/audio-context.tsx - robuste si plusieurs sheets se chevauchaient un
// jour (pas le cas aujourd'hui, verifie : CityPanel et CreateSheet sont deja mutuellement
// exclusifs dans CityOverview.tsx), plutot qu'un simple booleen qui reactiverait le scroll
// prematurement si une 2e sheet se fermait avant la 1ere.
let scrollLockCount = 0;

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

  // Verrou de scroll du <body> pendant que cette sheet est ouverte - sans ça, le contenu de
  // fond peut defiler "a travers" l'overlay fixed sur Safari iOS (comportement rubber-band
  // documente, audit mobile-render-audit du 2026-09-05). overflow-hidden simple plutot que
  // la technique position:fixed+sauvegarde de scrollY (plus lourde, son propre bug classique
  // si scrollY est mal restaure) - le scrim plein ecran masque deja l'essentiel d'une
  // eventuelle fuite residuelle.
  useEffect(() => {
    scrollLockCount += 1;
    document.body.style.overflow = "hidden";
    return () => {
      scrollLockCount = Math.max(0, scrollLockCount - 1);
      if (scrollLockCount === 0) document.body.style.overflow = "";
    };
  }, []);

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
      <div
        className="relative w-full max-w-md rounded-t-2xl border border-line bg-bg-card p-4 shadow-2xl sm:m-4 sm:rounded-2xl"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
      >
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
