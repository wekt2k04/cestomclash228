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

Scaffolder le monorepo (`apps/web` Next.js, `apps/api` NestJS, Docker Compose PostgreSQL+PostGIS
local), puis construire dans l'ordre : auth → Social-Map (pins + clustering) → RBAC 2 niveaux →
Bounties. Chaque brique : incrément → vérifié réellement → audité par l'agent concerné → commit
→ entrée dans `LOG.md`.

Une fois le noyau démontrable de bout en bout : construire le `.pptx` de pitch (demandé par
l'utilisateur, "à la fin") — deck jury (problème → solution → démo → moat → business → ask),
capture d'écran de la vraie démo + éléments de `docs/LEAN_CANVAS.md` + identité visuelle
ci-dessus.

## Décisions en attente (à trancher avec l'utilisateur le moment venu, pas avant)

- Date précise de l'échéance CréaAfrica (on sait "< 1 mois", pas de date exacte — pas bloquant
  pour l'instant).
- Nom de domaine, si besoin avant le déploiement.
- Ghost Mode : qui peut voir la correspondance auteur réel ↔ post anonyme avant claim (hors
  périmètre MVP — à trancher seulement quand on construit cette fonctionnalité).
- Anti-brigading : comment la "ville" d'un compte est déterminée de façon non falsifiable (hors
  périmètre MVP — idem).
- Repo distant GitHub : à créer si/quand un besoin de collaboration ou de CI apparaît.
