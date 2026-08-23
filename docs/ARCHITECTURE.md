# ARCHITECTURE — MindClash 228

Voir `docs/STACK.md` pour le choix des technologies et `docs/VISION.md` pour le périmètre du
premier incrément. Ce document couvre la structure et les décisions de conception qui ne se
lisent pas directement dans le code.

## Composants

```
Next.js (PWA)  ──HTTP/JSON──>  NestJS (API)  ──SQL──>  PostgreSQL + PostGIS
     │                              │
     └── SVG inline (carte)         └── (différé) Redis — Ghost Mode uniquement
```

Monorepo à deux packages : `apps/web` (Next.js) et `apps/api` (NestJS). Types partagés entre
les deux quand c'est utile (contrat API).

**Visualisation carte (2026-08-23)** : le backend Pins/Bounties (PostGIS, clustering
`ST_ClusterDBSCAN`, déduction de ville par plus-proche-voisin) est inchangé et pleinement
fonctionnel — voir `apps/api/src/pins`. Côté frontend, la carte interactive (MapLibre GL JS +
tuiles CARTO) a été remplacée par un SVG inline statique (contour du Maroc + 12 villes, voir
`apps/web/src/lib/morocco-geo.ts` et `MoroccoMap.tsx`) : elle ne s'affichait pas de façon
fiable sur mobile (cause précise non identifiée avant le remplacement) et l'utilisateur a
explicitement demandé quelque chose de simple/conteneurisé/rapide à charger. Le clic sur une
ville ouvre la liste de ses Pins/Bounties réels (`CityPanel.tsx`, filtrage côté client sur les
listes complètes — pas encore un paramètre `cityId` dédié côté API, voir la note dans
`morocco-geo.ts`). Les compteurs de présence par ville affichés sur la carte sont pour
l'instant des nombres aléatoires (décision explicite, pas encore de vraie métrique
"utilisateurs actifs par ville").

## RBAC spatial (noyau MVP — 2 niveaux)

Deux rôles pour le MVP : **national** (Bureau Exécutif) et **local** (SG/délégué d'une ville).
Le canevas stratégique complet prévoit 9 rôles nationaux asymétriques et un fallback par
absence de rôle local — différé, voir `docs/VISION.md`.

Deux décisions de conception actées, à ne pas re-discuter à chaque changement :

1. **Scope basé sur la cible de l'action, pas sur la position physique de l'acteur.** Le
   canevas dit qu'un SG "évapore" ses privilèges "dès que son curseur GPS ou son action cible"
   un autre territoire — on retient la lecture **cible de la ressource** (le SG de Safi ne peut
   agir que sur des ressources géotaguées Safi, quel que soit l'endroit où il se trouve
   physiquement). Un scope basé sur le GPS live de l'acteur serait fragile (un SG en déplacement
   perdrait ses droits) et ne correspond pas à la réalité d'un mandat associatif. Le GPS peut
   servir à centrer la carte, jamais à autoriser une action.
2. **Pouvoir national volontairement limité, pour garantir l'ordre.** Décision utilisateur du
   2026-08-22 : le Bureau Exécutif central n'a pas de pouvoir absolu. Aucune action destructrice
   (bannir, supprimer, mettre en quarantaine) ne doit pouvoir être déclenchée unilatéralement
   par un seul rôle national — ce principe est cohérent avec le mécanisme anti-brigading du
   canevas (quarantaine déclenchée par un algorithme multi-villes, jamais par un admin seul).
   Dans le MVP à 2 niveaux, ça se traduit concrètement par : le rôle national peut épingler du
   contenu, voir les statistiques agrégées, diffuser des alertes — mais ne peut pas
   supprimer/bannir unilatéralement en dehors d'un mécanisme collectif ou d'une action locale
   confirmée par le rôle local concerné.

Vérifié par l'agent `.claude/agents/security-review.md` (le garde-fou doit être appliqué côté
serveur, pas seulement caché côté UI) et `.claude/agents/architecture-review.md` (la logique de
scope doit être centralisée, pas dupliquée entre frontend et backend).

## Modèle de données (esquisse, MVP)

- `users` — identité, méthode d'auth (email+password hashé, ou Google OAuth), ville affiliée.
- `roles` — rôle (national/local) + ville pour un rôle local.
- `pins` — géométrie PostGIS (point), type (astuce/lieu/etc.), auteur, ville dérivée de la
  géométrie.
- `bounties` — géométrie PostGIS, titre, description, créateur, statut (ouverte / réclamée /
  résolue / expirée), échéance (2h/12h/24h), horodatage serveur faisant autorité pour
  l'expiration (jamais seulement un countdown client).

Toute frontière de "ville"/"zone" est définie à un seul endroit (table ou fonction PostGIS
faisant autorité), jamais recalculée différemment ailleurs — sinon le RBAC spatial et le
clustering peuvent diverger silencieusement.

## Ambiance sonore (UX)

Décision utilisateur du 2026-08-22 : un son de fond calme façon jeu mobile (Piano Tiles,
Shadow Fight) dès le lancement de l'appli, pas une fonctionnalité différée — ça fait partie du
polish du noyau MVP sur la Social-Map.

- **Autoplay avec son bloqué par les navigateurs** avant interaction utilisateur — démarrage en
  sourdine, fondu enchaîné dès le premier tap/clic (jamais un `audio.play()` qui échoue
  silencieusement sans plan B).
- **`AudioProvider` global** (React Context) au niveau du layout racine Next.js, pas par page —
  l'ambiance ne redémarre pas à chaque navigation. La piste change selon le contexte (calme en
  exploration de la carte, légèrement plus tendue quand une Bounty approche de l'expiration) via
  une petite state machine de "mood", pas du code dispersé par écran.
- **Contrôle utilisateur permanent** (mute/volume visible, préférence persistée en localStorage)
  — jamais de son imposé sans échappatoire facile (usage en bibliothèque, en cours).
- **État actuel (2026-08-23)** : une piste "Battle March" (CC-BY 3.0, PlayOnLoop — crédit dans
  `apps/web/public/audio/CREDITS.md` et lien visible dans le Header) en **MP3**, format décodé
  de façon universelle y compris mobile (un premier essai en WAV PCM 8 bits, puis en Ogg Vorbis,
  ne jouait pas de façon fiable sur téléphone — voir historique dans ce même `CREDITS.md`).
  Bouclée via un moteur `LoopEngine` (Web Audio API, `apps/web/src/lib/audio-context.tsx`) à
  fondu enchaîné au point de bouclage, pas un `<audio loop>` qui saute sec à 0:00.
- **Chaîne de gain à deux étages** dans `LoopEngine` : un gain "de cycle" forme le fondu
  d'entrée/sortie à chaque boucle, connecté à un gain "maître" qui porte le niveau utilisateur et
  le **ducking** (volume réduit pendant qu'une `DetailSheet` — sheet ou formulaire — est ouverte,
  restauré à la fermeture). Séparer les deux évite qu'un changement de niveau maître attende la
  fin du cycle en cours pour prendre effet.
- **Déverrouillage mobile** : `AudioContext.resume()` peut se résoudre sans que l'état ne passe
  réellement à `"running"` si le geste d'origine n'est pas reconnu comme valide par le
  navigateur — `LoopEngine.play()` vérifie l'état explicitement et lève une erreur sinon, et
  `AudioProvider` continue d'écouter le geste suivant plutôt que d'abandonner après un seul essai
  (bug réel trouvé et corrigé le 2026-08-23, voir `.claude/HANDOFF/LOG.md` pour le détail —
  `pointerdown` déclenchait le déverrouillage AVANT `touchend` sur mobile alors qu'il est moins
  fiable que ce dernier pour débloquer un `AudioContext`).

## Panneaux de détail (sheets)

`CityPanel`, `CreateSheet`, `PinDetail`, `BountyDetail` partagent tous un unique wrapper,
`DetailSheet.tsx` — **toute la mécanique de présentation vit à un seul endroit**, jamais
dupliquée par sheet : scrim cliquable, taille de cible tactile du bouton de fermeture,
intégration au bouton retour du navigateur (une sheet ouverte pousse une entrée d'historique et
se ferme sur `popstate`, comme n'importe quel overlay natif), et ducking audio (`useAudio().duck`/
`unduck` appelés au montage/démontage). Un consommateur qui a une saisie non enregistrée à
protéger (seul `CreateSheet` aujourd'hui) passe un `confirmClose` optionnel — les sheets en
lecture seule n'ont rien à y perdre et ne le passent pas. Ajouter une nouvelle sheet ne demande
jamais de ré-implémenter cette mécanique, seulement de l'envelopper dans `<DetailSheet>`.

Messages d'erreur (`ErrorMessage.tsx`) et indicateur "busy" (`Spinner.tsx`) sont également des
composants partagés uniques, pas dupliqués par écran — `role="alert"` et l'icône (pas seulement
la couleur) n'existent qu'à un endroit à maintenir.

## Différé (hors noyau MVP, ne pas construire avant qu'on y revienne explicitement)

Ghost Mode (anonymat réversible + purgatoire Redis), modération anti-brigading complète (seuil
>6 signalements/6 villes), RBAC à 9 rôles nationaux asymétriques, Reality-Vlogs (upload vidéo
R2), sponsoring (Pins dorés). Chacun aura ses propres décisions de conception à acter avant
implémentation (ex : qui peut voir la correspondance auteur réel ↔ post anonyme avant claim).

## Critères de qualité par incrément ("super-métriques")

Décision utilisateur du 2026-08-22 : ces critères remplacent "ça devrait marcher" — un
incrément n'est loggué "fait" dans `LOG.md` que s'il les satisfait tous. Concrets et
vérifiables, pas des impressions :

**Backend (`apps/api`)**
- `npm run build` et `npm run lint` passent à zéro erreur.
- `npm run test` passe, avec de vraies assertions sur la logique critique — pas des tests qui
  vérifient juste que ça compile/répond 200.
- **Tests négatifs obligatoires sur les zones à risque**, pas seulement le chemin nominal : un
  rôle local qui échoue à agir hors de sa ville, une action destructrice nationale unilatérale
  qui échoue, une Bounty expirée qui échoue à être réclamée.
- La fonctionnalité vérifiée manuellement en conditions réelles (requête HTTP réelle contre le
  serveur qui tourne), jamais supposée à partir de la lecture du code.
- L'agent concerné (`security-review`, `architecture-review`, `critical-logic-tests`) invoqué
  quand le changement touche son domaine — voir `.claude/agents/`.

**Frontend (`apps/web`)**
- `npm run build` et `npm run lint` passent à zéro erreur.
- Fonctionnalité exercée dans un vrai navigateur (serveur de dev), chemin nominal + au moins un
  cas limite — jamais "ça devrait marcher" sans l'avoir vu tourner.

**Base de données**
- Toute migration s'applique proprement sur une base neuve ET sur l'état actuel.
- Toute requête spatiale (PostGIS) vérifiée sur des données de test réalistes — pas seulement
  "pas d'erreur SQL", le résultat géographique doit être correct (bon regroupement, bonne ville).

**Discipline générale**
- Zéro `TODO`/stub laissé à la place d'une fonctionnalité annoncée "faite" dans `LOG.md`.
- Un incrément qui ne satisfait pas ces critères n'est ni loggué "fait", ni commité comme tel —
  il reste marqué en cours (`.claude/HANDOFF/.in_progress`) jusqu'à correction.

## Scale-to-zero

Toute dépendance ajoutée doit rester compatible avec l'hypothèse "coût zéro au repos" (pas de
job cron permanent, pas de connexion DB persistante incompatible serverless) — vérifié par
`.claude/agents/architecture-review.md`.
