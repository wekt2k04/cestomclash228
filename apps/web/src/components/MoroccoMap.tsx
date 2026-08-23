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
// Compteurs par ville volontairement pas-encore-reels pour l'instant
// (demande explicite : "pour le moment mets des chiffres aleatoires") - mais
// PAS un vrai Math.random() : ce composant est rendu cote serveur (SSR) puis
// hydrate cote client, et Math.random() donnerait une valeur differente a
// chaque environnement -> mismatch d'hydratation garanti (constate en usage
// reel, voir .claude/HANDOFF/LOG.md). Un hash deterministe du nom de la
// ville donne le meme resultat des deux cotes, tout en ayant l'air varie/
// pas-encore-reel comme demande. A remplacer par de vraies donnees
// (ex: utilisateurs actifs par ville) quand ce sera precise.
// Chaque ville est un <g role="button" tabIndex={0}> plutot qu'un simple
// onClick - un <g> SVG sans ça n'est ni focusable ni activable au clavier,
// gap d'accessibilite reel (NN/g : toute action doit rester operable au
// clavier, pas seulement a la souris/au tactile). Le <svg> racine n'a donc
// plus role="img" (qui suppose un contenu graphique plat, non interactif -
// incompatible avec des enfants focusables) ; son aria-label suffit a
// donner le contexte d'ensemble, chaque marqueur porte le sien.
function seededPresence(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return 3 + (hash % 97);
}

// 3 paliers discrets plutot qu'une interpolation continue - recherche NN/g
// (Fork 3) : la taille d'un encodage visuel continu est difficile a comparer
// precisement a l'oeil (un cercle 17% plus grand qu'un autre ne "se voit"
// pas comme tel), alors que quelques paliers nettement distincts se
// perçoivent et se comparent immediatement. Rayon max volontairement modere
// (19px, pas 28px comme avant) : avec les 12 villes de morocco-geo.ts, deux
// cercles a 19px de rayon se touchent a partir de 38px d'ecart entre
// centres - toutes les paires de villes proches ont ete verifiees/ajustees
// pour rester au-dessus de ce seuil (voir commentaire dans morocco-geo.ts).
const RADIUS_TIERS = [11, 15, 19] as const;

export function MoroccoMap({
  onSelectCity,
}: {
  onSelectCity: (cityName: string) => void;
}) {
  const [presence] = useState<Record<string, number>>(() =>
    Object.fromEntries(CITIES.map((c) => [c.name, seededPresence(c.name)])),
  );
  const [hovered, setHovered] = useState<string | null>(null);

  const counts = CITIES.map((c) => presence[c.name]);
  const minCount = Math.min(...counts);
  const maxCount = Math.max(...counts);
  const radiusFor = (count: number) => {
    if (maxCount === minCount) return RADIUS_TIERS[1];
    const t = (count - minCount) / (maxCount - minCount);
    if (t < 1 / 3) return RADIUS_TIERS[0];
    if (t < 2 / 3) return RADIUS_TIERS[1];
    return RADIUS_TIERS[2];
  };
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
          stroke="var(--cyan)"
          strokeOpacity={0.4}
          strokeWidth={2}
        />

        {CITIES.map((city) => {
          const count = presence[city.name];
          const r = radiusFor(count);
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
                <circle r={r + 6} fill="var(--cyan)" fillOpacity={0.18} />
              )}
              <circle
                r={r}
                fill="var(--cyan)"
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
                fill="var(--cyan-ink)"
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
