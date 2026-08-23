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
  createdAt: string;
}
