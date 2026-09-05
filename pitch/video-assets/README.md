# Assets vidéo — 4 maquettes pour Canva Pro

4 fichiers HTML autonomes (aucune dépendance sauf Google Fonts en ligne), un par écran demandé,
390×844px (format mobile) — ouvrables directement dans un navigateur pour capture d'écran ou
enregistrement, ou leur code réutilisable tel quel. Couleurs reprises **exactement** du CSS
compilé de l'appli réelle le 2026-09-05 (`--bg:#1a0704`, `--terracotta:#ed7940`, etc. — voir
`apps/web/src/app/globals.css`), pas inventées.

- `01-social-map.html` — Social-Map centrale, contour réel du Maroc (même tracé SVG que
  `apps/web/src/lib/morocco-geo.ts`) + les 6 vraies villes CESTOM avec leurs effectifs réels,
  2 bulles d'aide "?" pour le concept self-explained.
- `02-pin-dore.html` — panneau de détail d'un Pin avec badge "Sponsorisé" doré. **Vision, pas
  l'état actuel du produit** : le Sponsoring vérifié existe réellement en code
  (`apps/api/src/sponsorship/`, page `/sponsoring`), mais un badge doré affiché directement sur
  un Pin de la carte n'est pas construit (pas de fonction de projection lat/lng pour ça, voir
  `docs/PLAN_EXTENSION.md` § Décisions ouvertes). À présenter comme direction, pas comme démo.
- `03-bounty.html` — carte Bounty avec compte à rebours + notation 1-5 étoiles. **Fidèle à ce qui
  existe réellement** (`PATCH /bounties/:id/rate`, testé et audité le 2026-09-04).
- `04-ghost-mode.html` — toggle Public/Fantôme. **Vision, pas construit** (Incrément 5, roadmap
  explicite du pitch).

## Comment les utiliser

Ouvrir chaque fichier dans un navigateur (double-clic, ou `file://` direct) puis :
- Capture d'écran classique (l'écran ne bouge pas, rien à enregistrer), ou
- Enregistrement vidéo de l'écran si tu veux animer un détail (ex. le toggle qui bascule) —
  aucune animation JS n'est incluse dans ces fichiers, ce sera à toi de simuler le mouvement dans
  Canva (transitions, keyframes) à partir de ces images fixes.

## Limite honnête

**Ces 4 fichiers n'ont jamais été ouverts ni vus par personne** — aucun outil de rendu
navigateur disponible dans cet environnement au moment de leur création. Seule vérification
faite : le HTML est structurellement valide (balises bien fermées, vérifié par script). Un
défaut de mise en page réel (débordement, chevauchement) est possible et n'a pas pu être détecté
avant que tu ne les ouvres toi-même.
