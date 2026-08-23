# NEXT_SESSION

Dernière mise à jour : 2026-08-23.

## État actuel

**Le noyau MVP (backend + frontend) est écrit, buildé et lint-propre de bout en bout, testé en
conditions réelles sur PC et téléphone (réseau local).** Plusieurs allers-retours avec
l'utilisateur ce 2026-08-23 ont déjà fait bouger des choses réelles (voir `LOG.md` pour le détail
de chaque entrée) :

1. Un vrai bug d'API trouvé et corrigé (`/bounties?status=...` rejeté à tort).
2. L'ambiance sonore entièrement refaite : ne jouait pas du tout sur téléphone (fix : appel
   synchrone dans le geste utilisateur, pas via un effet React), style musical changé pour
   quelque chose de plus épique (référence donnée : "Arise" de Solo Leveling), et un vrai moteur
   de boucle Web Audio API avec fondu enchaîné (pas de coupure audible au bouclage).
3. **La carte interactive (MapLibre) a été entièrement remplacée** par une carte SVG stylisée du
   Maroc avec présence par ville (chiffres aléatoires pour l'instant) — elle ne s'affichait pas
   de façon fiable sur téléphone. Voir `docs/ARCHITECTURE.md` § Visualisation carte pour le
   détail. Le backend Pins/Bounties/PostGIS n'a pas changé.

**Prochaine étape immédiate : confirmation visuelle par l'utilisateur** que la nouvelle carte et
le son fonctionnent maintenant (toujours pas d'outil navigateur dans cette session pour le
vérifier soi-même).

Pour exposer l'app sur le réseau local (PC + téléphone sur le même Wi-Fi) :
`apps/web/.env.local` a `NEXT_PUBLIC_API_URL` pointé sur l'IP LAN de la machine (pas
`localhost`), `apps/api/.env` a `WEB_ORIGIN` en liste séparée par des virgules
(`http://localhost:3000,http://<IP_LAN>:3000`), et `apps/web` doit être lancé avec
`npx next dev -H 0.0.0.0` (pas juste `npm run dev`) pour écouter sur toutes les interfaces.
L'IP LAN change si la machine change de réseau — la retrouver avec
`Get-NetIPAddress -AddressFamily IPv4` (interface Wi-Fi, pas les adaptateurs virtuels
VirtualBox/WSL/Hyper-V) et mettre à jour les deux fichiers `.env*` en conséquence.

Fait dans cette session (voir `.claude/HANDOFF/LOG.md` pour le détail complet, entrée par
entrée) :

- Cadrage : analyse du canevas stratégique (`docs/LEAN_CANVAS.md`), docs (`VISION.md`,
  `STACK.md`, `ARCHITECTURE.md`), 3 agents dans `.claude/agents/`, identité visuelle publiée
  (logo, palette, typo, mockup) : https://claude.ai/code/artifact/8b4c18c8-4a9b-4aa5-83a0-9d4059931a55
- Backend `apps/api` (NestJS) complet : `database`/`health`, `cities` (12 villes marocaines
  seedées avec coordonnées), `users`, `roles` (RBAC national/local), `auth` (email+mdp + Google
  OAuth câblé, JWT, rate-limiting), `pins` (Social-Map, ville déduite par plus-proche-voisin
  PostGIS, clustering réel), `bounties` (cycle de vie complet, réclamation atomique, expiration
  serveur). 26/26 tests passent.
- Frontend `apps/web` complet : pages `/`, `/login`, `/signup`, `/auth/callback`, `SocialMap`
  (MapLibre GL JS + style CARTO dark-matter), création/réclamation/résolution de Bounties et
  Pins, `AuthProvider`/`AudioProvider`.
- Premier jet du pitch deck : `pitch/MindClash228-Pitch.pptx` (régénérable via
  `node pitch/generate-deck.mjs`, voir `pitch/README.md`).
- `docs/RESUME_FONCTIONNEL.md` : résumé en langage métier de ce qui a été construit, destiné à
  l'utilisateur — demandé explicitement, à tenir à jour à chaque évolution notable.

## À faire en priorité : vérification visuelle réelle

Cette session n'avait pas d'outil de navigateur connecté (Claude in Chrome proposé mais
l'utilisateur a choisi de continuer sans lors de l'installation — **ne pas re-proposer**). Tout
le frontend a donc été vérifié par `build`/`lint`/logs serveur, jamais à l'œil. Prochaine
session : si Claude in Chrome est connecté (`/chrome`), lancer `apps/web` et parcourir
réellement : affichage de la carte (le style CARTO charge-t-il bien, les marqueurs sont-ils
positionnés correctement), création d'un Pin et d'une Bounty, réclamation/résolution, signup/
login/logout, callback Google (si des clés réelles sont fournies). Sinon, demander à
l'utilisateur de tester lui-même et rapporter ce qu'il voit.

## Décisions actées (ne pas re-demander)

- Palier **Système**. Stack : Next.js + NestJS + PostgreSQL/PostGIS + MapLibre GL JS. Auth :
  email+mot de passe (hashé, rate-limité) + Google OAuth. Tout en local pour l'instant (pas de
  comptes cloud, pas de remote git). Périmètre du premier incrément : noyau ultra-serré
  (Social-Map + Bounties + auth + RBAC à 2 niveaux) — détail dans `docs/VISION.md`.
- RBAC spatial : scope basé sur la cible de la ressource (pas le GPS live de l'acteur). Pouvoir
  national volontairement limité (pas d'action destructrice unilatérale) — implémenté
  concrètement dans `roles.service.ts` ET `pins.service.ts`/`bounties.service.ts`, pas juste
  documenté. Détail dans `docs/ARCHITECTURE.md`.
- Ambiance sonore contextuelle actée comme faisant partie du noyau MVP (pas roadmap) —
  architecture posée (`AudioProvider`), **inerte** tant qu'il n'y a pas de vrais fichiers audio.

## Prochaine étape (une fois la vérification visuelle faite)

1. Si des bugs visuels/UX apparaissent : corriger, avec la même discipline (vérifié → commit →
   `LOG.md`).
2. Régénérer `pitch/MindClash228-Pitch.pptx` avec (1) une vraie capture d'écran à la place du
   placeholder Démo, (2) l'"ask" de la slide de closing précisé avec l'utilisateur, (3) un
   aperçu visuel réel du fichier (aucun outil PowerPoint/LibreOffice disponible ici — jamais
   inspecté à l'œil non plus, voir `pitch/README.md`).
3. Fichiers audio réels à choisir avec l'utilisateur pour activer `AudioProvider` (voir
   `docs/ARCHITECTURE.md`).
4. Fonctionnalités hors noyau (Ghost Mode, Reality-Vlogs, modération anti-brigading complète,
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
pas `dist/`). Si le serveur ne répond plus après une série d'éditions rapprochées : vérifier
`netstat -ano | grep :3001` (ou `:3000` côté web), tuer tout PID trouvé, relancer proprement.

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
- L'"ask" de la slide de closing du pitch deck (modalités du concours CréaAfrica inconnues).
