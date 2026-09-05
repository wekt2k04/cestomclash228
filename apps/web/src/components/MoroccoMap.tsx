"use client";

import { useState } from "react";
import { CITIES, MOROCCO_OUTLINE_PATH, MOROCCO_VIEWBOX } from "@/lib/morocco-geo";

// Remplace la carte interactive (MapLibre) suite au retour utilisateur du
// 2026-08-23 : celle-ci ne s'affichait pas de façon fiable (voir
// .claude/HANDOFF/LOG.md) et l'utilisateur a explicitement demande quelque
// chose de "simple, conteneurise... qui ne prenne pas de temps a charger".
// Un SVG inline (contour reel du Maroc + marqueurs de ville) n'a AUCUNE
// dependance reseau externe (pas de tuiles, pas de style distant) et
// s'adapte nativement a la taille de l'ecran via viewBox.
//
// Compteurs par ville = effectif CESTOM reel (CityGeo.members, source
// cestom.org - voir morocco-geo.ts), plus le hash deterministe factice
// utilise avant le 2026-08-31 (l'utilisateur a fourni les vrais chiffres).
// Chaque ville est un <g role="button" tabIndex={0}> plutot qu'un simple
// onClick - un <g> SVG sans ça n'est ni focusable ni activable au clavier,
// gap d'accessibilite reel (NN/g : toute action doit rester operable au
// clavier, pas seulement a la souris/au tactile). Le <svg> racine n'a donc
// plus role="img" (qui suppose un contenu graphique plat, non interactif -
// incompatible avec des enfants focusables) ; son aria-label suffit a
// donner le contexte d'ensemble, chaque marqueur porte le sien.

// 3 paliers discrets plutot qu'une interpolation continue - recherche NN/g
// (Fork 3) : la taille d'un encodage visuel continu est difficile a comparer
// precisement a l'oeil (un cercle 17% plus grand qu'un autre ne "se voit"
// pas comme tel), alors que quelques paliers nettement distincts se
// perçoivent et se comparent immediatement. Rayon max volontairement modere
// (19px, pas 28px comme avant).
const RADIUS_TIERS = [11, 15, 19] as const;

export function MoroccoMap({
  onSelectCity,
}: {
  onSelectCity: (cityName: string) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  const presence = Object.fromEntries(CITIES.map((c) => [c.name, c.members]));
  const counts = CITIES.map((c) => presence[c.name]);
  const minCount = Math.min(...counts);
  const maxCount = Math.max(...counts);
  // Racine carree plutot que lineaire : 220 vs 30 membres = ratio brut 7.3x,
  // qui ecraserait visuellement les petites villes si applique directement
  // au rayon. sqrt() ramene le ratio a ~2.7x, plus lisible - la taille du
  // cercle reste un encodage grossier (3 paliers) donc l'echelle exacte
  // compte moins que la fonction ne pas ecraser les extremes.
  const tierFor = (count: number): 0 | 1 | 2 => {
    if (maxCount === minCount) return 1;
    const t =
      (Math.sqrt(count) - Math.sqrt(minCount)) /
      (Math.sqrt(maxCount) - Math.sqrt(minCount));
    if (t < 1 / 3) return 0;
    if (t < 2 / 3) return 1;
    return 2;
  };
  const radiusFor = (count: number) => RADIUS_TIERS[tierFor(count)];
  // Couleur variee par palier (retour utilisateur 2026-09-05 : la carte
  // entierement monochrome orange contribuait a la fatigue visuelle) - les 3
  // teintes deja dans la palette de marque (vert/or/terracotta), jamais le
  // rouge (associe a alerte ailleurs dans l'app) ni reserve au ring "ville en
  // tete" (voir isTop plus bas, reste dore quel que soit le palier).
  const COLOR_TIERS = ["var(--green)", "var(--gold)", "var(--terracotta)"] as const;
  const colorFor = (count: number) => COLOR_TIERS[tierFor(count)];
  // Un seul element mis en avant, jamais plus (NN/g : au-dela de 1-2 points
  // d'emphase, la hierarchie visuelle s'effondre - tout devient "important"
  // donc plus rien ne l'est). Pas de nouvelle couleur : reutilise --gold,
  // deja dans la palette a 4 accents existante (voir globals.css).
  const topCityName = CITIES.reduce((best, c) =>
    presence[c.name] > presence[best.name] ? c : best,
  ).name;

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <svg
        viewBox={MOROCCO_VIEWBOX}
        className="h-full max-h-[720px] w-full max-w-[720px]"
        aria-label="Carte du Maroc avec le nombre de personnes présentes par ville - sélectionne une ville pour voir son contenu"
      >
        <defs>
          <linearGradient id="mc-outline-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--bg-elevated)" />
            <stop offset="100%" stopColor="var(--bg-card)" />
          </linearGradient>
        </defs>

        <path
          d={MOROCCO_OUTLINE_PATH}
          fill="url(#mc-outline-grad)"
          stroke="var(--terracotta)"
          strokeOpacity={0.4}
          strokeWidth={2}
        />

        {CITIES.map((city) => {
          const count = presence[city.name];
          const r = radiusFor(count);
          const color = colorFor(count);
          const isHovered = hovered === city.name;
          const isTop = city.name === topCityName;
          return (
            <g
              key={city.name}
              transform={`translate(${city.x}, ${city.y})`}
              onClick={() => onSelectCity(city.name)}
              onPointerEnter={() => setHovered(city.name)}
              onPointerLeave={() => setHovered(null)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectCity(city.name);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`${city.name} — ${count} présent·e·s`}
              style={{ cursor: "pointer" }}
            >
              {isTop && (
                <circle
                  r={r + 5}
                  fill="none"
                  stroke="var(--gold)"
                  strokeWidth={1.5}
                  strokeDasharray="2.5 2.5"
                />
              )}
              {isHovered && (
                <circle r={r + 6} fill={color} fillOpacity={0.18} />
              )}
              <circle
                r={r}
                fill={color}
                fillOpacity={0.9}
                stroke="var(--bg)"
                strokeWidth={2}
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="var(--font-head)"
                fontWeight={700}
                fontSize={Math.max(11, r * 0.62)}
                fill="var(--terracotta-ink)"
              >
                {count}
              </text>
              <text
                y={r + 16}
                textAnchor="middle"
                fontFamily="var(--font-body)"
                fontSize={13}
                fill="var(--ink-muted)"
              >
                {city.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
