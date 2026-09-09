# NEXT_SESSION

Dernière mise à jour : 2026-09-09.

## État réel à cette date — LIRE EN PREMIER

**L'app est déployée et publique** : https://cestomclash228.web.app (Firebase Hosting) ↔
https://cestomclash228.onrender.com (NestJS, Render) ↔ Neon (Postgres+PostGIS). Vérifier
d'abord `git log --oneline -15` et `LOG.md` pour l'état exact — ce fichier dérive vite, l'état
réel du code fait foi (CLAUDE.md §5).

Session du soir 2026-09-09 : audit large suite à un retour utilisateur sévère ("expérience
utilisateur 0/20"). Corrigé et déployé, dans l'ordre : bug "déconnexion instantanée" (2 causes
distinctes), cache HTML cassé après déploiement (Firebase servait tout en cache 1h, y compris
le HTML — visiteur qui recharge après un déploiement pouvait recevoir un
`ChunkLoadError`), ping keep-alive Render (`.github/workflows/keep-alive.yml`), polling passif
20s sur les listes (Pins/Bounties/Sponsoring), 5 tests e2e réels sur le module auth (jusque-là
sans AUCUN test), cartes/statuts colorés Pins+Bounties, et un **bug de navigation préexistant
sérieux** (clic sur un Pin/une Bounty depuis la liste pouvait atterrir sur une autre page du
site) — détail complet dans `LOG.md`, section "Ping keep-alive Render + polling passif + statuts
colorés + bug de navigation préexistant corrigé".

**Encore en attente, dans l'ordre de priorité probable** :
1. Test E2E avec 2 vrais comptes utilisateur — explicitement demandé par l'utilisateur, à faire
   "à la toute fin, une fois que tous les patchs auront été faits" (sa propre formulation). Les
   patchs fonctionnels du soir sont faits ; c'est probablement le moment.
2. Nettoyer les artefacts de test dans la vraie base Neon : compte "Debug Test"
   (`debug-e2e-1788940000@mindclash.local`) et la Bounty "Test E2E debug" qu'il a créée — visible
   publiquement sur la carte en ce moment.
3. Animation logo inclinée + effacement/réécriture façon machine à écrire — concept explicitement
   différé par l'utilisateur à après les bugs fonctionnels, jamais construit.
4. Le reste du plan `zesty-knitting-biscuit.md` (marketplace pay-to-claim, chat + filtre anti-
   coordonnées, CitySeat, NeedsTemplates, refonte visuelle "carnet de terrain", 2 documents pitch)
   reste entièrement non construit — le site en ligne est le MVP poli, pas la refonte complète.
5. Vérifier avec l'utilisateur si le PPT jury a bien été confirmé soumis (voir section calendrier
   ci-dessous, point jamais confirmé explicitement dans le chat WhatsApp exporté).

## Calendrier concours confirmé (2026-09-09) — change la priorité immédiate

Export WhatsApp du groupe participants CréaAfrica déposé dans le repo
(`WhatsApp Chat with Participants Édition 1 CREAFRICA📚🔎/`, txt + 2 PDF + photos) et exploré en
détail cette session. Détail complet dans la mémoire `creaafrica-contest-rules` (accessible aux
sessions futures) ; résumé actionnable ici :

- **Phase éliminatoire : samedi 12 et dimanche 13 septembre 2026, 19h30, en ligne** — dans 3-4
  jours à la date de cette note. 5 min de présentation + 5-7 min de Q&A jury. **Un membre de
  l'organisation fait défiler les diapos à la place du candidat** → le PPT jury
  (`pitch/CestomClash228-Pitch.pptx`) doit être strictement linéaire, aucune interaction en direct
  à prévoir. Caméra obligatoire, un seul porte-parole.
- **Non vérifié dans le chat exporté : confirmation explicite de Wilfried que son propre PPT a
  bien été soumis avant le 2026-09-03 23:59.** D'autres candidats ont confirmé conformité
  nom/photo/projet le 2026-09-06 ("c'est bon de mon côté") ; aucun message équivalent de Wilfried
  n'apparaît dans l'export jusqu'au 2026-09-09. **Prochaine session : vérifier ce point avec
  l'utilisateur avant toute autre priorité** — si le PPT jury n'est pas confirmé envoyé, c'est le
  bloquant absolu avant le 12 septembre, devant tout polish mobile ou vidéo.
- **Vote réseaux sociaux (5% de la note) en cours sur Instagram, fin vendredi 11 septembre 12h00**
  — cumul engagement affiche+vidéo. Le rendu vidéo (`pitch/video-render/out/final.mp4`, pipeline
  edge-tts+moviepy construite début septembre) a normalement déjà été soumis avant le
  2026-09-05 23:59 (échéance vidéo séparée) ; à confirmer que ça correspond bien à ce qui est
  publié sur Instagram.
- **Grille de notation officielle /100** (pertinence 20, posture 20, business 20, innovation 20,
  faisabilité 15, vote réseaux 5) — dans la mémoire projet, sert de check-list avant la
  présentation orale du 12/13.
- Finale : dimanche 20 septembre 2026, 19h30, seulement les 5 meilleurs, présentation 3 min.

## Session du 2026-09-05 — première inspection visuelle réelle (Claude in Chrome)

L'utilisateur a connecté Claude in Chrome pour la première fois cette session — première vraie
inspection à l'écran de l'appli après tout un chantier vérifié seulement au niveau code/SSR.
**A immédiatement trouvé une faille critique invisible à toute vérification automatisée** :
`globals.css` avait ses règles `a { color }`/`a:hover { color }` écrites hors de tout `@layer`,
donc dans le bucket "non calqué" de CSS Cascade Layers qui l'emporte TOUJOURS sur
`@layer utilities` de Tailwind — conséquence réelle : le texte de tout `<Link>` stylisé en bouton
(ex. "Rejoindre la communauté") était écrasé en `--terracotta` (même couleur que le fond),
littéralement invisible sans `:hover`. Corrigé (déplacé dans `@layer base`), reconfirmé à l'écran.

Autres corrections du même échange : carte du Maroc entièrement monochrome orange → 3 couleurs de
marque par palier de taille de ville ; lien "Musique" reformulé (ressemblait à un contrôle de
lecture, c'est un crédit légal CC-BY 3.0 obligatoire) ; volume par défaut relevé 0.18→0.32
(hypothèse : le son était probablement imperceptible, pas absent) ; logo en rotation continue sur
l'écran d'accueil (demande utilisateur). Détail complet dans `LOG.md`.

**Non résolu, signalé honnêtement** : le bouton "Explorer la carte" n'a pas répondu de façon
fiable à 5 tentatives de clic automatisé via Claude in Chrome, même après arrêt de toute édition
de fichier en cours. Impossible de déterminer si c'est un artefact de l'automatisation ou un vrai
bug produit — **à confirmer par l'utilisateur avec un clic réel**, priorité pour la prochaine
session si le retour utilisateur confirme un problème.

**Leçon méthodologique à retenir** : cette session confirme, une fois de plus, que
lint/tsc/tests/SSR verts ne garantissent RIEN sur le rendu visuel réel — la faille de contraste
ci-dessus était invisible à tous les outils utilisés jusqu'ici dans ce projet. Dès qu'un outil de
rendu réel est disponible, l'utiliser AVANT d'annoncer un incrément visuel "vérifié".

## Pivot concours (2026-08-31) — lire avant tout le reste

Échéance communiquée : **PPT dû le 2026-09-03 23:59** (détail complet dans `docs/CONCOURS.md`).
**Cette échéance est dépassée** (session du 2026-09-04) — signalé à l'utilisateur, qui a demandé de
continuer quand même vers "ce soir" comme nouvelle cible. Ça a redéfini les priorités — voir
`docs/PLAN_EXTENSION.md` § "Pivot 2026-08-31" pour le détail complet (renommage `CestomClash228`,
modèle économique en 3 phases, Sponsoring v2, Notation). État à cette date :

- **Villes réelles CESTOM** : corrigées partout (6 villes, effectifs réels, source cestom.org) —
  `apps/web/src/lib/morocco-geo.ts`, `apps/api/src/cities/cities.service.ts`,
  `apps/web/src/components/MoroccoMap.tsx`, base de dev nettoyée. Terminé et vérifié.
- **Business Plan détaillé** (`docs/BUSINESS_PLAN.md`, 17 sections) : SAM réel chiffré (650),
  SOM calculé (150-200 Année 1). Reste `[À COMPLÉTER]` : section 15 (ask au concours — l'utilisateur
  a demandé ce que ça signifie, expliqué en conversation, sa réponse n'est pas encore arrivée).
- **PPT** (`pitch/CestomClash228-Pitch.pptx`, 5 slides) : Problème/Solution séparées + Business
  case + vraie Conclusion, habillage visuel (verre dépoli, glow, mini-carte réelle). **Jamais
  inspecté visuellement** (aucun outil PowerPoint ici, ni navigateur — extension Claude in Chrome
  non connectée, vérifié le 2026-09-04) — priorité pour l'utilisateur : ouvrir le fichier.
- **Sponsoring vérifié + Notation : fait le 2026-09-04**, code réel testé bout-en-bout (HTTP réel,
  pas seulement mocks) et audité par `security-review`+`architecture-review` — 2 vrais problèmes
  trouvés et corrigés avant commit (auto-approbation d'une demande par son propre vérificateur ;
  `proofImageUrl` acceptait des hôtes privés/loopback). Voir `LOG.md` pour le détail complet.
- **Refonte visuelle (Incrément 2) : fait le 2026-08-31**, palette afro-futuriste appliquée au vrai
  code (pas juste les maquettes), renommage CestomClash228, bouton "+" corrigé, écran d'accueil
  séparé. Vérifié par SSR/CSS compilé — jamais vu à l'écran (pas d'outil navigateur disponible).
- **Reste à faire** : script vidéo vendeur + vidéo elle-même, décision finale sur le contour de la
  carte produit (réel vs abstrait vs hybride — toujours ouverte), relecture visuelle humaine du PPT
  et de l'appli (aucun outil de rendu disponible ici pour aucun des deux).

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

**1b — historique du 2026-08-25** : 1er lot de 3 instances `product-designer` en parallèle
(angles "arcade rétro", "chaleureux façon Duolingo", "afro-futuriste") a échoué en bloc avec
"session limit" côté plateforme (reset 2:50am Africa/Casablanca). Un canary solo relancé ensuite
("arcade rétro" seul) a réussi — maquette réelle publiée :
https://claude.ai/code/artifact/6685f371-1a01-4bec-807a-cd59f79f2857. Les 2 autres relancées à la
suite ont échoué **à nouveau** (même cause, reset avancé à 7:50am Africa/Casablanca) — la limite a
été retouchée très peu après le succès du canary. Aucune maquette "Duolingo"/"afro-futuriste" ne
s'est jamais matérialisée à cette date.

**Session du 2026-08-30** : relance des 2 briefs manquants (Duolingo, afro-futuriste) en
parallèle — a échoué une 3e fois (reset 6:40pm Africa/Casablanca). Canary solo relancé ensuite
("chaleureux façon Duolingo" seul) : **réussi** — maquette réelle publiée (3 écrans, contraste
WCAG vérifié par calcul, bug bouton-sans-label corrigé) :
https://claude.ai/code/artifact/85a08f7c-5cb2-413e-8abd-d26a2af5413e. Afro-futuriste relancé à la
suite, en attente de retour.

**Incrément 1b terminé (2026-08-30) : les 3 maquettes réelles sont publiées.**
- Arcade rétro : https://claude.ai/code/artifact/6685f371-1a01-4bec-807a-cd59f79f2857
- Chaleureux façon Duolingo : https://claude.ai/code/artifact/85a08f7c-5cb2-413e-8abd-d26a2af5413e
- Afro-futuriste vibrant : https://claude.ai/code/artifact/9d460df4-301b-4484-a162-109eb17d99e6

Chacune couvre les 3 écrans prioritaires (accueil / carte+panneau / créer un Pin-Bounty), corrige
le bug bouton-sans-label, respecte les cibles tactiles ≥44px, et reste ancrée dans le vocabulaire
produit réel (Pins/Bounties/villes/copie du Lean Canvas, rien d'inventé). Décision explicitement
laissée à l'utilisateur (CLAUDE.md §2) : choisir une direction (ou en combiner des éléments) avant
de lancer l'Incrément 2 (code de la refonte visuelle) — ne pas trancher à sa place. Plusieurs
questions ouvertes signalées par les agents (contour Maroc réel vs carte-réseau abstraite pour
l'afro-futuriste, densité des labels de villes pour le Duolingo, accueil = page séparée ou même
scroll que `CityOverview.tsx`) à trancher avec l'utilisateur au moment du choix.

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

## Prochaine étape (section pré-pivot, très en grande partie dépassée — voir § Pivot en tête)

Point 1 ci-dessous reste valable. Les points 2-3 décrivaient l'ancien deck 11 slides et l'ancien
périmètre resserré — remplacés par `pitch/CestomClash228-Pitch.pptx` (5 slides) et le pivot
concours (Sponsoring vérifié + Notation déjà construits, voir § Pivot en tête de ce fichier).

1. Si des bugs visuels/UX apparaissent au test réel : corriger, avec la même discipline
   (workflow-audit → vérifié → commit → `LOG.md` + `WORKFLOW_STATUS.md`).

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
