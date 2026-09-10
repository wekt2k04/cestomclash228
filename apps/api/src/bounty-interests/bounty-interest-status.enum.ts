export enum BountyInterestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  // Preuve de paiement soumise ET confirmee par l'auteur - distinct de ACCEPTED (choisi mais
  // paiement pas encore confirme) pour que l'historique des propositions reste lisible une fois
  // la Bounty CLAIMED (voir BountyInterestsService.confirmPayment()).
  CONFIRMED = 'confirmed',
}
