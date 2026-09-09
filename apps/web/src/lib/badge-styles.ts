import type { BountyStatus, PinType } from "./types";

export interface BadgeStyle {
  label: string;
  // Classes Tailwind ECRITES EN CLAIR (jamais construites par interpolation - le scanner JIT de
  // Tailwind a besoin de voir chaque nom de classe complet dans le code source, pas assemble a
  // l'execution) : `badgeClassName` pour la pastille (fond teinte + texte assorti), `accentClassName`
  // pour la barre de couleur sur les cartes de liste (CityPanel.tsx).
  badgeClassName: string;
  accentClassName: string;
}

// Retour utilisateur 2026-09-09 ("il faut... des statuts... et des jeux de couleur pour
// visuellement signaler") : jusqu'ici, le statut d'une Bounty et le type d'un Pin s'affichaient
// dans la MEME pastille grise neutre (bg-bg-elevated/text-ink-muted) quel que soit leur sens -
// aucun signal visuel. Un seul point central pour ce mapping (plutot que duplique dans
// BountyDetail/PinDetail/CityPanel) : les 3 endroits qui affichent un statut/type doivent
// rester coherents entre eux si le mapping change.
//
// Choix des couleurs - les 4 seules teintes de la palette (globals.css), jamais une nouvelle :
// - rouge (--red) deja reserve a "urgence" ailleurs (le compte a rebours de BountyDetail) -
//   volontairement PAS reutilise pour un statut (eviterait 2 rouges de sens different cote a
//   cote). Reste dispo pour Alerte (Pin), sens le plus proche de "danger/urgence".
// - vert (--green) = positif/en securite (deja le sens de "resolue" avant ce changement, et de
//   "Lieu sur" - coherence gardee).
// - or (--gold) = attire l'oeil sans alarmer - "Ouverte" (une Bounty active a repondre) et
//   "Piege administratif" (prudence, pas un danger immediat).
// - terracotta = couleur de marque/action - "Prise en charge" (en cours, quelqu'un agit) et
//   "Astuce" (info neutre utile).
export const BOUNTY_STATUS_BADGE: Record<BountyStatus, BadgeStyle> = {
  open: {
    label: "Ouverte",
    badgeClassName: "bg-gold/15 text-gold",
    accentClassName: "border-gold",
  },
  // "Prise en charge" (pas "Reclamee") - l'ancien libelle sonnait comme une plainte ("je
  // reclame"), a contre-sens dans une appli d'entraide ; le nouveau nomme l'etat du point de
  // vue de la personne aidee, cible utilisateur suggeree explicitement le 2026-09-09.
  claimed: {
    label: "Prise en charge",
    badgeClassName: "bg-terracotta/15 text-terracotta",
    accentClassName: "border-terracotta",
  },
  resolved: {
    label: "Résolue",
    badgeClassName: "bg-green/15 text-green",
    accentClassName: "border-green",
  },
  // Neutre (pas une des 4 teintes d'accent) - une Bounty expiree est inactive, pas un
  // avertissement ; lui donner un accent la ferait ressortir autant qu'une active, a contre-sens
  // de la hierarchie visuelle voulue (un statut mort doit s'effacer, pas attirer l'oeil).
  expired: {
    label: "Expirée",
    badgeClassName: "bg-bg-elevated text-ink-faint",
    accentClassName: "border-line",
  },
};

export const PIN_TYPE_BADGE: Record<PinType, BadgeStyle> = {
  astuce: {
    label: "Astuce",
    badgeClassName: "bg-terracotta/15 text-terracotta",
    accentClassName: "border-terracotta",
  },
  lieu_sur: {
    label: "Lieu sûr",
    badgeClassName: "bg-green/15 text-green",
    accentClassName: "border-green",
  },
  piege_administratif: {
    label: "Piège administratif",
    badgeClassName: "bg-gold/15 text-gold",
    accentClassName: "border-gold",
  },
  alerte: {
    label: "Alerte",
    badgeClassName: "bg-red/15 text-red",
    accentClassName: "border-red",
  },
};
