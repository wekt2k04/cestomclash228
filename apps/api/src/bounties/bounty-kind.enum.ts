// Marketplace (refonte 2026-09-09) : distingue une demande d'aide classique
// (REQUEST, comportement historique - voir bounty.entity.ts) d'une offre de
// service proposee (OFFER, ex. un etudiant styliste qui propose ses services).
// Determine le sens de la notation dans BountiesService.rate() : pour REQUEST
// l'auteur note qui l'a aide, pour OFFER c'est l'inverse (le client note le
// prestataire).
export enum BountyKind {
  REQUEST = 'request',
  OFFER = 'offer',
}
