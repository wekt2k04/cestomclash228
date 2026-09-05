# Assets vidéo — 5 maquettes pour Canva Pro

5 fichiers HTML autonomes (aucune dépendance sauf Google Fonts en ligne), un par écran/moment
demandé, 390×844px (format mobile) — ouvrables directement dans un navigateur pour capture d'écran
ou enregistrement, ou leur code réutilisable tel quel. Couleurs reprises **exactement** du CSS
compilé de l'appli réelle le 2026-09-05 (`--bg:#1a0704`, `--terracotta:#ed7940`, etc. — voir
`apps/web/src/app/globals.css`), pas inventées. Retour utilisateur du 2026-09-05 qui a motivé la
révision de ce set : chaque partie de la vidéo doit être "compréhensible et révélatrice" de son
propre moment du script — les 4 premiers assets illustraient tous le PRODUIT (donc rien pour le
moment [0s-10s], qui parle du problème AVANT le produit) ; `00-hook-probleme.html` comble ce trou.

- `00-hook-probleme.html` — le moment [0s-10s] du script (voir `VIDEO_SCRIPT.md`) : une
  silhouette débordée, entourée de bulles de chat chaotiques et inutiles ("URGENT quelqu'un a un
  logement pour demain 🙏", "c'est déjà répondu plus haut je crois"), illustre concrètement le
  problème ("noyé dans des groupes WhatsApp qui n'aident plus personne") avant que le produit
  n'apparaisse. Bulles volontairement génériques (pas le vert de marque WhatsApp) — le propos est
  "un chat qui n'aide plus personne", pas une référence à une appli précise.
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

**Mise à jour 2026-09-05** : `02-pin-dore.html` et `04-ghost-mode.html` avaient un vrai défaut à
l'ouverture (retour utilisateur : "c'est moche", capture à l'appui) — une grande zone quasi vide
sans intention visuelle (fond plat derrière la sheet du Pin Doré, marges immenses autour du toggle
Ghost Mode). Corrigés (fond de carte suggéré en arrière-plan du Pin Doré, halo/silhouette de
fantôme en arrière-plan du toggle) — **toujours pas re-vérifiés à l'écran** après correction, pas
d'outil de rendu navigateur connecté au moment du fix. `01-social-map.html` et `03-bounty.html`
n'ont pas eu ce défaut signalé. `00-hook-probleme.html` est entièrement nouveau, jamais ouvert.
**Rouvre les 5 fichiers toi-même avant de les importer dans Canva** — c'est la seule vérification
fiable disponible tant qu'aucun outil de rendu réel n'est actif ici.
