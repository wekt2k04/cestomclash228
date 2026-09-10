// Formes des reponses API - reflete exactement ce que apps/api renvoie
// (voir user.mapper.ts, roles.service.ts, pins.service.ts, bounties.service.ts).
// Pas de generation automatique de types pour le MVP - a reconsiderer si le
// contrat API bouge souvent (voir agent architecture-review).

export interface City {
  id: string;
  name: string;
}

export interface PublicUser {
  id: string;
  email: string;
  googleId: string | null;
  displayName: string;
  homeCity: City | null;
  homeCityId: string | null;
  createdAt: string;
}

export type RoleScope = "national" | "local";

export interface Role {
  id: string;
  userId: string;
  scope: RoleScope;
  city: City | null;
  cityId: string | null;
}

export type PinType = "astuce" | "lieu_sur" | "piege_administratif" | "alerte";

export interface PinView {
  id: string;
  type: PinType;
  title: string;
  description: string;
  lat: number;
  lng: number;
  cityId: string;
  cityName: string;
  authorId: string;
  authorDisplayName: string;
  createdAt: string;
}

export interface PinCluster {
  lat: number;
  lng: number;
  count: number;
  pinIds: string[];
}

export type BountyStatus = "open" | "claimed" | "resolved" | "expired";

// Marketplace (apps/api/src/bounties/bounty-kind.enum.ts / service-category.enum.ts, etendu cote
// API le 2026-09-09) - kind reste "request" pour toute Bounty creee ici (l'"offre de service"
// n'a pas de flux de creation dedie cote frontend, hors perimetre de ce projet).
export type BountyKind = "request" | "offer";
export type ServiceCategory =
  | "tutorat"
  | "traduction"
  | "aide_administrative"
  | "covoiturage"
  | "demenagement"
  | "autre";

export interface BountyView {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  cityId: string;
  cityName: string;
  status: BountyStatus;
  authorId: string;
  authorDisplayName: string;
  claimedById: string | null;
  claimedByDisplayName: string | null;
  expiresAt: string;
  resolvedAt: string | null;
  ratingValue: number | null;
  ratingComment: string | null;
  kind: BountyKind;
  // null = Bounty gratuite (chemin "prendre en charge" direct, /bounties/:id/claim). Non-null =
  // parcours payant (propositions/confiance/preuve, voir BountyInterestView plus bas).
  priceMad: number | null;
  isRemote: boolean;
  category: ServiceCategory | null;
  createdAt: string;
}

export type BountyInterestStatus = "pending" | "accepted" | "declined" | "confirmed";
export type TrustBadge = "nouveau" | "actif" | "fiable";

// Vue candidat (GET /bounties/:id/interests, reservee a l'auteur) - trustBadge/completedCount/
// averageRating sont CALCULES cote serveur depuis l'historique reel de Bounties resolues du
// candidat (voir BountyInterestsService.findCandidates()), jamais des champs de profil
// editables.
export interface BountyInterestCandidateView {
  id: string;
  userId: string;
  displayName: string;
  status: BountyInterestStatus;
  proofImageUrl: string | null;
  proofSubmittedAt: string | null;
  createdAt: string;
  completedCount: number;
  averageRating: number | null;
  trustBadge: TrustBadge;
}

// Vue "ma proposition" (reponse de POST/PATCH /bounties/:id/interests, /bounty-interests/:id/*) -
// forme complete renvoyee par le backend (bounty/user imbriques, eager) mais seuls ces champs
// sont utilises cote frontend.
export interface BountyInterestView {
  id: string;
  bountyId: string;
  userId: string;
  status: BountyInterestStatus;
  proofImageUrl: string | null;
  proofSubmittedAt: string | null;
  createdAt: string;
}

export interface MessageView {
  id: string;
  conversationId: string;
  authorId: string;
  author: { displayName: string };
  body: string;
  createdAt: string;
}

export type SponsorshipStatus = "pending" | "approved" | "rejected";

// Forme complete (GET /sponsorship-requests/mine, /pending, /:id) - reserve au
// demandeur ou a un verificateur, voir apps/api/src/sponsorship/sponsorship.service.ts.
export interface SponsorshipRequestView {
  id: string;
  requesterId: string;
  requester: { displayName: string };
  description: string;
  amountDeclared: number;
  proofImageUrl: string;
  status: SponsorshipStatus;
  reviewedById: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

// Forme allegee et volontairement differente (GET /sponsorship-requests/approved,
// public) - jamais amountDeclared/proofImageUrl, voir findApprovedPublic().
export interface ApprovedSponsor {
  id: string;
  description: string;
  requesterDisplayName: string;
}
