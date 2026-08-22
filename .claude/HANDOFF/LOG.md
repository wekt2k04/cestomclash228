# LOG

Append-only. Une entrée par incrément vérifié et commité — jamais réécrit.

## 2026-08-22 — Cadrage initial

- Lu et analysé en profondeur `Lean Canvas Stratégique - MindClash 228.md` (fourni par
  l'utilisateur), y compris décodage des deux valeurs encodées en image (seuil anti-brigading
  > 6 signalements/6 villes, cible DAU/MAU > 30 %).
- Palier retenu : Système. Décisions de stack/scope/auth/infra actées via questions fermées à
  l'utilisateur (voir `docs/STACK.md`, `docs/VISION.md`).
- Créé 3 agents (`security-review`, `architecture-review`, `critical-logic-tests`) pour les
  risques réels identifiés (données sensibles/auth, plusieurs couches, logique métier
  critique).
- Créé l'identité visuelle (logo, palette, typographie, mockup Social-Map) à partir du logo
  CESTOM fourni par l'utilisateur — publiée en Artifact, relecture en tâche de fond sans
  problème trouvé.
- Créé les docs de cadrage (`docs/VISION.md`, `docs/STACK.md`, `docs/ARCHITECTURE.md`,
  `docs/LEAN_CANVAS.md`) et ce handoff.
- Vérifié : tous les fichiers relus après écriture, structure de dossiers confirmée par
  `ls`/`git status`. Aucun code applicatif encore écrit à ce stade — rien à tester
  fonctionnellement.

## 2026-08-22 — Révision du logo (retour utilisateur sur le premier jet)

- Retour : le mark v1 (facettes plates façon diamant) était propre mais pas assez
  "impressionnant" — demande explicite d'un motif plus travaillé (dégradé de couleurs, motif
  parlant) en restant simple.
- Nouveau mark : pin de carte à dégradé (rouge→or→vert, couleurs du drapeau togolais) avec une
  flèche "level-up" cachée en négatif dans la tête du pin (masque SVG) — lie littéralement les
  deux piliers du produit (carte + gamification) en une seule forme, au lieu d'une simple
  recoloration de l'étoile CESTOM.
- Republié sur le même artifact (même URL) après re-vérification (`--check` OK).

## 2026-08-22 — Scaffold monorepo + plomberie DB vérifiée

- `apps/web` (Next.js 16, TS, Tailwind) et `apps/api` (NestJS, TS strict) scaffoldés en projets
  séparés (pas de workspace npm). `infra/docker-compose.yml` : Postgres+PostGIS local.
- Bloqueur résolu : Node système en v18.20.0, Next.js 16 exige ≥20.9 — basculé via `nvm` sur une
  version plus récente déjà installée localement (voir `docs/STACK.md`).
- API : modules `database` (TypeORM) et `health` (Terminus), `ConfigModule` avec validation Joi
  stricte, helmet + CORS + ValidationPipe globale, ThrottlerModule prêt pour l'auth à venir.
- **Vérifié réellement** (pas supposé) : `npm run build`/`lint` OK sur les deux apps ; conteneur
  Postgres `healthy` ; serveur Nest démarré, `GET /health` confirme une connexion DB réelle
  (`{"status":"ok","info":{"database":{"status":"up"}}}`).
- Contrainte ressources notée (RAM libre faible sur la machine de dev, 1,2 Go/15,7 Go au moment
  du check) : éviter de faire tourner plusieurs serveurs de dev en parallèle en continu.

## 2026-08-22 — Auth + RBAC 2 niveaux

- Modules `cities` (12 villes universitaires marocaines seedées), `users`, `roles` (RBAC
  national/local), `auth` (signup/login email+mdp via bcrypt, Google OAuth câblé mais sans
  vraies clés pour l'instant, JWT, throttling renforcé sur signup/login).
- Décisions de `docs/ARCHITECTURE.md` implémentées concrètement : scope RBAC basé sur la ville
  cible (jamais le GPS live de l'acteur), et `RolesService` n'expose aucune méthode de type
  "action destructrice unilatérale par un rôle national" — bootstrap du premier admin national
  via `BOOTSTRAP_ADMIN_EMAIL`, toute assignation de rôle ultérieure passe par un rôle national
  déjà existant.
- **Vérifié réellement** contre un vrai serveur + vraie base : bootstrap admin, un membre
  ordinaire qui tente `/roles/assign` reçoit 403, l'admin national assigne un rôle local (Rabat)
  avec succès, mauvais mot de passe → 401, email dupliqué → 409, mot de passe trop court rejeté
  par le DTO (400), route protégée sans token → 401. `passwordHash` jamais exposé dans une
  réponse (vérifié sur les 3 réponses signup/me).
- Tests automatisés ajoutés : `apps/api/src/roles/roles.service.spec.ts` (9 tests, dont 2 cas
  négatifs et 1 cas limite de réassignation) — écrit par un agent appliquant le mandat
  `critical-logic-tests`, relu et ré-exécuté indépendamment (10/10 tests passent avec le reste
  de la suite). Aucun bug trouvé dans le service.
- Lint : 14 erreurs et 2 warnings trouvés et corrigés (types `any` non sûrs sur le profil Google
  et le user de la requête JWT, promesse flottante dans `main.ts`, var inutilisée dans
  `auth.service.ts` remplacée par un mapper `toPublicUser` à allowlist explicite plutôt qu'un
  destructure-and-discard). `npm run lint` et `npm run build` passent à zéro erreur après
  correction.

## 2026-08-22 — Premier jet du pitch deck (.pptx)

- `pitch/generate-deck.mjs` (pptxgenjs) génère `pitch/MindClash228-Pitch.pptx` — 11 slides
  (couverture, problème, segments, solution, démo, avantage déloyal, business model, traction,
  stack/coûts, roadmap, closing) à partir de `docs/LEAN_CANVAS.md`/`docs/VISION.md`. Script
  ré-exécutable, pas un one-shot — pensé pour être régénéré quand une vraie capture d'écran du
  MVP existera (slide Démo actuellement un placeholder honnête, pas une fausse capture).
  Polices Windows (Bahnschrift/Segoe UI) plutôt que les Google Fonts de l'identité web, pour
  éviter une substitution silencieuse chez un jury sans ces polices installées.
- **Vérifié réellement** : zip valide (`unzip -t`), 11 slides confirmées, images (logo CESTOM)
  intégrées. **Non vérifié** : rendu visuel réel — aucun outil PowerPoint/LibreOffice disponible
  dans cet environnement pour capturer un aperçu. À ouvrir par l'utilisateur pour repérer un
  éventuel chevauchement avant usage.
- `npm audit` sur `pitch/` signale 2 vulnérabilités high dans `image-size` (dépendance
  transitive de pptxgenjs, DoS sur parsing ICNS/JXL/HEIF) — sans impact réel ici : script
  dev-only, jamais déployé, ne traite que des PNG qu'on contrôle nous-mêmes.

## 2026-08-22 — Backend Social-Map (module `pins`, PostGIS)

- `City` enrichi d'un `centerPoint` (geography Point) ; les 12 villes seedées ont maintenant de
  vraies coordonnées. `Pin` (geography Point + type/titre/description/auteur/ville) — la ville
  est **déduite automatiquement** de la position (plus proche voisin PostGIS, opérateur `<->`),
  jamais fournie par le client.
- Endpoints : `POST /pins`, `GET /pins` (filtre bbox optionnel), `GET /pins/clusters`
  (regroupement réel via `ST_ClusterDBSCAN`, précision en mètres configurable), `GET /pins/:id`,
  `DELETE /pins/:id`.
- **Application concrète du "pouvoir national limité"** (principe de `docs/ARCHITECTURE.md`) :
  suppression d'un Pin réservée à son auteur ou à un rôle local dans SA ville — un rôle national
  n'a **aucun** moyen de supprimer unilatéralement un Pin qu'il n'a pas créé. Vérifié à la fois
  par des tests unitaires (`pins.service.spec.ts`, 6 tests) et en conditions réelles (voir
  ci-dessous) : c'est le test qui compte le plus de cet incrément.
- **Vérifié réellement** contre un vrai serveur + vraie base : création de Pin près de Rabat →
  ville déduite "Rabat" correcte ; idem Marrakech ; clustering de 3 pins proches → 1 cluster de
  count 3 + le pin distant reste seul ; filtre bbox exclut bien Marrakech quand on cible Rabat ;
  admin national qui tente de supprimer un Pin de Rabat qu'il n'a pas créé → 403 ; rôle local
  Rabat qui tente de supprimer un Pin de Marrakech → 403 ; l'auteur supprime son propre Pin →
  200, puis 404 à la relecture.
- Accroc de session (pas un bug produit) : le throttling login (5/60s, voir increment précédent)
  s'est déclenché pendant mes propres tests répétés — 429 attendu et correct, juste reporté le
  test de quelques secondes.
- `npm run build` / `lint` / `test` (16/16) verts sur `apps/api`.

## 2026-08-22 — Backend Bounties (cycle de vie complet)

- `Bounty` (geography Point, ville déduite comme pour `Pin`) : créer / réclamer / résoudre,
  avec expiration **serveur** (2h/12h/24h, horodatage en base, jamais un simple countdown
  client). Pas de scheduler/cron (incompatible scale-to-zero) : expiration "matérialisée" en
  base à la lecture (`materializeExpiry()` avant chaque requête).
- Réclamation implémentée comme une **unique requête UPDATE conditionnelle atomique**
  (`WHERE status='open' AND "expiresAt">now() AND "authorId"!=$1`) plutôt qu'un lire-puis-écrire,
  spécifiquement pour éviter la course entre deux utilisateurs qui réclament en même temps (cas
  limite du mandat `critical-logic-tests`).
- Résolution : l'auteur OU la personne qui a réclamé peuvent clôturer (décision délibérée, pas
  un oubli) — seulement si le statut est `claimed`.

**Bug réel trouvé et corrigé en vérification manuelle** (pas par les tests unitaires — c'est le
point important) : `Repository.query()` de cette version de TypeORM renvoie un **tuple**
`[rows, rowCount]` pour une requête mutante avec `RETURNING`, pas directement le tableau de
lignes comme pour un `SELECT`. Le premier jet faisait `rows.length === 0` sur ce tuple (donc
toujours `2`, jamais `0`) : l'auto-réclamation et la double-réclamation n'étaient **silencieusement
pas bloquées** (200 OK au lieu de 400/409), alors que la mise à jour en base était correctement
empêchée par le `WHERE`. Détecté en testant en vrai contre le serveur (voir ci-dessous), pas
supposé depuis la lecture du code — exactement le genre d'écart qu'un mock naïf en test unitaire
n'aurait pas révélé. Corrigé par destructuration typée `const [rows] = await ...query<[...]>()`.
Les tests unitaires ajoutés après coup (`bounties.service.spec.ts`) reproduisent la vraie forme
du tuple, pas une supposition.

**Vérifié réellement** contre un vrai serveur + vraie base, avant ET après le fix : création avec
ville déduite correcte ; auto-réclamation → 400 ; réclamation par un tiers → 200/claimed ;
double-réclamation → 409 ; résolution par l'auteur → 200/resolved ; résolution d'une Bounty encore
`open` → 409 ; résolution par un tiers non impliqué → 403 ; **expiration réelle** testée en
recalant `expiresAt` dans le passé directement en base (`docker compose exec psql`) — la lecture
matérialise bien `status: expired`, et la réclamation d'une Bounty expirée échoue en 409.

Incident de session (pas un bug produit) : un `npm run build` séparé lancé pendant que
`start:dev --watch` tournait a de nouveau perturbé le process (`EADDRINUSE`, deux instances en
concurrence sur le port 3001 après un hot-reload rapide) — process stale tué proprement, un seul
process relancé. Voir `.claude/HANDOFF/NEXT_SESSION.md`.

`npm run build` / `lint` / `test` (26/26) verts sur `apps/api`. Le noyau MVP backend (auth, RBAC,
Social-Map, Bounties) est maintenant complet et vérifié de bout en bout — reste le frontend
Next.js.
