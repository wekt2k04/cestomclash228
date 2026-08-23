// Contour du Maroc (polygone simplifie, donnees GeoJSON reelles de
// glynnbird/countriesgeojson) et positions des 12 villes projetees dans le
// MEME systeme de coordonnees (projection lineaire lng/lat -> x/y, calculee
// une fois hors-app - voir le script utilise dans le commit qui introduit ce
// fichier). Garantit que le contour et les marqueurs de ville restent
// mutuellement cohérents, même si le contour est simplifié plutôt qu'un
// tracé côtier détaillé - cohérence interne plus importante que la
// précision cartographique absolue pour un rendu stylisé.
//
// Duplique volontairement les memes coordonnees que
// apps/api/src/cities/cities.service.ts (SEED_CITIES) : petite table
// statique et stable (12 villes marocaines ne changent pas), pas encore
// necessaire d'exposer lat/lng via l'API /cities pour ce seul usage
// d'affichage. A reconsiderer si une vraie liste dynamique de villes arrive.
export const MOROCCO_VIEWBOX = "0 0 800 800";

export const MOROCCO_OUTLINE_PATH =
  "M 585.85,56.69 L 614.73,77.03 L 660.3,73.72 L 709.93,84.29 L 730.74,84.81 L 748.8,115.5 L 751.66,144.64 L 768.21,195.22 L 780.83,205.41 L 772.05,224.03 L 709.34,232.1 L 687.66,249.82 L 659.94,254 L 657.89,289.48 L 601.86,308.44 L 583.54,332.43 L 544.32,345.31 L 496.47,352.62 L 419.09,387.98 L 419.5,444.75 L 412.2,444.75 L 412.2,444.75 L 413.3,470.42 L 383.68,471.96 L 368.24,482.87 L 346.48,482.87 L 329.14,476.64 L 288.83,481.79 L 273.23,519.13 L 258.25,522.64 L 235.72,583.05 L 169.11,634.76 L 153.3,700.92 L 133.67,722.45 L 127.91,739.71 L 20,743.54 L 19.17,743.46 L 21.43,721.26 L 39.83,708.2 L 55.51,683.23 L 52.42,667.02 L 68.89,633.21 L 95.56,602.74 L 111.7,595.02 L 124.38,567.07 L 125.52,541.55 L 142.81,511.93 L 174.73,494.46 L 205.1,445.53 L 205.98,444.86 L 230.07,426.46 L 274.63,421.17 L 312.39,388.41 L 336.41,375.65 L 376.41,335.64 L 364.44,276.02 L 382.64,234.8 L 389.07,209.57 L 419.89,177.2 L 467.96,155.31 L 503.5,135.5 L 535.51,85.89 L 550.58,56.46 L 585.85,56.69 Z";

export interface CityGeo {
  name: string;
  lat: number;
  lng: number;
  x: number;
  y: number;
}

export const CITIES: CityGeo[] = [
  { name: "Rabat", lat: 34.0209, lng: -6.8416, x: 506.9, y: 139.79 },
  { name: "Casablanca", lat: 33.5731, lng: -7.5898, x: 471.04, y: 161.25 },
  { name: "Marrakech", lat: 31.6295, lng: -7.9811, x: 452.3, y: 254.38 },
  { name: "Fès", lat: 34.0331, lng: -5.0003, x: 595.12, y: 139.21 },
  { name: "Tanger", lat: 35.7595, lng: -5.834, x: 555.18, y: 56.48 },
  { name: "Ifrane", lat: 33.5228, lng: -5.1106, x: 589.84, y: 163.66 },
  { name: "Safi", lat: 32.2994, lng: -9.2372, x: 392.11, y: 222.28 },
  { name: "Agadir", lat: 30.4278, lng: -9.5981, x: 374.81, y: 311.96 },
  { name: "Oujda", lat: 34.6867, lng: -1.9114, x: 743.13, y: 107.89 },
  { name: "Kénitra", lat: 34.261, lng: -6.5802, x: 519.42, y: 128.29 },
  { name: "Meknès", lat: 33.8935, lng: -5.5473, x: 568.91, y: 145.89 },
  { name: "El Jadida", lat: 33.2316, lng: -8.5007, x: 427.4, y: 177.61 },
];
