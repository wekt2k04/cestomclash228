# Top 15 fichiers maîtres — guide de lecture fichier par fichier

*Sur le modèle d'un document équivalent utilisé pour un autre projet (stage été 2026) : liste les
fichiers SOURCE à ouvrir toi-même, un par un, dans cet ordre, chacun avec ce qu'on y trouve
(méthodes, syntaxe piégeuse, variables clés) + un mini-extrait du passage le plus important.
Objectif : que tu puisses ouvrir chaque fichier dans l'IDE en le lisant et retrouver
immédiatement ce dont il est question, puis le recopier à la main pour ancrer l'architecture.*

**Rédigé le 2026-09-05**, chaque fichier relu intégralement le jour même (pas recopié de
mémoire) — conforme à la règle du projet "vérifier, ne jamais supposer"
(`CLAUDE.md` §5). CestomClash228 est un projet à 2 process (API NestJS + Web Next.js) plutôt que
la solution .NET monolithique du document de référence — la moitié des entrées est donc côté
backend, l'autre côté frontend, pour couvrir les DEUX bouts de la chaîne plutôt qu'un seul.

**Étendu le 2026-09-11** (10→15) : le marketplace payant (offres/confiance/paiement/chat,
`apps/api/src/bounty-interests/` + `apps/api/src/chat/`) construit le 2026-09-10 n'existait pas
encore le 2026-09-05, date de la première version de ce document — 5 nouvelles entrées (11-15,
section D) couvrent ce sous-système, chacune relue intégralement le jour de l'ajout, pas recopiée
d'une autre version. Délibérément pas QUE de la logique métier : 11-13 sont business logic
(marché de confiance, filtre anti-désintermédiation, géolocalisation), mais 14-15 couvrent deux
autres familles de "fichier cœur" — l'architecture frontend partagée (14, `DetailSheet.tsx`) et
la fiabilité du point d'entrée backend (15, `main.ts`) — pour montrer les DEUX bouts de la chaîne,
pas seulement la couche métier. Les entrées 1-10 sont inchangées, encore exactes telles quelles.

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
| 11 | `apps/api/src/bounty-interests/bounty-interests.service.ts` + migration | Le marché de confiance payant — plusieurs offres, une seule retenue, même sous accès concurrent |
| 12 | `apps/api/src/common/contact-filter.ts` | Filtre anti-désintermédiation — protège le modèle économique en 30 lignes |
| 13 | `apps/api/src/cities/cities.service.ts` | Le "géolocalisé" du pitch, en vrai — plus proche voisin PostGIS |
| 14 | `apps/web/src/components/DetailSheet.tsx` | Le wrapper de panneau partagé — toute la mécanique de présentation à un seul endroit |
| 15 | `apps/api/src/main.ts` | Le point d'entrée — pourquoi un échec de démarrage ne doit jamais être silencieux |

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
- `rate()` : qui note qui dépend de `kind` (ajouté avec le marketplace payant, entrée 11) — pour
  une **demande** (REQUEST) l'auteur note qui l'a aidé (comportement historique) ; pour une
  **offre** (OFFER) c'est l'inverse, le client (`claimedById`) note le prestataire — inverser
  cette règle ferait noter le client par le prestataire, l'opposé de ce qui construit une
  réputation utile.
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
retour partiel construit à la main. `claim()` est le chemin GRATUIT de mise en relation ; son
pendant payant, `confirmPayment()` (entrée 11), écrit la même transition `status='claimed'` par
une requête quasi identique — les deux convergent vers le même point, donc `resolve()`/`rate()`
fonctionnent SANS AUCUNE modification pour une Bounty payante.

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
même pattern que `BountiesService.claim()` (entrée 4) et que `BountyInterestsService.accept()`
(entrée 11), documenté explicitement comme tel en commentaire ligne 105 pour qu'un futur ajout
similaire le réutilise plutôt que de réinventer un lire-puis-écrire vulnérable.

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
de fichier (`1787614455991-Baseline.ts` avant `1788513325966-AddSponsorshipRequests.ts`, avant
`1788700000000-AddBountyInterestsAndChat.ts`, entrée 11). Chaque entité TypeORM (`Bounty`, entrée
3 ; `SponsorshipRequest` ; `BountyInterest`, entrée 11) doit avoir une migration correspondante
écrite à la main — créer une colonne sur l'entité seule ne change RIEN en base tant que la
migration n'existe pas et n'a pas été exécutée, piège classique pour qui découvre TypeORM après
avoir connu `synchronize: true` en développement.

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
- `POLL_INTERVAL_MS = 20_000` (ajouté avec le marketplace payant, entrée 11) : constante unique,
  réutilisée telle quelle par `CityPanel`, `sponsoring`, `bounties`, `pins` et `BountyChat` —
  choix délibéré de polling plutôt que WebSocket, un hébergement backend gratuit ne tenant pas des
  connexions persistantes à l'échelle. Le pattern `{quiet?: boolean}`, répété partout où ce
  polling a été ajouté, évite qu'un échec de poll en arrière-plan fasse basculer l'écran en état
  d'erreur — seul un rechargement demandé par l'utilisateur peut en afficher une.

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
normalise les deux formes en une seule chaîne lisible, affichée telle quelle dans l'UI. Chaque
écriture atomique côté backend (entrées 4, 5, 11) ne devient visible pour un AUTRE utilisateur
qu'au prochain tick de `POLL_INTERVAL_MS` — jamais poussée, latence perçue de quelques secondes
assumée contre zéro connexion persistante à faire tourner.

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
- **Depuis le marketplace payant (2026-09-10)** : les compteurs affichés viennent maintenant de
  `counts` (Pins+Bounties RÉELS par ville, via `useCityActivityCounts()` dans `CityOverview.tsx`)
  et non plus de `CityGeo.members` (effectif CESTOM statique) — l'ancien effectif reste affiché,
  mais relégué à un `<footer>` repliable, clairement distingué de l'activité réelle sur la
  plateforme.

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
réelles avec leurs coordonnées `x/y` déjà positionnées sur le `viewBox` du contour du Maroc —
dérivées à l'origine par plus-proche-voisin (voir `cities.service.ts`, entrée 13) côté backend,
figées côté frontend pour l'affichage. Pour chaque ville, `tierFor`/`radiusFor`/`colorFor`
dérivent taille et couleur du cercle directement du compte reçu en props — aucun état serveur à
charger pour afficher la carte elle-même (seul le clic sur une ville déclenche `onSelectCity`, qui
remonte à `CityOverview.tsx` pour charger les Pins/Bounties de cette ville précise). Le SVG entier
est statique/inline, donc "instantané" au sens où l'utilisateur l'a explicitement demandé — pas de
tuiles à charger, pas de style distant à résoudre.

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
- `.btn-primary` (retouché le 2026-09-11) : `min-height: 2.75rem` + `display: inline-flex` ajoutés
  après un audit de rendu mobile bas de gamme — le padding+texte seuls retombaient à ~42px, sous
  la cible tactile recommandée de 44px (WCAG 2.5.5).

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
"vérifié", pas après. Même leçon retrouvée le 2026-09-11 avec `DetailSheet.tsx` (hors de ce
fichier) : plafond de hauteur manquant, invisible aux mêmes outils, trouvé par un audit dédié.

---

## D. Marketplace payant — confiance, paiement, anti-désintermédiation

*Sous-système construit le 2026-09-10, absent de la première version de ce document. Suite
directe des entrées 4 (Bounty gratuite) et 7 (polling) — à lire après elles, pas isolément.*

### 11. `apps/api/src/bounty-interests/bounty-interests.service.ts` + migration `1788700000000-AddBountyInterestsAndChat.ts`
*Le marché de confiance payant : plusieurs candidats proposent leur aide, l'auteur choisit sur la
base d'une réputation CALCULÉE (jamais déclarée), et l'acceptation reste correcte même si deux
acceptations arrivent au même instant — pas seulement "en pratique", vérifié par un vrai test de
concurrence forcée.*

- `expressInterest()` : trois gardes avant d'écrire — Bounty gratuite rejetée
  (`priceMad === null`, le chemin `claim()` direct existe déjà, entrée 4), auto-proposition
  rejetée, Bounty non-`open` rejetée. La contrainte unique `(bountyId, userId)` en base rattrape
  ensuite un double-clic quasi simultané de la MÊME personne (`23505` intercepté → 409 propre).
- `deriveTrustBadge(completedCount, averageRating)` : fonction pure, 3 seuils volontairement
  simples (`nouveau`/`actif`/`fiable`) — pas un score composite à 5 facteurs. Les deux entrées
  viennent d'une agrégation SQL (`COUNT`/`AVG FILTER`) sur l'historique RÉEL de Bounties résolues
  où ce candidat était `claimedById` : aucune nouvelle colonne de profil éditable sur `User`.
- **Le piège de concurrence du fichier, dans `accept()`** : un simple `WHERE status='pending'`
  protège contre la réacceptation de LA MÊME ligne, mais PAS contre l'acceptation concurrente de
  DEUX propositions différentes pour la même Bounty — ce sont deux lignes distinctes, aucun verrou
  naturel entre elles. Résolu par un **index unique PARTIEL** Postgres posé dans la migration
  (`WHERE status = 'accepted'`) : la deuxième acceptation concurrente lève une violation `23505`,
  interceptée comme un 409 propre plutôt qu'un état incohérent en base.
- `confirmPayment()` : exige `proofImageUrl IS NOT NULL` DANS la condition `WHERE` de la requête
  elle-même — pas seulement une vérification en amont, impossible de confirmer un paiement sans
  preuve même par un appel direct à l'API.

```ts
// migration : une seule proposition ACCEPTED par Bounty, garanti par Postgres lui-meme
CREATE UNIQUE INDEX "UQ_bounty_interests_one_accepted_per_bounty"
  ON bounty_interests ("bountyId") WHERE status = 'accepted';

// service, accept() : le WHERE protege contre une double-acceptation de LA MEME ligne ;
// l'index protege contre l'acceptation concurrente de DEUX offres differentes -
// un WHERE seul ne le pourrait pas, ces 2 UPDATE portant sur des lignes differentes.
try {
  const [rows] = await this.interests.query<[Array<{ id: string }>, number]>(
    `UPDATE bounty_interests SET status = 'accepted'
     WHERE id = $1 AND status = 'pending' RETURNING id`,
    [interestId],
  );
} catch (err) {
  if (isUniqueViolation(err)) {
    throw new ConflictException('Une autre proposition a déjà été acceptée pour cette Bounty.');
  }
}
```

**Trace d'exécution.** `confirmPayment()` est le point de convergence avec `claim()` (entrée 4) :
même transition `bounties.status='claimed'`, déclenchée depuis un fichier différent selon que la
Bounty est gratuite ou payante — `resolve()`/`rate()` (toujours entrée 4) n'ont besoin d'AUCUNE
modification pour fonctionner sur ce chemin payant. C'est aussi seulement à partir de
`confirmPayment()` que `ensureConversationForBounty()` (module `chat`) active le chat — dont le
filtre anti-coordonnées (entrée 12) n'a de sens que parce que ce fichier a déjà fait tout le
travail de confiance AVANT d'ouvrir le canal. Vérifié le 2026-09-10 par un test e2e de concurrence
forcée (`Promise.allSettled` sur deux appels `accept()` strictement parallèles) : exactement
1×200/1×409, jamais deux propositions acceptées pour la même Bounty.

### 12. `apps/api/src/common/contact-filter.ts`
*Le fichier le plus court de cette liste, et pourtant celui qui protège le plus directement le
modèle économique — empêche deux utilisateurs de sortir la relation de la plateforme avant qu'une
transaction soit confirmée.*

- Rejet NET (400), jamais une rédaction silencieuse du message — la personne sait immédiatement
  pourquoi son message n'est pas parti, ne pense pas que ça a marché et ne le renvoie pas
  autrement (SMS, etc.) en pensant avoir contourné le filtre.
- Motifs délibérément CIBLÉS plutôt qu'un simple `\d{2,}` générique : une heure de rendez-vous
  ("15h30") ou un numéro de chambre ("chambre 204") ne déclenchent pas le filtre — comportement
  vérifié explicitement par `contact-filter.spec.ts`, pas juste espéré.
- `PHONE_PATTERN` reconnaît le format marocain (`+212`/`0`, préfixe 5-7, 9 chiffres) OU togolais
  (`+228`, 8 chiffres) dans le même motif — la communauté cible est structurellement bi-nationale
  (étudiants togolais AU Maroc), le filtre l'est donc aussi.
- `MESSAGING_KEYWORD_PATTERN` : liste de mots-clés (whatsapp, telegram, instagram...) plutôt
  qu'une détection d'URL générique — bloque l'INTENTION de rediriger vers un autre canal, pas
  seulement un lien technique.

```ts
// Telephone marocain/togolais, email, mots-cles de messagerie -
// volontairement pas un simple \d{2,} (bloquerait "15h30", "chambre 204")
const PHONE_PATTERN =
  /(?:\+212|0)[\s.-]?[5-7](?:[\s.-]?\d){8}|\+228[\s.-]?(?:\d[\s.-]?){8}/;
const EMAIL_PATTERN = /[\w.+-]+@[\w-]+\.[a-z]{2,}/i;
const MESSAGING_KEYWORD_PATTERN =
  /\b(whatsapp|wa\.me|telegram|t\.me|instagram|insta|snapchat|snap|facebook|messenger|imo)\b/i;

export function containsContactInfo(text: string): boolean {
  return PHONE_PATTERN.test(text) || EMAIL_PATTERN.test(text)
      || MESSAGING_KEYWORD_PATTERN.test(text);
}
```

**Trace d'exécution.** `ChatService.postMessage` (module `chat`, appelé par `BountyChat.tsx` côté
front) passe chaque message par `containsContactInfo()` avant de l'écrire en base — un message qui
matche est rejeté en 400, jamais stocké. Ce filtre n'entre en jeu qu'APRÈS que
`bounty-interests.service.ts` (entrée 11) a fait tout le travail de confiance : proposition,
sélection, preuve, confirmation. Avant ce point précis dans le cycle de vie d'une Bounty payante,
il n'y a simplement pas de chat à filtrer — la relation n'existe pas encore.

### 13. `apps/api/src/cities/cities.service.ts`
*Le "géolocalisé" du pitch, concrètement : chaque Pin/Bounty est rattaché à sa ville par
plus-proche-voisin réel via PostGIS, pas une zone dessinée à la main ni une liste statique.*

- `SEED_CITIES` : les 6 vraies villes où la CESTOM a une section (source vérifiée cestom.org,
  capture d'écran du 2026-08-31) — remplace une ancienne liste de 12 villes marocaines génériques
  jamais vérifiées contre la présence CESTOM réelle.
- `onModuleInit()` s'auto-répare : si une ville existe déjà en base sans `centerPoint` (donnée
  historique incomplète), il la complète au démarrage plutôt que d'exiger une migration manuelle
  — idempotent, relançable sans effet de bord sur un redéploiement.
- `findNearest(lat, lng)` : opérateur PostGIS `<->` (plus proche voisin), appuyé sur un index
  spatial GiST posé par la migration `AddSpatialIndexes` — avant cet index, ce chemin faisait un
  **scan séquentiel complet** de la table `cities` à CHAQUE création de Pin/Bounty, trouvé et
  corrigé lors d'une revue d'architecture le 2026-08-25.
- Une seule fonction fait autorité sur "de quelle ville s'agit-il" — jamais recalculée
  différemment ailleurs dans le code, condition explicitement posée dans `docs/ARCHITECTURE.md`
  pour que le RBAC spatial (entrée 2) et le regroupement par ville ne divergent jamais
  silencieusement.

```ts
// Operateur PostGIS <-> = plus proche voisin, appuye sur un index spatial GiST -
// avant cet index, ce chemin faisait un scan complet de la table a CHAQUE
// creation de Pin/Bounty (trouve en revue d'architecture, corrige).
async findNearest(lat: number, lng: number): Promise<City | null> {
  const rows: Array<{ id: string; name: string }> = await this.cities.query(
    `SELECT id, name FROM cities
     WHERE "centerPoint" IS NOT NULL
     ORDER BY "centerPoint" <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
     LIMIT 1`,
    [lng, lat],
  );
  if (!rows[0]) return null;
  return this.findById(rows[0].id);
}
```

**Trace d'exécution.** Appelé directement par `bounties.service.ts.create()` (entrée 4, ligne
58) : `const city = await this.cities.findNearest(dto.lat, dto.lng)` — jamais de ville choisie à
la main côté client. Le même mécanisme dérive la ville d'un Pin. Le résultat alimente ensuite
`MoroccoMap.tsx` (entrée 9) côté frontend, qui affiche les 6 villes déjà positionnées sur son
`viewBox` — la géométrie réelle (PostGIS) et l'affichage (SVG statique) restent deux couches
séparées, reliées uniquement par le nom de ville, jamais par une coordonnée recalculée en double.

### 14. `apps/web/src/components/DetailSheet.tsx`
*Pas de la logique métier — l'architecture frontend qui rend tout le reste possible. Un seul
wrapper de panneau, partagé par `CityPanel`/`CreateSheet`/`PinDetail`/`BountyDetail` (et donc par
les entrées 11-12 quand elles s'affichent) : scrim, cible tactile de fermeture, intégration au
bouton retour navigateur, ducking audio — tout défini UNE fois, jamais dupliqué par sheet.*

- `onCloseRef` : une ref "toujours à jour" plutôt que `onClose` directement en dépendance
  d'effet — **bug réel corrigé le 2026-09-09** : `onClose` est très souvent une fonction fléchée
  EN LIGNE côté appelant, recalculée à chaque render (y compris un simple rafraîchissement de
  polling, entrée 7) — ce qui rejouait `history.back()` PUIS `pushState()` bien plus souvent que
  la vraie ouverture/fermeture, corrompant la pile d'historique du navigateur de façon
  reproductible (clic sur une Bounty atterrissant sur une tout autre page déjà visitée). Le ref se
  met à jour via son PROPRE effet, jamais assigné en cours de rendu (interdit par le linter React
  du projet, `react-hooks/refs`).
- `scrollLockCount` : compteur **module-level**, pas un simple booléen — verrou de scroll du
  `<body>` refcounté, robuste si deux sheets se chevauchaient un jour (pas le cas aujourd'hui,
  mais un booléen simple réactiverait le scroll prématurément si une 2e sheet se fermait avant la
  1re).
- **Correctif du 2026-09-11, trouvé par un audit de rendu mobile bas de gamme** : cette carte
  n'avait ni plafond de hauteur ni défilement propre — sur un écran court avec du contenu dense
  (exactement le cas des entrées 11-12 empilées dans `BountyDetail`), le haut du panneau, bouton
  de fermeture inclus, pouvait déborder hors écran sans aucun moyen d'y accéder. Corrigé en
  sortant le bouton de fermeture de la zone de défilement et en plafonnant le reste à `85dvh`.
- `confirmClose` optionnel : seul `CreateSheet` le passe (saisie non enregistrée à protéger) — les
  sheets en lecture seule n'ont rien à y perdre et ne le passent pas.

```tsx
// le ref "toujours a jour", pattern qui evite de corrompre l'historique navigateur
const onCloseRef = useRef(onClose);
useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

useEffect(() => {
  window.history.pushState({ mindclashSheet: true }, "");
  const onPopState = () => onCloseRef.current();
  window.addEventListener("popstate", onPopState);
  return () => window.removeEventListener("popstate", onPopState);
}, []); // volontairement [] - ne doit s'executer qu'au vrai montage/demontage
```

**Trace d'exécution.** Quand `BountyDetail.tsx` affiche `BountyInterestsPanel`/`BountyChat`
(entrée 11), c'est CE wrapper qui les enveloppe déjà, sans qu'aucun de ces composants n'ait à
réimplémenter scrim/fermeture/historique. La leçon du bug de 2026-09-09 dépasse ce fichier : elle
explique pourquoi `POLL_INTERVAL_MS` (entrée 7) est dangereux à mélanger avec une prop `onClose`
mal mémoïsée n'importe où dans l'app, pas seulement ici. Le correctif du 2026-09-11, lui, protège
concrètement les écrans les plus denses ajoutés avec le marketplace payant — sans lui, une Bounty
avec plusieurs propositions reçues (entrée 11) pouvait rendre son propre bouton de fermeture
inatteignable sur un petit écran.

### 15. `apps/api/src/main.ts`
*Pas de la logique métier non plus — le point d'entrée du process lui-même. Chaque fichier de ce
document ne s'exécute QUE parce que ce fichier a démarré avec succès en premier.*

- `NestFactory.create` + `helmet()` + CORS en liste blanche (`WEB_ORIGIN` séparé par virgules,
  ouvre simultanément localhost et l'IP LAN sans désactiver CORS) + `ValidationPipe` global
  (`whitelist`/`forbidNonWhitelisted`/`transform`) — toute la configuration transversale de l'API
  vit dans ce seul fichier, avant que le moindre contrôleur ne reçoive une requête.
- **Correctif du 2026-09-11, trouvé en vérifiant l'état réel de prod ("veiller à ce que les
  serveurs ne crachent silencieusement")** : `void bootstrap()` seul avalait silencieusement tout
  échec de démarrage (variable d'environnement manquante, base injoignable) — Node plantait sans
  trace exploitable.
- Deux handlers globaux ajoutés, `process.on('uncaughtException')` et
  `process.on('unhandledRejection')` : l'objectif n'est PAS d'empêcher le crash (un redémarrage
  propre par Render reste correct pour un service sans état) — seulement de garantir qu'il est
  TOUJOURS journalisé clairement avant, plutôt qu'un plantage muet.
- `bootstrap().catch(...)` remplace `void bootstrap()` : le même principe appliqué spécifiquement
  à l'échec de démarrage lui-même, le cas le plus probable et le plus critique à diagnostiquer.

```ts
// avant : void bootstrap() - un echec de demarrage disparaissait sans trace exploitable
// apres : chaque chemin d'echec est explicitement journalise avant que le process ne s'arrete
process.on('uncaughtException', (err) => {
  console.error('uncaughtException - arret du process :', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('unhandledRejection - arret du process :', reason);
  process.exit(1);
});

bootstrap().catch((err) => {
  console.error('Échec du démarrage :', err);
  process.exit(1);
});
```

**Trace d'exécution.** C'est le tout premier fichier exécuté au lancement du process Render :
`app.module.ts` (entrée 1) n'est même importé qu'après que ce fichier a commencé à s'exécuter.
Avant ce correctif, un échec ici (ex. `config.getOrThrow('PORT')` sur une variable manquante)
aurait fait planter le service SANS que les logs Render ne montrent une cause exploitable — la
même catégorie de risque, "silencieux", que celle déjà trouvée et corrigée le même jour sur
l'expiration des Bounties semées (voir `.claude/HANDOFF/LOG.md`, entrée du 2026-09-11) : les deux
correctifs partagent la même discipline, ne jamais supposer qu'une panne sera visible d'elle-même.

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
