export enum BountyStatus {
  OPEN = 'open',
  CLAIMED = 'claimed',
  RESOLVED = 'resolved',
  // Pas de job planifie (scale-to-zero) : une bounty OPEN dont expiresAt est
  // passe est EXPIRED "en effet" des la lecture (voir BountiesService) et
  // materialisee en base a ce moment-la (lazy expiry).
  EXPIRED = 'expired',
}
