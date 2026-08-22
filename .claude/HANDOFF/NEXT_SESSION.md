# NEXT_SESSION

Dernière mise à jour : 2026-08-22.

## État actuel

Cadrage terminé, aucun code applicatif encore écrit. Fait dans cette session :

- Analyse approfondie du canevas stratégique (`docs/LEAN_CANVAS.md`, copié depuis le fichier
  fourni par l'utilisateur).
- Docs de cadrage : `docs/VISION.md`, `docs/STACK.md`, `docs/ARCHITECTURE.md`.
- 3 agents créés dans `.claude/agents/` : `security-review`, `architecture-review`,
  `critical-logic-tests` (risques réels identifiés : données sensibles/auth, plusieurs couches,
  logique métier critique — voir CLAUDE.md §3).
- Identité visuelle publiée (logo, palette, typo, mockup Social-Map) :
  https://claude.ai/code/artifact/8b4c18c8-4a9b-4aa5-83a0-9d4059931a55
- Logo CESTOM déplacé vers `assets/brand/CESTOM.png` (racine propre, CLAUDE.md §6).

## Décisions actées (ne pas re-demander)

- Palier **Système**. Stack : Next.js + NestJS + PostgreSQL/PostGIS + MapLibre GL JS. Auth :
  email+mot de passe (hashé, rate-limité) + Google OAuth. Tout en local pour l'instant (pas de
  comptes cloud, pas de remote git). Périmètre du premier incrément : noyau ultra-serré
  (Social-Map + Bounties + auth + RBAC à 2 niveaux) — détail dans `docs/VISION.md`.
- RBAC spatial : scope basé sur la cible de la ressource (pas le GPS live de l'acteur). Pouvoir
  national volontairement limité (pas d'action destructrice unilatérale). Détail et
  justification dans `docs/ARCHITECTURE.md`.

## Prochaine étape

Fait : monorepo scaffoldé (`apps/web`, `apps/api`), Postgres+PostGIS local (`infra/`), modules
`database`/`health` vérifiés avec une vraie connexion DB. Suite, dans l'ordre : auth (email+mdp
+ Google OAuth) → RBAC 2 niveaux (users/roles) → Social-Map (pins + clustering) → Bounties.
Chaque brique : incrément → vérifié réellement (critères dans `docs/ARCHITECTURE.md` § critères
de qualité) → audité par l'agent concerné → commit → entrée dans `LOG.md`.

Pitch deck : `pitch/MindClash228-Pitch.pptx` (généré par `pitch/generate-deck.mjs`, voir
`pitch/README.md`). À régénérer avec `node generate-deck.mjs` une fois : (1) la slide Démo
remplacée par une vraie capture du frontend, (2) l'"ask" de la slide de closing précisé avec
l'utilisateur, (3) un aperçu visuel réel obtenu (aucun outil de rendu PowerPoint disponible ici
— pas encore vérifié à l'œil).

Pour lancer l'environnement de dev : `docker compose -f infra/docker-compose.yml up -d`, puis
`cd apps/api && npm run start:dev` (port 3001, `.env` déjà configuré en local). `apps/web` pas
encore lancé en continu (contrainte RAM machine de dev, voir LOG.md) — build vérifié seulement
pour l'instant.

**Avant d'écrire du code Next.js** : ce projet est en Next.js 16, qui a des breaking changes
vs. les conventions "classiques" — lire `apps/web/node_modules/next/dist/docs/` avant d'écrire
des pages/layouts/data-fetching (rappel auto-généré dans `apps/web/AGENTS.md`, ne pas supprimer
ce fichier ni `apps/web/CLAUDE.md`, ils sont régénérés par `next dev` de toute façon).

Une fois le noyau démontrable de bout en bout : construire le `.pptx` de pitch (demandé par
l'utilisateur, "à la fin") — deck jury (problème → solution → démo → moat → business → ask),
capture d'écran de la vraie démo + éléments de `docs/LEAN_CANVAS.md` + identité visuelle
ci-dessus.

## Problème connu à vérifier

Les 3 agents custom dans `.claude/agents/` (`security-review`, `architecture-review`,
`critical-logic-tests`) ne sont **pas reconnus** par l'outil Agent dans cette session
(`Agent type 'critical-logic-tests' not found. Available agents: claude, claude-code-guide,
Explore, general-purpose, Plan, statusline-setup` — constaté le 2026-08-22). Contournement
utilisé : agent `general-purpose` avec le contenu du fichier `.claude/agents/*.md` collé dans le
prompt. À vérifier en session future : version de Claude Code, format attendu, ou besoin d'un
redémarrage de session pour que les agents créés en cours de route soient détectés.

## Décisions en attente (à trancher avec l'utilisateur le moment venu, pas avant)

- Date précise de l'échéance CréaAfrica (on sait "< 1 mois", pas de date exacte — pas bloquant
  pour l'instant).
- Nom de domaine, si besoin avant le déploiement.
- Ghost Mode : qui peut voir la correspondance auteur réel ↔ post anonyme avant claim (hors
  périmètre MVP — à trancher seulement quand on construit cette fonctionnalité).
- Anti-brigading : comment la "ville" d'un compte est déterminée de façon non falsifiable (hors
  périmètre MVP — idem).
- Repo distant GitHub : à créer si/quand un besoin de collaboration ou de CI apparaît.
