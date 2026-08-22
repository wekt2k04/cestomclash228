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
