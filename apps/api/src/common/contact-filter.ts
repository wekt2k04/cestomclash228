// Filtre anti-coordonnees pour le chat (docs/PLAN_EXTENSION.md § Pivot 2026-08-31, jamais ecrit
// jusqu'ici) : empeche un message de chat de servir a sortir la relation de la plateforme avant
// qu'une Bounty ne soit resolue (contournerait la notation, seul signal de confiance reel du
// systeme). Rejet net (400, voir chat.service.ts) plutot qu'une redaction silencieuse - la
// personne sait immediatement pourquoi son message n'est pas parti, ne le renvoie pas
// autrement (SMS, etc.) en pensant que ca a marche.
//
// Faux positifs plausibles a NE PAS bloquer (verifies par contact-filter.spec.ts) : une heure de
// rendez-vous ("on se voit a 15h"), un numero de chambre/porte ("chambre 204"), un prix, une
// simple suite de chiffres courte. D'ou des motifs cibles (longueur/forme d'un numero de
// telephone reel, format d'email, mots-cles de reseaux/messageries) plutot qu'un simple
// \d{2,}.

// Telephone marocain (+212/0, 9 chiffres) ou togolais (+228, 8 chiffres) - au moins 8 chiffres
// consecutifs (espaces/points/tirets optionnels entre paires), volontairement plus long qu'une
// heure ("15h30") ou un numero de chambre pour eviter les faux positifs ci-dessus.
const PHONE_PATTERN =
  /(?:\+212|0)[\s.-]?[5-7](?:[\s.-]?\d){8}|\+228[\s.-]?(?:\d[\s.-]?){8}/;

const EMAIL_PATTERN = /[\w.+-]+@[\w-]+\.[a-z]{2,}/i;

const MESSAGING_KEYWORD_PATTERN =
  /\b(whatsapp|wa\.me|telegram|t\.me|instagram|insta|snapchat|snap|facebook|messenger|imo)\b/i;

export function containsContactInfo(text: string): boolean {
  return (
    PHONE_PATTERN.test(text) ||
    EMAIL_PATTERN.test(text) ||
    MESSAGING_KEYWORD_PATTERN.test(text)
  );
}
