# NEXT_SESSION

Dernière mise à jour : 2026-08-22.

## État actuel

**Backend du noyau MVP complet et vérifié de bout en bout.** Frontend Next.js pas encore
commencé (scaffold seul, page par défaut).

Fait dans cette session (voir `.claude/HANDOFF/LOG.md` pour le détail complet, entrée par
entrée) :

- Cadrage : analyse du canevas stratégique (`docs/LEAN_CANVAS.md`), docs (`VISION.md`,
  `STACK.md`, `ARCHITECTURE.md`), 3 agents dans `.claude/agents/`, identité visuelle publiée
  (logo, palette, typo, mockup) : https://claude.ai/code/artifact/8b4c18c8-4a9b-4aa5-83a0-9d4059931a55
- Backend `apps/api` (NestJS) : `database`/`health` (TypeORM + PostGIS réel), `cities` (12
  villes marocaines seedées avec coordonnées), `users`, `roles` (RBAC nationale/local), `auth`
  (email+mdp + Google OAuth câblé, JWT, rate-limiting), `pins` (Social-Map, ville déduite par
  plus-proche-voisin PostGIS, clustering réel `ST_ClusterDBSCAN`), `bounties` (cycle de vie
  complet, réclamation atomique, expiration serveur matérialisée à la lecture).
- Premier jet du pitch deck : `pitch/MindClash228-Pitch.pptx` (régénérable via
  `node pitch/generate-deck.mjs`, voir `pitch/README.md`).

## Décisions actées (ne pas re-demander)

- Palier **Système**. Stack : Next.js + NestJS + PostgreSQL/PostGIS + MapLibre GL JS. Auth :
  email+mot de passe (hashé, rate-limité) + Google OAuth. Tout en local pour l'instant (pas de
  comptes cloud, pas de remote git). Périmètre du premier incrément : noyau ultra-serré
  (Social-Map + Bounties + auth + RBAC à 2 niveaux) — détail dans `docs/VISION.md`.
- RBAC spatial : scope basé sur la cible de la ressource (pas le GPS live de l'acteur). Pouvoir
  national volontairement limité (pas d'action destructrice unilatérale) — implémenté
  concrètement dans `roles.service.ts` ET `pins.service.ts`/`bounties.service.ts`, pas juste
  documenté. Détail dans `docs/ARCHITECTURE.md`.
- Ambiance sonore contextuelle actée comme faisant partie du noyau MVP (pas roadmap) — voir
  `docs/ARCHITECTURE.md` § Ambiance sonore. Bloqué sur de vrais fichiers audio à choisir avec
  l'utilisateur.

## Prochaine étape : frontend Next.js

Construire `apps/web` contre le backend déjà complet et vérifié : auth (pages login/signup,
callback Google), Social-Map (MapLibre GL JS, pins + clusters, style sombre/tactique de
l'identité visuelle), création/réclamation/résolution de Bounties, `AudioProvider` (voir
`docs/ARCHITECTURE.md`). Même discipline : incrément → vérifié réellement dans un vrai
navigateur (pas seulement `npm run build`) → commit → `LOG.md`.

**Avant d'écrire du code Next.js** : ce projet est en Next.js 16, qui a des breaking changes
vs. les conventions "classiques" — lire `apps/web/node_modules/next/dist/docs/` avant d'écrire
des pages/layouts/data-fetching (rappel auto-généré dans `apps/web/AGENTS.md`, ne pas supprimer
ce fichier ni `apps/web/CLAUDE.md`, ils sont régénérés par `next dev` de toute façon).

Pour lancer l'environnement de dev : `docker compose -f infra/docker-compose.yml up -d`, puis
`cd apps/api && npm run start:dev` (port 3001, `.env` déjà configuré en local). Éviter de
lancer `apps/web` en continu EN PLUS tant que la RAM de la machine de dev est serrée (voir
`LOG.md`) — tester ponctuellement, pas laisser tourner indéfiniment à côté de Docker+NestJS.

Une fois le frontend démontrable : régénérer `pitch/MindClash228-Pitch.pptx` avec (1) une vraie
capture d'écran à la place du placeholder Démo, (2) l'"ask" de la slide de closing précisé avec
l'utilisateur, (3) un aperçu visuel réel du fichier (aucun outil PowerPoint/LibreOffice
disponible ici pour vérifier le rendu — jamais inspecté à l'œil, voir `pitch/README.md`).

## Piège constaté : ne jamais lancer `npm run build` pendant que `start:dev` tourne

Arrivé deux fois le 2026-08-22 : un `nest build` standalone pendant que `start:dev --watch`
tourne fait collision sur `dist/` (`MODULE_NOT_FOUND: dist/main`) ou, sur un hot-reload rapide,
deux instances entrent en concurrence sur le port (`EADDRINUSE`) et une reste "stale" en
arrière-plan pendant que le watcher a crashé silencieusement. Pas un bug produit — juste ne plus
faire les deux en parallèle. Le watcher donne déjà le statut de compilation dans son log
(chercher "Found 0 errors") ; `lint`/`test` restent sûrs à lancer à côté (ils ne touchent pas
`dist/`). Si le serveur ne répond plus après une série d'éditions rapprochées : vérifier
`netstat -ano | grep :3001`, tuer tout PID trouvé, relancer un seul `start:dev` proprement.

## Problème connu à vérifier

Les 3 agents custom dans `.claude/agents/` (`security-review`, `architecture-review`,
`critical-logic-tests`) ne sont **pas reconnus** par l'outil Agent dans cette session
(`Agent type 'critical-logic-tests' not found. Available agents: claude, claude-code-guide,
Explore, general-purpose, Plan, statusline-setup` — constaté le 2026-08-22). Contournement
utilisé à chaque fois : agent `general-purpose` avec le contenu du fichier `.claude/agents/*.md`
collé dans le prompt (a bien fonctionné pour les tests RBAC et Bounties). À vérifier en session
future : version de Claude Code, format attendu, ou besoin d'un redémarrage de session pour que
les agents créés en cours de route soient détectés.

## Décisions en attente (à trancher avec l'utilisateur le moment venu, pas avant)

- Date précise de l'échéance CréaAfrica (on sait "< 1 mois", pas de date exacte — pas bloquant
  pour l'instant).
- Nom de domaine, si besoin avant le déploiement.
- Ghost Mode : qui peut voir la correspondance auteur réel ↔ post anonyme avant claim (hors
  périmètre MVP — à trancher seulement quand on construit cette fonctionnalité).
- Anti-brigading : comment la "ville" d'un compte est déterminée de façon non falsifiable (hors
  périmètre MVP — idem).
- Repo distant GitHub : à créer si/quand un besoin de collaboration ou de CI apparaît.
- Fichiers audio réels pour l'ambiance sonore (voir `docs/ARCHITECTURE.md`).
- Pont WhatsApp de viralité (voir `docs/VISION.md`) : dépend de Reality-Vlogs, hors MVP.
