// Marketplace (refonte 2026-09-09) : categorie optionnelle d'une Bounty de
// type offer/request payante - generaliste par demande explicite (pas un seul
// type figue a la Glovo/InDrive), voir docs/BUSINESS_PLAN.md.
export enum ServiceCategory {
  TUTORAT = 'tutorat',
  TRADUCTION = 'traduction',
  AIDE_ADMINISTRATIVE = 'aide_administrative',
  COVOITURAGE = 'covoiturage',
  DEMENAGEMENT = 'demenagement',
  AUTRE = 'autre',
}
