# Top 10 fichiers maîtres — guide de lecture fichier par fichier

*Sur le modèle d'un document équivalent utilisé pour un autre projet (stage été 2026) : liste les
10 fichiers SOURCE à ouvrir toi-même, un par un, dans cet ordre, chacun avec ce qu'on y trouve
(méthodes, syntaxe piégeuse, variables clés) + un mini-extrait du passage le plus important.
Objectif : que tu puisses ouvrir chaque fichier dans l'IDE en le lisant et retrouver
immédiatement ce dont il est question, puis le recopier à la main pour ancrer l'architecture.*

**Rédigé le 2026-09-05**, chaque fichier relu intégralement le jour même (pas recopié de
mémoire) — conforme à la règle du projet "vérifier, ne jamais supposer"
(`CLAUDE.md` §5). CestomClash228 est un projet à 2 process (API NestJS + Web Next.js) plutôt que
la solution .NET monolithique du document de référence — la moitié des entrées est donc côté
backend, l'autre côté frontend, pour couvrir les DEUX bouts de la chaîne plutôt qu'un seul.

## Ordre de lecture conseillé

| # | Fichier | Rôle en une ligne |
|---|---|---|
| 1 | `apps/api/src/app.module.ts` | Composition root — quels modules existent et dans quel ordre |
| 2 | `apps/api/src/roles/roles.service.ts` | RBAC spatial — qui peut agir sur quelle ville, et la doctrine "pas de pouvoir destructeur unilatéral" |
| 3 | `apps/api/src/bounties/entities/bounty.entity.ts` | Entité domaine — cycle de vie d'une Bounty en colonnes |
| 4 | `apps/api/src/bounties/bounties.service.ts` | Logique métier — `claim`/`resolve`/`rate`, écriture atomique anti-race |
| 5 | `apps/api/src/sponsorship/sponsorship.service.ts` | Même pattern atomique, appliqué à une vraie faille de sécurité trouvée et corrigée |
| 6 | `apps/api/src/database/data-source.ts` + une migration | Comment le schéma SQL est versionné, pas deviné |
| 7 | `apps/web/src/lib/api.ts` | Le seul pont HTTP entre le front et l'API — tout passe par ici |
| 8 | `apps/web/src/lib/audio-context.tsx` | Musique en boucle sans à-coup — Web Audio API, pas un simple `<audio loop>` |
| 9 | `apps/web/src/components/MoroccoMap.tsx` | Carte SVG faite main — accessibilité clavier, encodage couleur/taille de donnée réelle |
| 10 | `apps/web/src/app/globals.css` | Le piège CSS Cascade Layers qui a rendu un bouton invisible — bug réel, trouvé et corrigé le jour même |

---

## A. Backend — sécurité, domaine, logique métier (NestJS / TypeORM)

### 1. `apps/api/src/app.module.ts`
*Composition root — la liste des modules dit tout ce qui existe dans l'API, dans l'ordre où
Nest les assemble.*

- `@Module({ imports: [...] })` : chaque feature (`CitiesModule`, `RolesModule`, `AuthModule`,
  `PinsModule`, `BountiesModule`, `SponsorshipModule`...) est un module NestJS séparé, importé
  ici — pas de logique métier dans ce fichier lui-même, juste le câblage.
- `ConfigModule.forRoot({ isGlobal: true, validationSchema: envValidationSchema })` : les
  variables d'environnement sont validées par un schéma Joi AU DÉMARRAGE — une variable
  manquante ou mal typée fait planter le process immédiatement, jamais une erreur silencieuse
  découverte en production trois requêtes plus tard.
- `ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }])` + `APP_GUARD` global : rate-limiting
  appliqué à TOUTE l'API par défaut (100 requêtes/minute/IP), pas ajouté route par route.
- Ordre d'import qui reflète les dépendances réelles : `RolesModule` avant `SponsorshipModule`
  (celui-ci injecte `RolesService`, voir entrée 5) — Nest résout l'injection de dépendances peu
  importe l'ordre du tableau, mais le lire dans cet ordre aide à voir qui dépend de qui.

```ts
// lignes 18-34 : la liste complète, un module = une feature
imports: [
  ConfigModule.forRoot({ isGlobal: true, validationSchema: envValidationSchema }),
  ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
  DatabaseModule,
  HealthModule,
  CitiesModule,
  UsersModule,
  RolesModule,
  AuthModule,
  PinsModule,
  BountiesModule,
  SponsorshipModule,
],
```

**Trace d'exécution.** Au démarrage, Nest lit ce fichier pour construire tout le conteneur
d'injection de dépendances : `ConfigModule` valide `.env` en premier (tout le reste en dépend),
puis chaque module s'enregistre — `RolesModule` exporte `RolesService`, que `SponsorshipModule`
(entrée 5) et `BountiesModule` (entrées 3-4) consomment sans jamais réimplémenter leur propre
logique de rôle. `ThrottlerGuard`, enregistré via `APP_GUARD`, s'exécute AVANT chaque contrôleur
de chaque module — un module qui voudrait s'en exempter devrait le dire explicitement
(`@SkipThrottle()`), aucun n'en profite ici. Ce fichier ne change quasiment jamais une fois un
module ajouté — la vraie logique vit dans les fichiers qu'il assemble.

### 2. `apps/api/src/roles/roles.service.ts`
*Le RBAC spatial du projet tient dans une seule classe — et une doctrine volontairement limitée
inscrite en commentaire de tête, pas juste dans la tête de quelqu'un.*

- Commentaire de tête (lignes 11-17) : cette classe n'expose **volontairement** aucune méthode
  "supprimer/bannir un utilisateur ou un contenu par décision unilatérale d'un rôle national" —
  décision produit délibérée (le Bureau Exécutif central ne doit pas avoir un pouvoir
  destructeur sans mécanisme collectif), pas un oubli à corriger plus tard.
- `canActOnCity(userId, targetCityId)` : le scope est évalué sur la **ville CIBLE de la
  ressource**, jamais sur la position GPS live de l'acteur — un rôle ne s'évapore pas parce que
  son titulaire voyage.
- Deux paires méthode `is*`/`require*` distinctes et **volontairement non interchangeables** :
  `canActOnCity`/`requireCityScope` autorisent le national PARTOUT (lecture/scope général),
  `isLocalModeratorForCity`/`requireLocalModerationScope` **excluent** le national (modération
  destructrice de contenu) — le commentaire ligne 92-97 dit explicitement de ne jamais confondre
  les deux.
- `isVerifier`/`requireVerifierScope` (Sponsoring, ajoutées le 2026-09-04) : réutilisent
  `RoleScope.NATIONAL` par analogie avec `assign()` plutôt que d'inventer un nouveau rang — une
  vérification financière administrative n'est pas une action destructrice contre un pair, donc
  la doctrine ci-dessus ne s'y applique pas.

```ts
// lignes 98-104 : la méthode qui EXCLUT le national, à l'inverse de canActOnCity juste au-dessus
async isLocalModeratorForCity(
  userId: string,
  targetCityId: string,
): Promise<boolean> {
  const role = await this.findByUserId(userId);
  return role?.scope === RoleScope.LOCAL && role.cityId === targetCityId;
}
```

**Trace d'exécution.** Chaque service métier qui a besoin d'une vérification de droits appelle
une des méthodes `require*` de ce fichier — jamais sa propre logique de rôle recopiée localement.
`BountiesService` et `SponsorshipService` (entrées 4-5) n'importent que ce dont ils ont besoin :
le premier n'utilise même pas ce fichier pour `claim`/`resolve` (n'importe quel utilisateur
authentifié peut réclamer une Bounty, voir entrée 4), le second appelle systématiquement
`requireVerifierScope` avant toute décision. La distinction scope-large (`canActOnCity`) vs
scope-modération (`isLocalModeratorForCity`) n'est vérifiable qu'en lisant les DEUX méthodes
côte à côte — un futur ajout qui utiliserait la mauvaise par erreur ne serait jamais signalé par
TypeScript (les deux ont la même signature), seulement par une relecture attentive.

### 3. `apps/api/src/bounties/entities/bounty.entity.ts`
*Entité TypeORM la plus riche du projet — le cycle de vie complet d'une Bounty tient dans ses
colonnes et leurs commentaires, pas dans un diagramme externe.*

- `location` : type `geography` PostGIS (`spatialFeatureType: 'Point', srid: 4326`) — jamais lu
  en JS directement, toujours reconstruit via `ST_X`/`ST_Y` côté SQL (voir entrée 4,
  `rawSelect`) — la même convention que `Pin`.
- `expiresAt: Date` marqué "horodatage serveur faisant autorité — jamais un countdown calculé
  seulement côté client" : le compte à rebours affiché dans l'UI est purement décoratif, la
  vraie expiration est vérifiée en base à chaque lecture (`materializeExpiry`, entrée 4).
- `claimedBy`/`claimedById` : paire eager-relation + colonne FK explicite, `nullable: true` —
  une Bounty `OPEN` n'a personne, `CLAIMED`/`RESOLVED` en a un.
- `ratingValue: number | null` (pas `default: 0`) : `null` signifie explicitement "pas encore
  noté", jamais confondu avec une vraie note basse de 0 — distinction actée en commentaire
  (lignes 61-65) au moment de l'ajout de la Notation (2026-09-04).

```ts
// lignes 61-70 : la Notation, ajoutée en dernier, avec sa règle d'unicité posée en commentaire
// avant meme d'etre codee dans le service (entree 4)
@Column({ type: 'smallint', nullable: true })
ratingValue: number | null;

@Column({ type: 'text', nullable: true })
ratingComment: string | null;
```

**Trace d'exécution.** Cette entité ne contient elle-même aucune logique de transition d'état
(pas de méthode `claim()`/`resolve()` dessus, contrairement à un modèle DDD riche) — TypeORM la
traite comme un sac de colonnes, toute la logique de cycle de vie vit dans `BountiesService`
(entrée 4), qui lit et écrit ces colonnes via des requêtes conditionnelles. `status` (enum
`BountyStatus`) est la colonne pivot : chaque méthode du service vérifie sa valeur actuelle avant
d'agir, exactement comme une vraie machine à états, juste imposée en TypeScript applicatif
plutôt qu'en méthodes sur l'entité elle-même.

### 4. `apps/api/src/bounties/bounties.service.ts`
*Le fichier le plus dense du backend — 3 opérations d'écriture (`claim`/`resolve`/`rate`), une
seule vraiment atomique, et le piège TypeORM le plus important du projet documenté en
commentaire à l'endroit exact où il mord.*

- `claim()` : **une seule requête UPDATE conditionnelle** (`WHERE status='open' AND expiresAt >
  now() AND authorId != $1`), jamais un lire-puis-écrire — évite la course entre deux personnes
  qui réclament la même Bounty au même instant. Si `rows.length === 0`, une suite de vérifications
  séparées (`bounty.authorId === userId` ? `bounty.status !== OPEN` ?) sert **uniquement** à
  choisir le bon message d'erreur après coup — jamais à décider si l'action a réussi.
- **Piège TypeORM documenté lignes 114-119** : pour une requête mutante (`UPDATE ... RETURNING`),
  cette version de TypeORM renvoie un **tuple** `[rows, rowCount]`, pas directement le tableau de
  lignes comme pour un `SELECT` — `const [rows] = await this.bounties.query(...)` destructure ce
  tuple. Sans ce détail, `rows.length === 0` ne se déclenche jamais (le tuple entier a toujours
  une longueur de 2).
- `rate()` : SEUL l'auteur note (jamais la personne réclamante — elle ne juge pas sa propre
  aide), seulement si `status === RESOLVED`, et seulement si `ratingValue === null` — trois
  gardes séquentielles avant un `update()` classique (pas besoin d'atomicité ici : un seul
  utilisateur, l'auteur, peut jamais déclencher cette action, donc pas de vraie concurrence
  possible contrairement à `claim`).
- `materializeExpiry()` : pas de scheduler/cron (incompatible avec le scale-to-zero de
  l'hébergement, voir `docs/ARCHITECTURE.md`) — la bascule `open → expired` se fait à la LECTURE,
  appelée en tête de `findOne`/`findAll`/`claim`.

```ts
// lignes 120-126 : claim() - la requete atomique qui evite la race condition
const [rows] = await this.bounties.query<[Array<{ id: string }>, number]>(
  `UPDATE bounties
   SET status = 'claimed', "claimedById" = $1
   WHERE id = $2 AND status = 'open' AND "expiresAt" > now() AND "authorId" != $1
   RETURNING id`,
  [userId, bountyId],
);
```

**Trace d'exécution.** `BountiesController` appelle `claim(userId, bountyId)` sur un clic
utilisateur ; la requête part directement en base sans lecture préalable — si deux personnes
cliquent à la même milliseconde, PostgreSQL sérialise les deux `UPDATE` et un seul verra
`status='open'` encore vrai au moment de son exécution, l'autre récupère `rows.length === 0` et
reçoit un 409 Conflict via les vérifications de diagnostic qui suivent. Une fois `CLAIMED`,
`resolve()` (par l'auteur OU la personne réclamante, décision délibérée que les deux parties
puissent clôturer) fait passer `status` à `RESOLVED` — c'est SEULEMENT à partir de cet état que
`rate()` devient possible, et seulement pour l'auteur. `rawSelect()` (privée, en bas du fichier)
est le point de sortie commun à toutes ces méthodes : elle reconstruit un `BountyView` complet
(coordonnées via `ST_X`/`ST_Y`, noms d'utilisateurs joints) après chaque écriture — jamais de
retour partiel construit à la main.

### 5. `apps/api/src/sponsorship/sponsorship.service.ts`
*Le même pattern d'écriture atomique que l'entrée 4, appliqué cette fois à une vraie faille de
sécurité trouvée par un audit (`security-review`) et corrigée dans ce fichier — le commentaire
lignes 105-115 raconte l'histoire complète.*

- `applyDecision()` (privée, appelée par `approve()`/`reject()`) : **une seule requête UPDATE
  conditionnelle** — même construction que `claim()` (entrée 4), mais avec DEUX conditions de
  garde dans le même `WHERE` : `status = 'pending'` (la demande n'a pas déjà été tranchée) ET
  `"requesterId" != $2` (le vérificateur n'est pas le demandeur lui-même).
- **La faille corrigée** : sans la seconde condition, un compte au scope national pouvait
  approuver SA PROPRE demande de sponsoring — s'auto-certifier "sponsor vérifié" sans aucun
  contrôle tiers, alors qu'aucune passerelle de paiement externe ne rattrape ce cas derrière.
  Trouvée par l'agent d'audit avant tout déploiement, jamais exploitée en usage réel.
- `findApprovedPublic()` : la liste publique des sponsors approuvés ne retourne QUE `{id,
  description, requesterDisplayName}` — montant déclaré, URL de preuve et qui a vérifié sont
  délibérément absents de cette vue (données sensibles), contrairement à `findOne()` (réservée
  au demandeur ou à un vérificateur).
- Chaque méthode publique (`approve`/`reject`/`findPending`) commence par `await
  this.roles.requireVerifierScope(...)` (entrée 2) — jamais de vérification de rôle recopiée
  localement dans ce fichier.

```ts
// lignes 124-129 : la requete qui corrige la faille - deux conditions dans le meme WHERE
const [rows] = await this.requests.query<[Array<{ id: string }>, number]>(
  `UPDATE sponsorship_requests
   SET status = $1, "reviewedById" = $2, "reviewedAt" = now(), "rejectionReason" = $3
   WHERE id = $4 AND status = 'pending' AND "requesterId" != $2
   RETURNING id`,
  [status, verifierId, rejectionReason, id],
);
```

**Trace d'exécution.** `SponsorshipController.approve` appelle `approve(verifierId, id)`, qui
vérifie d'abord le scope (`requireVerifierScope`, entrée 2) puis délègue à `applyDecision`. La
requête part directement en base — si le vérificateur cible sa propre demande, la clause
`"requesterId" != $2` la rend fausse pour TOUTE ligne, `rows.length === 0`, et le code de
diagnostic qui suit (lignes 132-144) distingue ce cas précis (`request.requesterId ===
verifierId` → 403 Forbidden) d'une demande déjà traitée par quelqu'un d'autre (→ 409 Conflict).
Cette structure — une requête atomique qui encode TOUTES les règles métier dans son `WHERE`, puis
un bloc de diagnostic séparé qui ne sert qu'à choisir le bon message d'erreur — est exactement le
même pattern que `BountiesService.claim()` (entrée 4), documenté explicitement comme tel en
commentaire ligne 105 pour qu'un futur ajout similaire le réutilise plutôt que de réinventer un
lire-puis-écrire vulnérable.

---

## B. Backend — persistance, migrations

### 6. `apps/api/src/database/data-source.ts` + `apps/api/src/database/migrations/1788513325966-AddSponsorshipRequests.ts`
*Comment le schéma SQL est versionné explicitement — jamais deviné par un `synchronize: true`
en production.*

- `data-source.ts` : un `DataSource` TypeORM **autonome**, distinct de `database.module.ts` (qui
  configure TypeORM via `TypeOrmModule.forRootAsync()` DANS le contexte Nest). Le CLI de
  migration tourne HORS de ce contexte — pas d'accès à `ConfigService`, donc `.env` chargé
  directement via `dotenv/config`, et entités/migrations listées par glob plutôt que par
  `autoLoadEntities` (qui dépend du scan de modules Nest).
- `synchronize: false` **toujours**, avec un commentaire explicite : le CLI ne doit jamais
  auto-appliquer un changement de schéma en douce, seulement via des migrations écrites et
  relues.
- La migration `AddSponsorshipRequests` : `up()`/`down()` symétriques (créer/détruire dans
  l'ordre inverse — l'`ENUM` custom PostgreSQL est créé en premier, détruit en dernier, parce que
  la table qui l'utilise en dépend). Un `CREATE INDEX` sur `status` — même logique que les index
  déjà posés sur `cityId` : accélère la file d'attente du vérificateur qui filtre `WHERE status =
  'pending'`.
- **Écart de convention assumé et documenté** (lignes 8-14 de la migration) : les contraintes
  (`PK_...`, `FK_...`) sont nommées explicitement plutôt que par le hash auto-généré par
  TypeORM utilisé dans les migrations précédentes — `migration:generate` proposera un diff de
  renommage sans effet fonctionnel la prochaine fois. Décision : gardé tel quel (plus lisible)
  avec ce commentaire plutôt que deviné/"corrigé" à l'aveugle.

```ts
// data-source.ts, lignes 11-19 : DataSource CLI autonome, jamais synchronize
export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
});
```

**Trace d'exécution.** `npm run migration:run` (côté `apps/api`) charge ce `data-source.ts`,
compare les migrations déjà appliquées (table interne `migrations`) à celles présentes dans le
dossier, et exécute `up()` sur celles qui manquent, dans l'ordre du timestamp préfixant leur nom
de fichier (`1787614455991-Baseline.ts` avant `1788513325966-AddSponsorshipRequests.ts`, par
exemple). Chaque entité TypeORM (`Bounty`, entrée 3 ; `SponsorshipRequest`) doit avoir une
migration correspondante écrite à la main — créer une colonne sur l'entité seule ne change RIEN
en base tant que la migration n'existe pas et n'a pas été exécutée, piège classique pour qui
découvre TypeORM après avoir connu `synchronize: true` en développement.

---

## C. Frontend (Next.js / React) — pont API, audio, carte, styles

### 7. `apps/web/src/lib/api.ts`
*Le plus court fichier de cette liste — et pourtant le SEUL endroit du front qui sait parler au
backend. Toute requête HTTP de l'application passe par cette fonction.*

- `apiFetch<T>(path, { token, headers, ...options })` : générique TypeScript — l'appelant précise
  le type de retour attendu (`apiFetch<BountyView>(...)`), pas de `any` implicite.
- Construction des headers **conditionnelle** : `Content-Type: application/json` ajouté
  SEULEMENT si `options.body` existe (une requête `GET` n'en a pas besoin), `Authorization:
  Bearer ...` ajouté SEULEMENT si `token` est fourni — deux spreads conditionnels plutôt qu'un
  objet toujours complet.
- `ApiError extends Error` avec un `status: number` public : permet à l'appelant de distinguer un
  403 d'un 409 sans reparser le message (`catch (err) { if (err instanceof ApiError &&
  err.status === 409) ... }`), pattern utilisé dans `BountyDetail.tsx` pour afficher le bon
  message selon le code retourné par `claim()`/`rate()` (entrée 4).
- `res.status === 204 → return undefined as T` : gère explicitement le cas "succès sans corps"
  (ex. une action qui ne renvoie rien) plutôt que de laisser `res.json()` planter sur un corps
  vide.

```ts
// lignes 24-31 : construction des headers, deux spreads conditionnels
const res = await fetch(`${API_URL}${path}`, {
  ...options,
  headers: {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  },
});
```

**Trace d'exécution.** Chaque composant qui a besoin de données backend (`BountyDetail`,
`sponsoring/page.tsx`, `CreateSheet`...) appelle `apiFetch(path, { token })` plutôt que `fetch()`
directement — le token vient de `auth-context.tsx` (contexte React qui garde le JWT en mémoire).
Une erreur HTTP (`!res.ok`) est systématiquement transformée en `ApiError` AVANT de remonter à
l'appelant : `body?.message` peut être une chaîne (erreur simple) ou un tableau (plusieurs
erreurs de validation `class-validator` côté NestJS) — `Array.isArray(...) ? .join(", ") : ...`
normalise les deux formes en une seule chaîne lisible, affichée telle quelle dans l'UI.

### 8. `apps/web/src/lib/audio-context.tsx`
*Le fichier le plus retravaillé de la session — musique de fond en boucle SANS à-coup audible au
point de bouclage, via l'API Web Audio bas niveau plutôt qu'un simple `<audio loop>`.*

- `LoopEngine` (classe, pas un hook) : chaîne de routage à DEUX gains séparés — un `cycleGain`
  par cycle de lecture (forme le fondu entrée/sortie AU POINT DE BOUCLE) connecté à un
  `masterGain` UNIQUE et partagé (niveau utilisateur × ducking). Séparer les deux permet de
  changer le niveau maître INSTANTANÉMENT (ducking à l'ouverture d'une sheet) sans attendre la
  fin du cycle en cours.
- `play(url)` : programme un cycle qui s'auto-relance — `cycleGain.gain` monte de 0 à 1 sur
  `LOOP_FADE_SECONDS` (1.5s), reste à 1, puis redescend à 0 juste avant la fin ; un
  `setTimeout(() => startCycle(), (duration - fade) * 1000)` démarre le CYCLE SUIVANT un peu
  avant que le précédent ne se termine — c'est ce chevauchement qui produit un vrai fondu enchaîné
  (crossfade) plutôt qu'un saut sec à 0:00.
- **Piège navigateur mobile documenté en détail (lignes 229-252)** : `pointerdown` se déclenche
  AVANT `touchend` dans un tap tactile, mais `pointerdown` seul est peu fiable pour débloquer un
  `AudioContext` sur WebKit/iOS. Une version précédente retirait tous les écouteurs dès le
  PREMIER événement reçu — donc `pointerdown` "consommait" le geste et désactivait `touchend`
  (le fiable) avant qu'il n'ait sa chance. Corrigé en retirant `pointerdown` de la liste ET en ne
  désabonnant les écouteurs qu'après vérification réelle que `ctx.state === "running"`.
- `TRACKS` : un objet simple `{ calm: "...", urgent: "..." }` — remplacer la musique ne touche
  QUE cette table, jamais la logique de `LoopEngine` elle-même (vérifié en pratique le
  2026-09-05 : changer de morceau = une seule ligne changée, voir historique git).

```ts
// lignes 152-159 : le coeur du crossfade - deux rampes de gain qui se chevauchent d'un cycle a l'autre
const now = ctx.currentTime;
cycleGain.gain.setValueAtTime(0, now);
cycleGain.gain.linearRampToValueAtTime(1, now + fade);
cycleGain.gain.setValueAtTime(1, now + duration - fade);
cycleGain.gain.linearRampToValueAtTime(0, now + duration);
```

**Trace d'exécution.** `AudioProvider` enveloppe toute l'application (`layout.tsx`). Un premier
`useEffect` précharge la piste dès le montage (juste un `fetch`, pas besoin de geste utilisateur).
Un second `useEffect` pose des écouteurs `touchend`/`click`/`keydown` sur `window` : au premier
geste réel, `attemptUnlock` appelle `engine.play(src)` de façon SYNCHRONE dans le handler natif —
c'est la contrainte des navigateurs mobiles (démarrer/reprendre l'audio ne "compte" comme
déclenché par un geste que si c'est appelé directement dans le gestionnaire, jamais depuis un
`useEffect` qui réagit à un changement d'état React après coup). Une fois débloqué
(`hasInteracted = true`), les changements ultérieurs (mute/demute via `MuteToggle`, changement de
`mood`) passent par un troisième `useEffect`, cette fois légitime puisqu'il ne s'agit plus de
consommer un geste initial.

### 9. `apps/web/src/components/MoroccoMap.tsx`
*Carte SVG faite à la main plutôt qu'une librairie de tuiles — remplace une carte interactive
(MapLibre) qui ne s'affichait pas de façon fiable (voir `.claude/HANDOFF/LOG.md`). Zéro
dépendance réseau externe.*

- `tierFor(count)` : discrétise un effectif réel (`CityGeo.members`, source cestom.org) en 3
  paliers via une échelle `Math.sqrt` plutôt que linéaire — 220 vs 30 membres donnerait un ratio
  brut de 7.3x qui écraserait visuellement les petites villes ; la racine carrée ramène ce ratio
  à ~2.7x. 3 paliers discrets plutôt qu'une interpolation continue : un cercle 17% plus grand
  qu'un autre ne "se voit" pas comme tel à l'œil, quelques paliers nettement distincts si.
- `colorFor(count)` : ajouté le 2026-09-05 (retour utilisateur "la carte fait mal aux yeux",
  entièrement orange auparavant) — 3 couleurs de la palette de marque par palier de taille
  (vert/or/terracotta), le rouge volontairement exclu (déjà associé à "alerte" ailleurs dans
  l'app).
- `<g role="button" tabIndex={0} onKeyDown={...}>` sur chaque ville plutôt qu'un simple `onClick`
  : un `<g>` SVG sans ça n'est ni focusable ni activable au clavier — gap d'accessibilité réel
  identifié en revue, corrigé en ajoutant l'équivalent clavier (`Enter`/`Espace`) de l'événement
  `onClick`.
- `isTop` (un seul, jamais plus) : la ville au plus grand effectif reçoit un anneau doré
  pointillé en plus de sa couleur de palier — au-delà de 1-2 points de mise en avant, la
  hiérarchie visuelle s'effondre (tout devient "important" donc plus rien ne l'est).

```tsx
// lignes 49-58 : discretisation en palier via une echelle sqrt, pas lineaire
const tierFor = (count: number): 0 | 1 | 2 => {
  if (maxCount === minCount) return 1;
  const t =
    (Math.sqrt(count) - Math.sqrt(minCount)) /
    (Math.sqrt(maxCount) - Math.sqrt(minCount));
  if (t < 1 / 3) return 0;
  if (t < 2 / 3) return 1;
  return 2;
};
```

**Trace d'exécution.** `CITIES` (importé de `morocco-geo.ts`) est une liste statique de 6 villes
réelles avec leurs coordonnées `x/y` déjà positionnées sur le `viewBox` du contour du Maroc.
Pour chaque ville, `tierFor`/`radiusFor`/`colorFor` dérivent taille et couleur du cercle
directement de `city.members` — aucun état serveur à charger pour afficher la carte elle-même
(seul le clic sur une ville déclenche `onSelectCity`, qui remonte à `CityOverview.tsx` pour
charger les Pins/Bounties de cette ville précise). Le SVG entier est statique/inline, donc
"instantané" au sens où l'utilisateur l'a explicitement demandé — pas de tuiles à charger, pas de
style distant à résoudre.

### 10. `apps/web/src/app/globals.css`
*Le fichier où s'est niché le bug le plus sérieux trouvé cette session — un texte de bouton
littéralement invisible sans survol, à cause d'un détail de CSS Cascade Layers que Tailwind v4
rend facile à rater.*

- `@theme inline { --color-terracotta: var(--terracotta); ... }` : Tailwind v4 génère ses
  classes utilitaires (`bg-terracotta`, `text-terracotta-ink`...) à partir de CETTE section, pas
  d'un fichier de config JS séparé (rupture avec Tailwind v3) — les vraies valeurs de couleur
  (`oklch(...)`) sont définies une seule fois dans `:root`, puis référencées ici.
- **Le bug (lignes 47-76)** : `a { color: var(--terracotta) }` / `a:hover { color: var(--ink) }`
  étaient écrits HORS de tout `@layer` — dans CSS Cascade Layers, le bucket "non calqué"
  l'emporte TOUJOURS sur `@layer utilities` (où vivent les classes Tailwind), quelle que soit la
  spécificité calculée. Conséquence réelle : un `<Link>` stylisé en bouton
  (`bg-terracotta text-terracotta-ink`) voyait son texte écrasé en `--terracotta` — même couleur
  que le fond, texte invisible — et seul `:hover` (plus spécifique, mais toujours dans le même
  bucket non calqué) révélait le texte en `--ink`.
- Le correctif : déplacer ces règles dans `@layer base`, qui passe AVANT `@layer utilities` dans
  l'ordre déclaré par Tailwind v4 (`theme`, `base`, `components`, `utilities`) — une classe
  utilitaire explicite (`text-terracotta-ink`) surclasse alors correctement une règle de base
  générique (`a { color }`), comme n'importe quel développeur s'y attendrait.
- `.mc-logo-spin` (dans `@layer components`) : ciblée par CLASSE plutôt que par ID — le composant
  `MindClashMark` a des `id` SVG internes (`mc-pin-grad`/`mc-pin-mask`) dupliqués s'il est monté
  plusieurs fois sur une même page (Header + WelcomeIntro simultanément), une règle scopée par ID
  aurait pu casser silencieusement sur la seconde instance.

```css
/* lignes 58-76 : le fix - ces regles DOIVENT rester dans @layer base, jamais hors layer */
@layer base {
  body {
    background: var(--bg);
    color: var(--ink);
    font-family: var(--font-body);
  }

  a {
    color: var(--terracotta);
  }
  a:hover {
    color: var(--ink);
  }
}
```

**Trace d'exécution.** Ce bug était invisible à TOUS les outils utilisés jusque-là dans ce projet
— `npm run lint`, `npx tsc --noEmit`, les tests HTTP contre l'API, même une vérification SSR par
`curl` (le HTML rendu contient bien la bonne classe `text-terracotta-ink`, le problème est un
comportement de RENDU du navigateur, invisible dans le HTML brut). Il n'a été trouvé qu'à la
toute première vraie inspection visuelle du projet (extension Claude in Chrome, retour
utilisateur direct "il faut hover pour voir ce qui est écrit"). Leçon retenue explicitement dans
`.claude/HANDOFF/NEXT_SESSION.md` : lint/tsc/tests/SSR au vert ne garantissent RIEN sur le rendu
visuel réel — un outil de rendu réel doit être utilisé AVANT d'annoncer un incrément visuel
"vérifié", pas après.

---

## Comment lancer les serveurs toi-même

Trois terminaux séparés, à laisser ouverts (chacun bloque le terminal tant qu'il tourne) :

**1. Base de données** (Docker Desktop doit être lancé) :
```powershell
docker compose -f infra/docker-compose.yml up -d
```
`-d` = en arrière-plan, ce terminal-là peut être fermé après cette commande.

**2. API** (NestJS, port 3001) :
```powershell
cd apps/api
npm run start:dev
```

**3. Web** (Next.js, port 3000) :
```powershell
cd apps/web
npm run dev
```

Ensuite : http://localhost:3000 dans le navigateur (ou l'IP LAN affichée par Next.js, ex.
`http://192.168.11.142:3000`, pour tester depuis un téléphone sur le même Wi-Fi).

Pour arrêter : `Ctrl+C` dans chaque terminal API/Web ; `docker compose -f infra/docker-compose.yml
stop` pour la base (garde les données ; `down` au lieu de `stop` les efface).
