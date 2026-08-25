# NEXT_SESSION

Dernière mise à jour : 2026-08-25.

## Chantier en cours — voir `docs/PLAN_EXTENSION.md`

Retour utilisateur du 2026-08-24 sur le rendu réel de l'app ("très mauvais" — boutons sans label
visible, accueil pas engageant) a déclenché un élargissement de périmètre majeur : 4 fonctionnalités
sorties de "roadmap/pitch uniquement" pour être construites avec vraie logique serveur (Ghost Mode,
Reality-Vlogs, Modération anti-brigading, Sponsoring), + refonte visuelle (direction plus
gamifiée/colorée), + premier déploiement en ligne. Plan complet, séquencé en 7 incréments avec
schéma/fichiers/tests exacts, dans **`docs/PLAN_EXTENSION.md`** — lire ce document en premier,
avant de continuer quoi que ce soit sur ce chantier. Son tableau "État d'avancement" en haut dit
où on en est réellement, à tenir à jour à chaque incrément terminé (ne pas laisser dériver, comme
ça a déjà été trouvé plusieurs fois sur ce projet).

2 agents projet supplémentaires à créer avant l'incrément 0 (demande explicite utilisateur du
2026-08-24, détail complet dans `docs/PLAN_EXTENSION.md` § Phase 0) : `token-steward` (suivi de
consommation tokens des agents) et `quality-gate` (score composite qualité à seuils stricts,
relance jusqu'à 2× si échec).

Les 3 décisions bloquantes sont résolues (2026-08-25) : Ghost Mode version simple (pas de
purgatoire d'upvotes, pas de Redis) ; `synchronize:false` partout y compris en dev ; déploiement
100% palier gratuit (Vercel + Render + Supabase, ni VPS ni domaine payant).

**Incrément 0 terminé et audité (2026-08-25)** : RBAC centralisé (`RolesService.
isLocalModeratorForCity`, distinct de `requireCityScope` — voir `LOG.md` pour pourquoi c'est
important, ne pas confondre les deux), migrations TypeORM réelles (baseline + `AddSpatialIndexes`,
testées run/revert/run sur bases vierges isolées, dev backfillée sans perte). Audité réellement par
`architecture-review`, 2 problèmes trouvés et corrigés avant commit. Détail complet dans
`docs/PLAN_EXTENSION.md` et `.claude/HANDOFF/LOG.md`.

**Prochaine étape : Incrément 1** (`docs/PLAN_EXTENSION.md`) — 1a déploiement (créer comptes
Vercel/Render/Supabase, gratuits, 2 min chacun) en parallèle de 1b (invoquer `product-designer` en
plusieurs instances pour la refonte visuelle).

## État antérieur (noyau MVP — toujours vrai, base du chantier ci-dessus)

**Le noyau MVP (backend + frontend) est écrit, buildé, lint-propre, et a déjà survécu à
plusieurs cycles réels de test PC/téléphone.** Lire `.claude/HANDOFF/LOG.md` pour le détail
entrée par entrée, et **`.claude/HANDOFF/WORKFLOW_STATUS.md` pour l'état vérifié vs restant à
confirmer, workflow par workflow** — c'est la référence à jour, plus fiable qu'un résumé narratif
qui dérive avec le temps (ce fichier lui-même a été corrigé le 2026-08-23 après avoir affirmé à
tort des choses déjà obsolètes — MapLibre, audio "inerte" — voir plus bas).

Technos actuelles (**pas** ce qui a été décidé au cadrage initial, voir plus bas) :
- Carte : **SVG inline stylisé** (contour Maroc + 12 villes), **pas** MapLibre — remplacé le
  2026-08-23, MapLibre ne s'affichait pas de façon fiable sur mobile. Voir
  `docs/ARCHITECTURE.md` § Visualisation carte.
- Audio : moteur Web Audio API maison (`LoopEngine`), piste MP3 unique "Battle March"
  (PlayOnLoop, CC-BY 3.0), ducking + ombre de déverrouillage mobile. Voir `docs/ARCHITECTURE.md`
  § Ambiance sonore.
- UI : passe complète de recherche NN/g appliquée le 2026-08-23 (formulaires, sheets, carte,
  feedback système) — voir la grosse entrée correspondante dans `LOG.md`.

**Point actif en attente de confirmation utilisateur** : le son ne démarrait toujours pas sur
téléphone après un premier correctif (passage en MP3) ; cause racine re-diagnostiquée
(`pointerdown` volait le geste à `touchend`, moins fiable pour débloquer un `AudioContext` sur
mobile) et corrigée le 2026-08-23, **mais jamais confirmée sur un téléphone réel** — aucun outil
navigateur/audio disponible dans cette session pour le vérifier soi-même. Si l'utilisateur
rapporte que ça ne marche toujours pas : l'hypothèse suivante est l'interrupteur silencieux
matériel iOS (indétectable en JS, non contournable autrement que par un contrôle manuel visible
— déjà en place via `MuteToggle`).

Pour exposer l'app sur le réseau local (PC + téléphone sur le même Wi-Fi) :
`apps/web/.env.local` a `NEXT_PUBLIC_API_URL` pointé sur l'IP LAN de la machine (pas
`localhost`), `apps/api/.env` a `WEB_ORIGIN` en liste séparée par des virgules
(`http://localhost:3000,http://<IP_LAN>:3000`), et `apps/web` doit être lancé avec
`npx next dev -H 0.0.0.0` (pas juste `npm run dev`) pour écouter sur toutes les interfaces.
L'IP LAN change si la machine change de réseau — la retrouver avec
`Get-NetIPAddress -AddressFamily IPv4` (interface Wi-Fi, pas les adaptateurs virtuels
VirtualBox/WSL/Hyper-V) et mettre à jour les deux fichiers `.env*` en conséquence.

## À faire en priorité

1. **Confirmation utilisateur** : le son sur téléphone (voir ci-dessus) et, plus largement,
   toute la passe UX NN/g du 2026-08-23 (jamais vue à l'œil — build/lint/curl seulement). Voir
   `WORKFLOW_STATUS.md` pour la liste précise des lignes ⛔/⚠️ à faire confirmer.
2. **Avant tout nouvel incrément** : invoquer la méthode de `.claude/agents/workflow-audit.md`
   (manuellement si l'agent custom n'est toujours pas reconnu, voir piège plus bas) — identifier
   les workflows touchés, ré-exécuter leur commande de référence, mettre à jour
   `WORKFLOW_STATUS.md` dans le même commit que le code. Créé le 2026-08-23 suite à
   l'accumulation de régressions non détectées par lint/build seul (audio cassé 3 fois de suite,
   hydratation React, validation de query param, technologie de carte entière remplacée).

## Décisions actées (ne pas re-demander)

- Palier **Système**. Stack : Next.js + NestJS + PostgreSQL/PostGIS. Carte et audio : voir
  "État actuel" ci-dessus (ont changé depuis le cadrage initial). Auth : email+mot de passe
  (hashé, rate-limité) + Google OAuth (câblé, pas de vraies clés — non bloquant). Tout en local
  pour l'instant (pas de comptes cloud, pas de remote git). Périmètre du premier incrément :
  noyau ultra-serré (Social-Map + Bounties + auth + RBAC à 2 niveaux) — détail dans
  `docs/VISION.md`.
- RBAC spatial : scope basé sur la cible de la ressource (pas le GPS live de l'acteur). Pouvoir
  national volontairement limité (pas d'action destructrice unilatérale) — implémenté
  concrètement dans `roles.service.ts` ET `pins.service.ts`/`bounties.service.ts`, pas juste
  documenté. Détail dans `docs/ARCHITECTURE.md`.
- Ambiance sonore actée comme faisant partie du noyau MVP (pas roadmap), activée et fonctionnelle
  (desktop confirmé, mobile en attente de reconfirmation — voir plus haut).

## Prochaine étape (une fois la confirmation utilisateur obtenue)

1. Si des bugs visuels/UX apparaissent au test réel : corriger, avec la même discipline
   (workflow-audit → vérifié → commit → `LOG.md` + `WORKFLOW_STATUS.md`).
2. Régénérer `pitch/MindClash228-Pitch.pptx` avec (1) une vraie capture d'écran à la place du
   placeholder Démo, (2) l'"ask" de la slide de closing précisé avec l'utilisateur, (3) un
   aperçu visuel réel du fichier (aucun outil PowerPoint/LibreOffice disponible ici — jamais
   inspecté à l'œil non plus, voir `pitch/README.md`).
3. Fonctionnalités hors noyau (Ghost Mode, Reality-Vlogs, modération anti-brigading complète,
   sponsoring, pont WhatsApp) — seulement si l'utilisateur élargit le périmètre.

Pour lancer l'environnement de dev : `docker compose -f infra/docker-compose.yml up -d`, puis
`cd apps/api && npm run start:dev` (port 3001), puis `cd apps/web && npx next dev -H 0.0.0.0`
(port 3000 — `-H 0.0.0.0` pour rester accessible depuis le téléphone, voir ci-dessus ; `.env.local`
déjà configuré). **RAM machine de dev serrée** (1,4-2,9 Go libres sur 15,7 Go selon l'état, voir
piège ci-dessous) : ne pas laisser les 3 tourner en continu sans raison, arrêter `apps/web` après
une session de test plutôt que de le laisser ouvert.

## Piège constaté : processus Node orphelins qui s'accumulent

Trouvé le 2026-08-23 : 9 processus Node tournaient en même temps (3 instances complètes du
serveur API en concurrence), faisant chuter la RAM libre à ~1,4 Go. Cause probable : un
redémarrage qui tue seulement le process tenant le port (trouvé via `netstat`) sans tuer toute
sa chaîne parent (`npm` → `nest --watch` → `dist/main`), laissant des orphelins tourner. Avant
de relancer un serveur qui semble bloqué : `Get-CimInstance Win32_Process -Filter
"Name='node.exe'"` pour voir TOUTE la liste avec leurs `CommandLine`, identifier les chaînes
dupliquées, tuer tous les PID concernés (pas juste celui du `netstat`), puis relancer un seul
process propre.

## Piège constaté : ne jamais lancer `npm run build` pendant que `start:dev` tourne

Arrivé deux fois le 2026-08-22 côté `apps/api` : un `nest build` standalone pendant que
`start:dev --watch` tourne fait collision sur `dist/` (`MODULE_NOT_FOUND: dist/main`) ou, sur un
hot-reload rapide, deux instances entrent en concurrence sur le port (`EADDRINUSE`) et une reste
"stale" en arrière-plan pendant que le watcher a crashé silencieusement. Pas un bug produit —
juste ne plus faire les deux en parallèle. Le watcher donne déjà le statut de compilation dans
son log (chercher "Found 0 errors") ; `lint`/`test` restent sûrs à lancer à côté (ils ne touchent
pas `dist/`). Côté `apps/web`, `npm run lint` et `npx tsc --noEmit` sont de même sûrs à lancer
pendant que `next dev` tourne — évite `npm run build` en parallèle pour la même raison. Si le
serveur ne répond plus après une série d'éditions rapprochées : vérifier
`netstat -ano | grep :3001` (ou `:3000` côté web), tuer tout PID trouvé, relancer proprement.

## Problème connu à vérifier

Les agents custom dans `.claude/agents/` (`security-review`, `architecture-review`,
`critical-logic-tests`, et le nouveau `workflow-audit` créé le 2026-08-23) ne sont **pas
reconnus** par l'outil Agent dans cette session (`Agent type 'critical-logic-tests' not found.
Available agents: claude, claude-code-guide, Explore, general-purpose, Plan, statusline-setup` —
constaté le 2026-08-22, toujours vrai le 2026-08-23). Contournement utilisé à chaque fois : soit
suivre la méthode décrite dans le fichier `.claude/agents/*.md` directement, soit un agent
`general-purpose` avec son contenu collé dans le prompt. À vérifier en session future : version
de Claude Code, format attendu, ou besoin d'un redémarrage de session pour que les agents créés
en cours de route soient détectés.

## Décisions en attente (à trancher avec l'utilisateur le moment venu, pas avant)

- Date précise de l'échéance CréaAfrica (on sait "< 1 mois", pas de date exacte — pas bloquant
  pour l'instant).
- Nom de domaine, si besoin avant le déploiement.
- Ghost Mode : qui peut voir la correspondance auteur réel ↔ post anonyme avant claim (hors
  périmètre MVP — à trancher seulement quand on construit cette fonctionnalité).
- Anti-brigading : comment la "ville" d'un compte est déterminée de façon non falsifiable (hors
  périmètre MVP — idem).
- Repo distant GitHub : à créer si/quand un besoin de collaboration ou de CI apparaît.
- Pont WhatsApp de viralité (voir `docs/VISION.md`) : dépend de Reality-Vlogs, hors MVP.
- L'"ask" de la slide de closing du pitch deck (modalités du concours CréaAfrica inconnues).
- Vraie métrique de "présence par ville" sur la carte (actuellement des chiffres déterministes
  mais arbitraires, pas branchés sur une donnée réelle).
