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
| 0 | Dette technique (RBAC centralisé + migrations réelles) | ⬜ pas commencé |
| 1a | Amorce déploiement (VPS + Docker + domaine + Vercel) | ⬜ pas commencé — bloqué sur infra externe (voir Décisions ouvertes) |
| 1b | Exploration design (`product-designer`, parallèle) | ⬜ pas commencé |
| 2 | Refonte visuelle (code) | ⬜ pas commencé |
| 3 | Sponsoring (Pins dorés) | ⬜ pas commencé |
| 4 | Modération anti-brigading | ⬜ pas commencé |
| 5 | Ghost Mode | ⬜ pas commencé |
| 6 | Reality-Vlogs | ⬜ pas commencé |

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
3. **VPS + nom de domaine** : nécessite un accès/budget que je n'ai pas — actions réservées à
   l'utilisateur (créer un compte hébergeur, acheter un domaine). **Bloque l'Incrément 1a**, mais
   aucun autre incrément n'en dépend — peut se faire en parallèle du reste.
4. Différées sans bloquer le plan : manifest PWA/service worker (absent malgré le nom "PWA" partout
   dans les docs — coût faible à ajouter si voulu, hors périmètre demandé) ; marqueurs individuels
   de Pins sponsorisés directement sur la carte SVG (nécessite une fonction de projection lat/lng
   qui n'existe pas — le Sponsoring de l'Incrément 3 reste "réel et visible en liste", pas sur la
   carte) ; credentials Google OAuth réels (non bloquant, email+mot de passe suffit).

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
- `apps/api/src/pins/pins.service.ts` : remplacer la comparaison inline
  (`role?.scope === RoleScope.LOCAL && role.cityId === pin.cityId`) par
  `this.roles.requireCityScope(userId, pin.cityId)` — comportement observable identique.
- `apps/api/src/pins/pins.service.spec.ts` : adapter les 5 tests existants (mock
  `requireCityScope`) en gardant exactement les mêmes verdicts pass/fail.
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

**Vérification** : `npm run test` (26/26 + tests adaptés) verts, `migration:run` réussit sur base
vierge ET sur la base de dev actuelle. Agent : `architecture-review`.

---

## Incrément 1a — Amorce déploiement

**Fichiers** : `apps/api/Dockerfile` (build multi-stage, Node ≥20.9), `apps/api/.dockerignore`,
`infra/docker-compose.prod.yml` (séparé du `docker-compose.yml` de dev — services `postgres`,
`api`, `caddy`, volumes `postgres-data`/`vlogs-data`/`caddy-data`), `infra/Caddyfile` (reverse
proxy TLS auto Let's Encrypt).

**Actions utilisateur nécessaires** (je ne peux pas les faire moi-même) : créer un remote GitHub
(actuellement aucun) ; provisionner un VPS Docker (Hetzner CX22 ~4-5€/mois ou DigitalOcean Basic
~6$/mois — un vrai VPS est la seule option qui supporte `docker compose` multi-service+volumes
sans traduction vers un format PaaS propriétaire) ; acheter un nom de domaine (Let's Encrypt
n'émet pas de certificat pour une IP nue) ; créer le projet Vercel pour le frontend.

**Confirmé par vérification directe du code** : le frontend est 100% CSR (`"use client"` partout
dans `page.tsx`/`CityOverview.tsx`/`Hero.tsx`, aucun appel serveur au build) — Vercel n'a jamais
besoin d'atteindre le VPS au build, seulement `NEXT_PUBLIC_API_URL` au runtime navigateur. Split
Vercel (front) / VPS (back) confirmé comme la bonne option, pas d'alternative meilleure trouvée.

**Docs à corriger dans ce même incrément** (état réel fait foi) : `docs/STACK.md` section "Cible
de déploiement" (remplace Vercel+Railway+Supabase+Upstash+R2 par VPS+Docker Compose+Caddy+Vercel) ;
`docs/ARCHITECTURE.md` section "Scale-to-zero" (noter que l'auto-hébergement à coût plat remplace
l'hypothèse scale-to-zero d'origine, et pourquoi).

**Vérification** : `curl https://api.<domaine>/health` (vraie connexion DB via Terminus, déjà
câblé), `curl https://api.<domaine>/cities`, frontend Vercel atteint l'API sans CORS bloqué.
Agent : `architecture-review`.

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

## Incrément 3 — Sponsoring (Pins dorés)

**Schéma** (`pin.entity.ts`) : `isSponsored: boolean` (default false), `sponsoredAt: timestamptz|
null`, `sponsoredById: uuid|null` + relation `sponsoredBy`.

**Backend** : `roles.service.ts` → nouvelle `isNational()`/`requireNationalScope()` (méthode
dédiée, distincte de `requireCityScope` car un rôle local ne doit PAS pouvoir sponsoriser) ;
`pins.service.ts` → `sponsor()`/`unsponsor()` (atomique `UPDATE...RETURNING`, piège tuple
`[rows,rowCount]` de cette version de TypeORM) ; `pins.controller.ts` → `PATCH /pins/:id/sponsor`,
`PATCH /pins/:id/unsponsor` ; tests positif (national) + négatif (local et utilisateur ordinaire
rejetés) ; migration `AddPinSponsorship`.

**Frontend** : `types.ts` (`PinView.isSponsored`), `PinDetail.tsx` (badge doré + bouton visible
seulement si `role?.scope === "national"`), `CityPanel.tsx` (tri sponsorisés en premier).

**Vérification** : cycle curl réel (signup national via `BOOTSTRAP_ADMIN_EMAIL`, sponsor, vérif,
unsponsor). Agents : `security-review` + `critical-logic-tests`.

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

**Vérification impérative** : cycle réel confirmant qu'aucune réponse API (avec ou sans token) ne
fuite jamais le vrai auteur avant révélation. Agent **impératif** : `security-review` — mandat
documenté exact : "aucun log, réponse API ou export n'expose la correspondance auteur réel ↔ post
anonyme avant claim."

---

## Incrément 6 — Reality-Vlogs

**Schéma** : nouveau `apps/api/src/vlogs/entities/vlog.entity.ts` (table `vlogs`) : `authorId`
(pas de Ghost Mode sur les vlogs, non demandé), `title`, `location` (geography Point, convention
Pin/Bounty), `cityId` (déduite via `CitiesService.findNearest`), `videoPath` (nom généré serveur,
jamais le nom client — évite path traversal), `durationSeconds` (informatif, non vérifié serveur),
`fileSizeBytes`, `mimeType`.

**Backend** : nouveau module `apps/api/src/vlogs/` — `POST /vlogs` (JwtAuthGuard +
`FileInterceptor`, `multer` déjà résolvable en transitive de `@nestjs/platform-express`, aucune
nouvelle dépendance runtime, seulement `@types/multer` en dev) ; `GET /vlogs` (public, bbox) ;
`GET /vlogs/:id/video` (`res.sendFile`, Express gère nativement `Range` pour le scrubbing vidéo) ;
`DELETE /vlogs/:id` (auteur ou local via `requireCityScope`) ; `env.validation.ts` →
`VLOGS_STORAGE_PATH`, `VLOGS_MAX_FILE_SIZE_MB` ; migration `CreateVlogs`.

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
| 0 | ✓ | `migration:run` base vierge + existante | `architecture-review` |
| 1a | ✓ | `curl` HTTPS réel `/health`, `/cities` | `architecture-review` |
| 1b | — | Artifact regardé par l'utilisateur | — |
| 2 | ✓ | Test réel PC/téléphone (⛔ tant que non confirmé) | `workflow-audit` |
| 3 | ✓ | Cycle curl signup-national→sponsor→vérif | `security-review`, `critical-logic-tests` |
| 4 | ✓ | Cycle 6/6 vs 7/6 vs 8/5 explicite | `security-review`, `critical-logic-tests`, `architecture-review` |
| 5 | ✓ | Aucune fuite d'auteur avant reveal, avec/sans token | `security-review` (impératif) |
| 6 | ✓ | Upload+lecture réels, y compris mobile | `security-review`, `architecture-review` |
