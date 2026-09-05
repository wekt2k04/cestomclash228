# Plan — 4 fonctionnalités majeures + refonte visuelle + déploiement

*Écrit le 2026-08-24. Vit dans `docs/` (pas dans `.claude/plans/`, propre à une session locale) pour
survivre aux sessions futures — voir `.claude/HANDOFF/NEXT_SESSION.md` pour l'état d'avancement à
jour. Chaque incrément terminé doit mettre à jour la case correspondante ci-dessous, pas juste le
coder — sinon ce document dérive de la réalité comme ça a déjà été trouvé plusieurs fois sur ce
projet (voir `.claude/HANDOFF/LOG.md`).*

## Contexte

Retour utilisateur du 2026-08-24 : le premier vrai regard sur l'app rendue juge le résultat
"très mauvais" (boutons sans label visible, accueil pas engageant) malgré tout le lint/build/curl
au vert — preuve concrète que la vérification automatisée ne dit rien du rendu réel. L'identité de
marque (tokens couleur/police) est bien câblée dans le code ; le vrai problème est dans la
composition/interaction.

Plutôt qu'un patch ponctuel, l'utilisateur a choisi d'élargir significativement le périmètre :
sortir 4 fonctionnalités actuellement "roadmap / pitch uniquement" (Ghost Mode, Reality-Vlogs,
Modération anti-brigading, Sponsoring) pour les construire avec une vraie logique serveur — même
rigueur que Bounties — en parallèle d'une refonte visuelle (direction plus gamifiée/colorée, accueil
qui explique le produit avant la carte) et d'un premier déploiement en ligne. Délai réel : moins de
2 semaines, mais explicitement pas la contrainte prioritaire pour l'utilisateur — ce qui compte est
un projet de grande envergure et de grande qualité. D'où un plan phasé en incréments qui restent
chacun complets/démontrables, jamais un squelette à moitié fait (méthode déjà actée, `CLAUDE.md`).

## État d'avancement (mettre à jour à chaque incrément terminé)

| # | Incrément | Statut |
|---|---|---|
| 0 | Dette technique (RBAC centralisé + migrations réelles) | ✅ fait 2026-08-25, audité par `architecture-review` (2 problèmes trouvés et corrigés avant commit) |
| 1a | Amorce déploiement (Vercel/Render/Supabase gratuits) | ⬜ pas commencé — repoussé après le 3/09 (voir Pivot ci-dessous), pas nécessaire pour les livrables concours |
| 1b | Exploration design (`product-designer`, parallèle) | ✅ 3/3 maquettes publiées 2026-08-30, **direction choisie 2026-08-31 : afro-futuriste vibrant** (https://claude.ai/code/artifact/9d460df4-301b-4484-a162-109eb17d99e6) — questions ouvertes sur le trace carte encore en cours de tranchage, voir Pivot |
| 2 | Refonte visuelle (code) | ✅ fait 2026-08-31 — palette afro-futuriste appliquée (`--cyan`→`--terracotta`, valeurs reprises de la maquette retenue), renommage CestomClash228, bouton "+" corrigé, écran d'accueil séparé (`WelcomeIntro`). Vérifié réellement (lint/tsc + SSR curl + CSS compilé inspecté) |
| 3 | Sponsoring vérifié (preuve de virement + rôle vérificateur) | ✅ fait 2026-09-04 — backend complet (`apps/api/src/sponsorship/`) + frontend réel (`/sponsoring` : soumission, suivi, file de vérification, liste publique). Vérificateur = scope national réutilisé (pas de nouveau rang RBAC). Testé bout-en-bout via HTTP réel, audité par `security-review`+`architecture-review` (1 faille critique corrigée : auto-approbation) |
| 3bis | Notation d'un service rendu | ✅ fait 2026-09-04 — `PATCH /bounties/:id/rate`, auteur seul, après résolution, une seule fois. Testé bout-en-bout via HTTP réel, audité par `security-review`+`architecture-review` |
| 4 | Modération anti-brigading | ⬜ **repoussé après le 3/09** — hors critères de notation de la phase éliminatoire |
| 5 | Ghost Mode | ⬜ **repoussé après le 3/09** — idem |
| 6 | Reality-Vlogs | ⬜ **repoussé après le 3/09** — idem |
| BP | Business Plan détaillé + PPT 5 slides + vidéo 1min | ⚠️ **PPT validé par l'utilisateur le 2026-09-04.** Ask résolu (visibilité du produit, pas de financement direct demandé) — mis à jour dans le PPT et `docs/BUSINESS_PLAN.md` § 15. Script vidéo écrit (`pitch/VIDEO_SCRIPT.md`, format exact demandé) + 4 maquettes HTML pour montage Canva (`pitch/video-assets/`, couleurs reprises du CSS compilé réel, 2 sur 4 marquées explicitement "vision, pas construit"). **Reste : l'utilisateur doit tourner/monter la vidéo lui-même** (aucun outil d'enregistrement/montage disponible ici) ; relecture visuelle humaine de l'appli et des 4 maquettes (jamais vues à l'écran, aucun outil de rendu disponible, vérifié). Échéance annoncée 2026-09-03 23:59 dépassée (constaté le 2026-09-04), utilisateur a demandé de continuer vers une nouvelle cible communiquée le 2026-09-05 |

## Décisions ouvertes (à trancher avant de lancer l'incrément concerné)

1. **Ghost Mode : version simple ou purgatoire d'upvotes ?** Ce plan est écrit pour la version
   simple ("poster anonyme, réclamer/révéler plus tard", pas de Redis nécessaire). La version
   complète du canevas stratégique (`docs/LEAN_CANVAS.md`) prévoit un purgatoire d'upvotes avant
   publication (nécessite Redis + logique de scoring) — périmètre significativement plus grand.
   **Bloque le détail de l'Incrément 5 tant que non tranché.**
2. **`synchronize: false` partout, y compris en dev ?** Recommandé par l'agent Plan (élimine une
   classe de bugs "marche en local, casse en prod") mais ralentit la boucle de dev (il faut lancer
   `migration:run` après chaque changement de schéma). Alternative : garder `synchronize` actif en
   dev, `false` seulement en prod. **Bloque l'Incrément 0.**
3. ~~VPS + nom de domaine~~ **RÉSOLU 2026-08-25** : l'utilisateur ne veut aucun paiement/carte
   bancaire. Remplacé par un hébergement 100% palier gratuit (voir Incrément 1a réécrit) — plus
   simple aussi, ça redevient cohérent avec la cible originale de `docs/STACK.md` (Vercel +
   Render/Supabase) plutôt que l'auto-hébergement VPS. Reste à faire par l'utilisateur : créer 3
   comptes gratuits (Vercel, Render, Supabase — email ou GitHub, aucune carte demandée), 2 min
   chacun, étapes exactes données au moment de l'incrément.
4. Différées sans bloquer le plan : manifest PWA/service worker (absent malgré le nom "PWA" partout
   dans les docs — coût faible à ajouter si voulu, hors périmètre demandé) ; marqueurs individuels
   de Pins sponsorisés directement sur la carte SVG (nécessite une fonction de projection lat/lng
   qui n'existe pas — le Sponsoring de l'Incrément 3 reste "réel et visible en liste", pas sur la
   carte) ; credentials Google OAuth réels (non bloquant, email+mot de passe suffit).

---

## Pivot 2026-08-31 — échéance concours réelle et changement de philosophie

L'utilisateur a communiqué la logistique réelle du concours (détail complet dans
`docs/CONCOURS.md`) : **PPT dû le 2026-09-03 23:59**, phase éliminatoire le week-end suivant (5 min
de pitch + 5-7 min de questions portant sur problématique/solution/**business plan chiffré**/marché
ciblé, explicitement **pas d'angle bénévolat**), 5 projets retenus pour une finale de 3 min. Ça
redéfinit les priorités du reste de ce plan : **le business plan et les livrables concours passent
avant les fonctionnalités produit**, la démo live n'est pas exigée à l'élimination (PPT + vidéo
suffisent d'après l'utilisateur).

### Décisions actées ce jour (ne pas re-demander)

1. **Renommage** : `MindClash 228` → **`CestomClash228`**, partout (code, docs, PPT). Pas encore
   propagé dans le code/les 3 maquettes existantes au moment d'écrire ceci — à faire, pas bloquant
   pour le contenu du PPT/business plan qui peut utiliser le nouveau nom directement.
2. **Direction visuelle retenue** : afro-futuriste vibrant (sur les 3 maquettes de l'Incrément 1b).
   Détail carte encore en cours de discussion avec l'utilisateur (contour réel vs abstrait,
   villes réelles CESTOM à confirmer — voir "Questions non résolues" plus bas).
3. **3 livrables concours, tous requis** :
   - PPT de présentation, **3-4 slides max** (format 5 minutes), mêmes header/footer sur chaque
     slide avec les métadonnées du projet (nom, tagline).
   - **Business Plan détaillé, document séparé** du PPT (pas juste des slides intégrées).
   - Vidéo courte (~1 min), idéal si un scroll/maquette du produit est montré, avec un script
     "vendeur" mettant en avant la facilité de prise en main — l'utilisateur veut que le produit
     soit **self-explained** (bulles d'aide "?" pour expliquer les concepts type Pin/Bounty in-app).
4. **Sponsoring v2 (remplace le Sponsoring simple prévu à l'Incrément 3)** : mécanisme de
   monétisation réel mais sans passerelle de paiement (cohérent avec "zéro carte bancaire, zéro
   service payant" déjà acté pour le déploiement). Flux : un payeur veut un privilège (ex. Pin mis
   en avant) → fait un **virement bancaire réel** vers un compte CESTOM dédié → **upload une preuve
   (capture d'écran)** dans l'app → une entité `SponsorshipRequest` (payeur, montant déclaré, image
   preuve, statut pending/approved/rejected) est créée → un rôle **vérificateur** (voir point 5)
   approuve/rejette → si approuvé, le privilège s'active (badge "sponsorisé"/visibilité boostée).
   Storage image : réutiliser le compte Supabase Storage déjà prévu pour Reality-Vlogs (Incrément
   1a), pas un nouveau service.
5. **Rôle vérificateur simplifié** : l'utilisateur a explicitement écarté la notion de "bureau"
   CESTOM pour ce rôle ("on revient à un service où je suis le chef") — **pas** un nouveau rang RBAC
   spatial complexe. Traitement retenu : un flag `isVerifier` simple sur `User` (ou réutilisation du
   scope `national` existant sans lien à une ville, à trancher au moment du code — les deux sont
   équivalents en complexité, le national existant est réutilisable tel quel).
6. **Notation d'un service rendu** : vraie fonctionnalité (pas une promesse roadmap). Champ note
   1-5 (+ commentaire optionnel) ajouté au moment de `resolveBounty` par l'auteur du Bounty, notant
   la personne qui a résolu. Visible sur un profil (à créer si inexistant — vérifier l'état réel du
   frontend avant de coder).
7. **Ordre de priorité retenu pour les ~3 jours restants** : (1) Business Plan + contenu PPT —
   échéance dure, poids de notation le plus lourd ; (2) Sponsoring v2 + Notation, seules additions
   de code motivées directement par le pitch ; (3) refonte visuelle **ciblée** sur les écrans
   filmés dans la vidéo, pas toute l'app ; (4) vidéo + script vendeur, filmée en dernier une fois
   qu'il y a quelque chose de propre à montrer. Ghost Mode/Anti-brigading/Reality-Vlogs repoussés
   après le 3/09 (hors critères de notation communiqués, l'utilisateur ne s'y est pas opposé quand
   proposé).
8. **Aucun service externe payant** confirmé au 2026-08-31 : Vercel/Render/Supabase/Google OAuth,
   tous gratuits sans carte bancaire — reconfirmé à l'utilisateur qui posait la question, et
   cohérent avec le choix "preuve de virement + vérificateur" plutôt qu'une vraie passerelle de
   paiement pour Sponsoring v2.

### Questions non résolues (à trancher avant de coder la carte / le RBAC financier)

- ~~Liste exacte des villes CESTOM~~ **RÉSOLU 2026-08-31** : 6 villes réelles, effectifs exacts
  fournis par l'utilisateur (capture d'écran cestom.org) — Rabat 220, Casablanca 180, Marrakech 95,
  Fès 85, Tanger 40, Oujda 30 (total 650). `morocco-geo.ts`/`cities.service.ts` corrigés, base de
  dev nettoyée des 6 villes fictives, business plan mis à jour avec le vrai SAM.
- Contour du Maroc réel vs carte-réseau abstraite sur la carte (voir l'échange détaillé dans la
  conversation du 2026-08-31 — l'hybride silhouette discrète + traitement réseau est une option
  proposée mais pas encore confirmée). Toujours ouvert — ne bloque pas le reste.
- ~~Chiffres réels de marché~~ **PARTIELLEMENT RÉSOLU 2026-08-31** : SAM réel = 650 (ci-dessus).
  Reste ouvert : l'"ask" exact au concours (l'utilisateur a demandé ce que ça signifie, pas encore
  répondu une fois la définition donnée).

---

## Phase 0 — Agents dédiés

5 agents projet existaient déjà (`security-review`, `architecture-review`, `critical-logic-tests`,
`workflow-audit`, `product-designer`). 2 de plus à créer avant le reste (demande explicite
utilisateur du 2026-08-24) :

**`.claude/agents/token-steward.md`** — Tools: `Read, Grep, Glob, Edit`. Après un lot d'agents en
parallèle, lit les blocs `<usage>` réels retournés (`subagent_tokens`/`tool_uses`/`duration_ms`),
les logue dans `.claude/HANDOFF/TOKEN_LEDGER.md` (append-only), calcule un ratio tokens/tool_use
par agent, signale les invocations disproportionnées (scope de prompt trop large, lecture non
ciblée), propose/edite des resserrements — jamais un blocage, rôle consultatif. S'applique aussi à
lui-même.

**`.claude/agents/quality-gate.md`** — Tools: `Read, Grep, Glob, Bash` (pas d'`Agent` — ne relance
jamais lui-même, pour éviter une récursion incontrôlée). Invoqué en fin d'incrément significatif,
calcule un score composite 0-10 pondéré, façon Altman Z-score (plusieurs ratios combinés + verrou
dur, pas une moyenne molle) :

| Dimension | Poids | Calcul |
|---|---|---|
| Cohérence métier | 25% | affirmations doc vérifiées vraies / total vérifié |
| Tests logique critique | 20% | cas limites avec test négatif réel / cas limites identifiés |
| Sécurité | 20% | barème `security-review` ; **verrou dur** : 1 faille critique → composite plafonné à 4/10 |
| Accessibilité/UX | 15% | % des critères déjà actés (label visible, cible ≥44px, etc.) respectés |
| Dette technique | 10% | violations de pattern déjà documentées |
| Fraîcheur documentaire | 10% | doc mise à jour dans le même incrément si le comportement a changé |

Bandes : **≥8.5 passe** · **6.5-8.49 = relance obligatoire ×1, ciblée sur les dimensions <8** ·
**<6.5 = relance, arrêt et rapport à l'utilisateur si toujours <6.5 après 2 relances au total**
(jamais une 3e automatique). L'agent ne relance jamais lui-même — verdict chiffré uniquement,
c'est l'orchestrateur (session Claude) qui redéclenche le travail corrigé.

---

## Incrément 0 — Dette technique (bloquant, tout le reste en dépend)

**RBAC — centraliser `pins.service.ts::remove()`**
- **Corrigé 2026-08-25 par `architecture-review`** : la version initiale de ce plan prescrivait
  `this.roles.requireCityScope(userId, pin.cityId)` comme remplacement "comportement identique" —
  **c'était faux et aurait introduit une vraie faille** : `requireCityScope`/`canActOnCity`
  retournent `true` pour **tout** rôle national quelle que soit la ville ciblée (légitime pour un
  scope de lecture générale), ce qui aurait donné au national un pouvoir de suppression unilatérale
  — contradiction directe avec la doctrine actée ("aucune action destructrice unilatérale par un
  seul rôle national", `docs/ARCHITECTURE.md`). Le code réel a évité ce piège : deux nouvelles
  méthodes dédiées et testées dans `apps/api/src/roles/roles.service.ts`,
  `isLocalModeratorForCity(userId, targetCityId)` / `requireLocalModerationScope(userId,
  targetCityId)`, qui excluent explicitement le national. **Ne jamais utiliser
  `requireCityScope`/`canActOnCity` pour un contrôle de suppression/modération** — ce sont deux
  primitives à usages différents, pas interchangeables.
- `apps/api/src/pins/pins.service.ts` : appelle `this.roles.isLocalModeratorForCity(userId,
  pin.cityId)` — comportement observable identique à l'ancienne comparaison inline, vérifié
  caractère pour caractère par `architecture-review`.
- `apps/api/src/pins/pins.service.spec.ts` : les 5 tests existants adaptés (mock
  `isLocalModeratorForCity` au lieu de `findByUserId`), mêmes verdicts pass/fail.
- `apps/api/src/roles/roles.service.spec.ts` : nouveaux tests dédiés sur `isLocalModeratorForCity`/
  `requireLocalModerationScope`, dont un test de non-régression explicite vérifiant qu'un rôle
  national retourne bien `false` (contrairement à `canActOnCity`).
- `apps/api/src/bounties/bounties.module.ts` : importer `RolesModule` (câblage préparatoire,
  premier usage réel en Incrément 4).

**Migrations TypeORM réelles**
- Créer `apps/api/src/database/data-source.ts` (instance `DataSource` autonome pour le CLI).
- Créer `apps/api/src/database/migrations/`.
- `apps/api/package.json` : scripts `typeorm`, `migration:generate`, `migration:run`,
  `migration:revert`.
- Générer la migration baseline contre une base vierge (synchronize désactivé), pour un diff
  complet "rien → schéma actuel".
- `apps/api/src/database/database.module.ts` : `synchronize` — **dépend de la décision ouverte
  #2 ci-dessus**.
- Règle pour tous les incréments suivants : toute entité/colonne nouvelle vient avec 1 migration
  dédiée nommée clairement.

**Trouvé par `architecture-review` en auditant ce même incrément, corrigé avant commit** : aucun
index spatial GiST n'a jamais existé sur `pins.location`/`bounties.location`/`cities.centerPoint`
(`synchronize:true` n'en crée pas sans `@Index` déclaré) — un commentaire dans `cities.service.ts`
affirmait pourtant le contraire (corrigé). `findNearest()` (appelée à chaque création de
Pin/Bounty) faisait un scan séquentiel complet de `cities`. Migration
`AddSpatialIndexes` ajoutée : GiST sur les 3 colonnes géo + btree sur `pins.cityId`/
`bounties.cityId` (anticipe le filtrage par ville de `listQuarantine()`, Incrément 4). Vérifié par
`EXPLAIN` sur la vraie base de dev que le planificateur utilise bien le nouvel index (`Index Scan
using "IDX_cities_center_point"`), pas juste que l'index existe.

**Vérification réelle effectuée** : `npm run test` 32/32 (26 existants + 6 nouveaux) ; cycle complet
`migration:run` → `migration:revert` → `migration:run` sur DEUX conteneurs Postgres+PostGIS
vraiment vierges et isolés (jamais `infra-postgres-1`) ; backfill sans perte de données de la base
de dev existante (table `migrations` créée + baseline marqué "déjà appliqué" sans rejouer son SQL,
`AddSpatialIndexes` appliquée pour de vrai dessus) ; `EXPLAIN` confirmant l'usage réel du nouvel
index. Agent : `architecture-review`, invoqué réellement (pas simulé) — a trouvé et fait corriger
2 problèmes réels avant ce commit (voir ci-dessus), confirmé qu'aucun autre endroit du code n'a le
même risque RBAC.

---

## Incrément 1a — Amorce déploiement (100% palier gratuit, révisé 2026-08-25)

**Révisé** : le plan initial proposait un VPS payant + nom de domaine acheté, pour auto-héberger
Redis et le stockage vidéo. Décision utilisateur du 2026-08-25 : aucun paiement/carte bancaire.
Redis n'était déjà plus nécessaire (Ghost Mode version simple, voir Décision ouverte #1 résolue) —
remplacé par 3 services à palier gratuit, sans carte bancaire, chacun donnant un sous-domaine
automatique (pas de nom de domaine à acheter) :

| Composant | Service | Remplace |
|---|---|---|
| Frontend | Vercel | (inchangé par rapport au plan initial) |
| API (NestJS) | Render (déploie directement depuis `apps/api/Dockerfile`, déjà prévu) | VPS + Caddy |
| Postgres + PostGIS | Supabase (PostGIS supporté nativement sur le palier gratuit) | Postgres auto-hébergé |
| Stockage vidéo (Incrément 6) | Supabase Storage (même compte que la DB) | volume disque local |

**Fichiers** : `apps/api/Dockerfile` (build multi-stage, Node ≥20.9 — inchangé, Render le
consomme directement), `apps/api/.dockerignore`. `infra/docker-compose.prod.yml` et
`infra/Caddyfile` du plan initial ne sont plus nécessaires (Render gère TLS/sous-domaine/reverse
proxy automatiquement) — `infra/docker-compose.yml` (dev local) reste inchangé.

**Actions utilisateur nécessaires** (je ne peux pas les faire moi-même — pas d'outil navigateur
dans cette session) : créer un remote GitHub (actuellement aucun, nécessaire pour connecter
Render/Vercel) ; créer un compte Vercel, un compte Render, un compte Supabase (email ou GitHub,
2 min chacun, aucune carte demandée). Étapes exactes détaillées au moment de lancer cet incrément.

**2 limites réelles à accepter pour un usage "démo pitch"** (pas cachées) : le service Render
gratuit s'endort après 15 min d'inactivité (première requête après pause : 30-60s le temps du
redémarrage) ; le projet Supabase gratuit se met en pause après ~1 semaine d'inactivité (réveil
manuel d'un clic dans leur dashboard — à faire la veille du pitch).

**Confirmé par vérification directe du code** : le frontend est 100% CSR (`"use client"` partout
dans `page.tsx`/`CityOverview.tsx`/`Hero.tsx`, aucun appel serveur au build) — Vercel n'a jamais
besoin d'atteindre l'API au build, seulement `NEXT_PUBLIC_API_URL` au runtime navigateur.

**Docs à corriger dans ce même incrément** (état réel fait foi) : `docs/STACK.md` section "Cible
de déploiement" (remplace VPS+Docker Compose+Caddy par Vercel+Render+Supabase — qui rejoint en fait
la cible originale de ce document, avant le détour VPS) ; `docs/ARCHITECTURE.md` section
"Scale-to-zero" (confirmer que cette hypothèse tient à nouveau, contrairement au VPS à coût plat
envisagé un temps).

**Vérification** : `curl https://<projet>.onrender.com/health` (vraie connexion DB via Terminus,
déjà câblé), `curl .../cities`, frontend Vercel atteint l'API sans CORS bloqué. Agent :
`architecture-review`.

---

## Incrément 1b — Exploration design (parallélisable avec 1a, zéro risque code)

Invoquer `product-designer` en 2-3 instances parallèles, angles créatifs différents (ex. "arcade
rétro", "ludique façon Duolingo", "afro-futuriste vibrant"). Écrans : accueil (explique le produit
avant la carte), carte + panneau de ville, création de contenu. **Ajout recommandé** : au moins
une maquette montrant les nouveaux états visuels d'un Pin (badge "Sponsorisé" doré, badge "Fantôme
anonyme", vignette Reality-Vlog) — sinon la refonte visuelle (Incrément 2) livre un système qui n'a
jamais anticipé ces états, et les incréments 3/5/6 devront improviser un style non validé.

---

## Incrément 2 — Refonte visuelle (code)

Modifie uniquement le visuel, pas la mécanique (la mécanique des sheets ne doit pas être dupliquée/
retouchée, déjà actée dans `docs/ARCHITECTURE.md`) : `globals.css` (nouveaux tokens selon la
direction choisie en 1b), `Hero.tsx`/`CityOverview.tsx` (accueil restructuré), correction du bouton
"+" flottant sans label visible (bug diagnostiqué le 2026-08-24, cause directe du rejet du rendu
actuel), passe de tokens sur `DetailSheet.tsx`/`CreateSheet.tsx`/`PinDetail.tsx`/`BountyDetail.tsx`/
`CityPanel.tsx`/`Header.tsx`.

**Vérification** : lint/tsc verts, SSR re-vérifié par curl, puis confirmation réelle utilisateur
PC/téléphone (⛔ tant que non confirmé — aucun outil navigateur/appareil disponible en session
agent). Agent : `workflow-audit`.

---

## Incrément 3 — Sponsoring vérifié ✅ FAIT 2026-09-04

**Le mécanisme ci-dessous (`isSponsored` sur `Pin`, `sponsor()`/`unsponsor()`) a été abandonné
avant d'être codé** — remplacé le 2026-08-31 par le "Sponsoring vérifié" du pivot concours (preuve
de virement + rôle vérificateur, voir § Pivot ci-dessus), qui EST ce qui a été réellement construit
et audité. Section gardée biffée ci-dessous pour l'historique, ne pas la suivre.

~~**Schéma** (`pin.entity.ts`) : `isSponsored: boolean` (default false), `sponsoredAt:
timestamptz|null`, `sponsoredById: uuid|null` + relation `sponsoredBy`.~~

~~**Backend** : `roles.service.ts` → nouvelle `isNational()`/`requireNationalScope()`...
`pins.service.ts` → `sponsor()`/`unsponsor()`... migration `AddPinSponsorship`.~~

~~**Frontend** : `types.ts` (`PinView.isSponsored`), `PinDetail.tsx` (badge doré)...~~

### Ce qui a été réellement construit (Sponsoring vérifié)

**Schéma** : nouveau module `apps/api/src/sponsorship/`, entité `SponsorshipRequest`
(`requesterId`, `description`, `amountDeclared: numeric(10,2)` avec transformer explicite
number↔string, `proofImageUrl`, `status: pending|approved|rejected`, `reviewedById`,
`reviewedAt`, `rejectionReason`). Migration `AddSponsorshipRequests` (index sur `status`).

**Backend** : `roles.service.ts` → `isVerifier()`/`requireVerifierScope()` réutilisent le scope
`national` existant (pas de nouveau rang RBAC, décision actée au § Pivot). `sponsorship.service.ts`
→ `create()`, `findMine()`, `findPending()` (verifier only), `findApprovedPublic()` (public,
expose uniquement `id`/`description`/`requesterDisplayName` — jamais le montant ni l'URL de
preuve), `findOne()` (auteur ou vérificateur seulement), `approve()`/`reject()` en **UPDATE
conditionnel atomique unique** (même pattern que `BountiesService.claim()`, `WHERE status='pending'
AND "requesterId" != $verifierId` — empêche à la fois une double-décision concurrente ET
l'auto-approbation, faille critique trouvée par `security-review` avant commit, corrigée dans la
même requête). `proofImageUrl` validé par un validateur `class-validator` custom
(`https` obligatoire + hôtes privés/loopback/link-local littéraux rejetés — trouvé par
`security-review` : sans ça, risque de désanonymisation d'un vérificateur nommé + SSRF latent).

**Frontend** : pas encore construit (voir "Reste à faire" ci-dessous) — le backend est réel,
testé, audité, mais inatteignable depuis l'UI de l'app pour l'instant.

**Vérification** : 32 assertions HTTP réelles (pas seulement mocks) sur base Postgres+PostGIS
isolée fraîche — création, refus non-vérificateur, approbation, re-approbation refusée,
auto-approbation refusée (régression après le fix), fuite de données bloquée sur la liste
publique, lecture refusée à un tiers, 6 URLs malveillantes rejetées, montant hors bornes rejeté
proprement. 58/58 tests unitaires. Audité par `security-review` (1 faille critique + 1 moyenne
trouvées et corrigées) et `architecture-review` (contradiction documentaire + drift de contrat
`BountyView` trouvés et corrigés).

**Frontend fait juste après** (`apps/web/src/app/sponsoring/page.tsx`) : formulaire de
soumission, suivi "Mes demandes", file de vérification (visible si `role.scope === "national"`),
liste publique des sponsors. Vérifié par lint/tsc + SSR curl réel.

---

## Incrément 4 — Modération anti-brigading

**Schéma** : nouveau module `apps/api/src/moderation/`, entité `Report` (`reporterId`, `pinId`
nullable, `bountyId` nullable, `reason`, `createdAt`). Contraintes en migration SQL (pas
exprimables en décorateurs TypeORM) : `CHECK` exactement une cible non-nulle, **deux index uniques
partiels** `UNIQUE(reporterId,pinId) WHERE pinId IS NOT NULL` / idem bounty (un `UNIQUE` composite
classique ne suffit pas : NULL≠NULL en contrainte unique SQL standard — sans ça le seuil est
trivialement gonflable). `pin.entity.ts`/`bounty.entity.ts` : `quarantinedAt: timestamptz|null`.

**Backend** : `moderation.service.ts` → `report()` (valide XOR pin/bounty, insère, recompte
`COUNT(*)`/`COUNT(DISTINCT reporter.homeCityId)`, seuil **>6 signalements ET ≥6 villes distinctes**
— repris du canevas stratégique — déclenche quarantaine dans une **transaction** couvrant
insertion+quarantaine, premier usage de transaction multi-instruction du projet) ; mitigation Sybil
(un compte créé il y a <24h ne compte pas dans le seuil — n'élimine pas un attaquant patient, bloque
le raid impulsif, à documenter comme limitation connue, pas vendu comme infaillible) ;
`listQuarantine()` (RBAC de filtrage : national=tout, local=sa ville) ; `pins.service.ts`/
`bounties.service.ts` → `quarantine()`, `restore()` (réutilise `requireCityScope`) ; listings
publics excluent `quarantinedAt IS NOT NULL` par défaut. Migration `AddReportsAndQuarantine`.

**⚠️ Dépendance forte avec l'Incrément 5** : aujourd'hui un rôle local supprime un Pin de sa ville
**instantanément, sans signalement préalable** — un levier plus fort et plus incontrôlé sur un post
anonyme que le système de signalement lui-même. Ghost Mode (Incrément 5) durcit `remove()` pour
qu'un Pin anonyme non révélé ne soit supprimable par un local QUE si `quarantinedAt IS NOT NULL` —
donc **l'anti-brigading doit être livré avant Ghost Mode**, pas après.

**Frontend** : bouton "Signaler" intégré dans `PinDetail.tsx`/`BountyDetail.tsx` (formulaire
inline, pas une nouvelle sheet empilée) ; nouvelle page `apps/web/src/app/moderation/page.tsx`
(file de quarantaine filtrée par rôle) ; lien "Modération" dans `Header.tsx` si `role !== null`.

**Vérification (tests négatifs exacts)** : 6 signalements/6 villes → PAS de quarantaine ; 7/6 →
quarantaine déclenchée ; 8 signalements mais 5 villes → pas de quarantaine (preuve anti-clan-local) ;
même utilisateur signale 2× le même contenu → rejeté ; local restaure seulement sa ville ; national
ne peut toujours pas supprimer unilatéralement un contenu quarantiné. Agents : `security-review` +
`critical-logic-tests` + `architecture-review`.

---

## Incrément 5 — Ghost Mode (Pin d'abord, puis Bounty)

*Détail dépendant de la Décision ouverte #1 (version simple vs purgatoire d'upvotes) — ce qui suit
décrit la version simple.*

**Schéma** (`pin.entity.ts` puis `bounty.entity.ts`) : `isAnonymous: boolean`,
`revealedAt: timestamptz|null`. **Pas de nouvelle colonne d'auteur** — `authorId` reste toujours le
vrai auteur, jamais touché par la logique d'autorisation existante.

**Décisions de conception clés (déjà tranchées, avec justification)** :
- **Masquage uniquement dans la projection SQL** (`rawSelect()`) : `CASE WHEN isAnonymous AND
  revealedAt IS NULL THEN <placeholder> ELSE <vrai> END`. Placeholder `authorId` = l'id du Pin
  lui-même (UUID déjà unique, non-optionnel, ne résout jamais vers un utilisateur ailleurs — donc
  non corrélable), `authorDisplayName = "Fantôme anonyme"`.
- **`viewerIsRealAuthor` calculé côté serveur** (jamais l'id réel renvoyé) pour que l'auteur puisse
  voir son propre bouton de révélation sans que `authorId` soit exposé à qui que ce soit — impose
  un nouveau `OptionalJwtAuthGuard` (authentifie si token présent, laisse passer sinon) sur
  `GET /pins`/`GET /pins/:id`, premier guard de ce type dans le projet.
- **Action nommée `reveal`, jamais `claim`** (`PATCH /pins/:id/reveal`) — évite la collision
  sémantique avec le "claim" des Bounties qui veut dire autre chose (accepter d'aider).
- `remove()` durci pour un Pin anonyme non révélé : branche rôle-local exige en plus
  `pin.quarantinedAt IS NOT NULL` (voir dépendance avec Incrément 4) ; l'auteur réel garde un accès
  direct inchangé, sans condition.

**Backend** : `optional-jwt-auth.guard.ts` (nouveau) ; `pins.controller.ts`/`pins.service.ts`
adaptés (viewerId optionnel propagé, `reveal()` atomique
`UPDATE...WHERE authorId=$2 AND isAnonymous AND revealedAt IS NULL RETURNING id`) ; `create-pin.dto`
→ `isAnonymous?`; tests (reveal par vrai auteur OK, par tiers Forbidden, déjà révélé Conflict, pas
anonyme BadRequest, local ne peut PAS supprimer anonyme non quarantiné, PEUT une fois quarantiné,
auteur peut toujours supprimer le sien sans condition) ; fast-follow identique sur Bounty
(`PATCH /bounties/:id/reveal`) ; migrations `AddGhostModeToPins`/`AddGhostModeToBounties`.

**Frontend** : `types.ts` (`isAnonymous`, `revealedAt`, `viewerIsRealAuthor`) ; `CreateSheet.tsx`
(case "Publier anonymement") ; `PinDetail.tsx`/`BountyDetail.tsx` (badge "Fantôme anonyme"/"révélé
le...", bouton de révélation conditionné à `viewerIsRealAuthor`, jamais `user?.id === authorId` qui
est structurellement inutilisable ici puisque `authorId` est masqué).

**Point de vigilance signalé par `architecture-review` (audit Incrément 0, 2026-08-25)** :
`apps/web/src/components/PinDetail.tsx` réimplique indépendamment la même règle d'autorisation que
`pins.service.ts::remove()` juste pour afficher/masquer le bouton de suppression (`user?.id ===
pin.authorId || (role?.scope === "local" && role.cityId === pin.cityId)`) — aujourd'hui cohérent
avec le backend, mais exactement le pattern que `docs/ARCHITECTURE.md` documente comme à éviter
("logique de scope centralisée, pas dupliquée"). Quand `remove()` sera durci ici pour exiger
`quarantinedAt IS NOT NULL` sur un Pin anonyme non révélé, ce composant devra être mis à jour dans
le même incrément, sous peine d'afficher/masquer le bouton à tort sans qu'aucun test ne le détecte
(le backend reste l'autorité réelle, donc pas une faille de sécurité — juste un bouton menteur).

**Vérification impérative** : cycle réel confirmant qu'aucune réponse API (avec ou sans token) ne
fuite jamais le vrai auteur avant révélation. Agent **impératif** : `security-review` — mandat
documenté exact : "aucun log, réponse API ou export n'expose la correspondance auteur réel ↔ post
anonyme avant claim."

---

## Incrément 6 — Reality-Vlogs

**Révisé 2026-08-25** : stockage vidéo sur **Supabase Storage** (bucket S3-compatible du même
compte gratuit que la DB, voir Incrément 1a) plutôt qu'un volume disque local — conséquence directe
du passage à un hébergement 100% gratuit sans VPS. Le champ `videoPath` devient l'URL/clé retournée
par Supabase Storage plutôt qu'un chemin de fichier local ; `GET /vlogs/:id/video` redirige ou
proxy vers cette URL au lieu d'un `res.sendFile` sur disque. Nécessite `@supabase/supabase-js` en
dépendance backend (seule vraie nouvelle dépendance runtime introduite par ce revirement).

**Schéma** : nouveau `apps/api/src/vlogs/entities/vlog.entity.ts` (table `vlogs`) : `authorId`
(pas de Ghost Mode sur les vlogs, non demandé), `title`, `location` (geography Point, convention
Pin/Bounty), `cityId` (déduite via `CitiesService.findNearest`), `videoPath` (clé Supabase Storage,
générée serveur, jamais dérivée du nom de fichier client — évite path traversal/collision),
`durationSeconds` (informatif, non vérifié serveur), `fileSizeBytes`, `mimeType`.

**Backend** : nouveau module `apps/api/src/vlogs/` — `POST /vlogs` (JwtAuthGuard +
`FileInterceptor` en mémoire, `multer` déjà résolvable en transitive de `@nestjs/platform-express`,
upload du buffer vers Supabase Storage via `@supabase/supabase-js`) ; `GET /vlogs` (public, bbox) ;
`GET /vlogs/:id/video` (redirige vers l'URL publique/signée Supabase Storage) ; `DELETE /vlogs/:id`
(auteur ou local via `requireCityScope`, supprime aussi l'objet Storage) ; `env.validation.ts` →
`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `VLOGS_MAX_FILE_SIZE_MB` (remplace `VLOGS_STORAGE_PATH`) ;
migration `CreateVlogs`.

**Décision assumée** : pas de validation serveur de durée (15-60s du canevas) — nécessiterait
`ffprobe`/`ffmpeg` (binaire natif de plus dans l'image Docker), complexité non justifiée sous 2
semaines. Contrôle client uniquement (avertissement, pas un blocage dur) — limitation documentée,
pas cachée.

**Frontend** : `apiUpload()` dans `lib/api.ts` (ne fixe PAS `Content-Type`, le navigateur pose la
boundary multipart lui-même — `apiFetch` actuel le fixerait à tort) ; `CreateSheet.tsx` (refactor
préalable du bloc `kind` en tableau `.map()` avant d'ajouter l'onglet "vlog") ; nouveau
`VlogDetail.tsx` (`<video controls>`) ; `CityPanel.tsx` (3ᵉ branche liste vlogs).

**Vérification** : upload réel multipart, lecture avec en-tête `Range` (scrubbing), suppression
auteur puis local hors-ville (doit échouer). **Priorité de test réel sur appareil** (upload mobile,
lecture cross-navigateur — le workflow le plus à risque de "marche en apparence, pas en vrai" du
lot). Agents : `security-review` (validation MIME réelle, pas juste l'extension — un upload
déguisé est un vecteur XSS/RCE classique) + `architecture-review`.

---

## Vérification — tableau récapitulatif

| Incrément | Build/lint/test | Vérification manuelle réelle | Agent(s) |
|---|---|---|---|
| 0 | ✓ 32/32 | run/revert/run sur 2 bases vierges isolées + backfill dev + `EXPLAIN` | `architecture-review` ✅ fait |
| 1a | ✓ | `curl` HTTPS réel `/health`, `/cities` | `architecture-review` |
| 1b | — | Artifact regardé par l'utilisateur | — |
| 2 | ✓ | Test réel PC/téléphone (⛔ tant que non confirmé) | `workflow-audit` |
| 3 | ✓ | Cycle curl signup-national→sponsor→vérif | `security-review`, `critical-logic-tests` |
| 4 | ✓ | Cycle 6/6 vs 7/6 vs 8/5 explicite | `security-review`, `critical-logic-tests`, `architecture-review` |
| 5 | ✓ | Aucune fuite d'auteur avant reveal, avec/sans token | `security-review` (impératif) |
| 6 | ✓ | Upload+lecture réels, y compris mobile | `security-review`, `architecture-review` |
