# LOG

Append-only. Une entrée par incrément vérifié et commité — jamais réécrit.

## 2026-08-22 — Cadrage initial

- Lu et analysé en profondeur `Lean Canvas Stratégique - MindClash 228.md` (fourni par
  l'utilisateur), y compris décodage des deux valeurs encodées en image (seuil anti-brigading
  > 6 signalements/6 villes, cible DAU/MAU > 30 %).
- Palier retenu : Système. Décisions de stack/scope/auth/infra actées via questions fermées à
  l'utilisateur (voir `docs/STACK.md`, `docs/VISION.md`).
- Créé 3 agents (`security-review`, `architecture-review`, `critical-logic-tests`) pour les
  risques réels identifiés (données sensibles/auth, plusieurs couches, logique métier
  critique).
- Créé l'identité visuelle (logo, palette, typographie, mockup Social-Map) à partir du logo
  CESTOM fourni par l'utilisateur — publiée en Artifact, relecture en tâche de fond sans
  problème trouvé.
- Créé les docs de cadrage (`docs/VISION.md`, `docs/STACK.md`, `docs/ARCHITECTURE.md`,
  `docs/LEAN_CANVAS.md`) et ce handoff.
- Vérifié : tous les fichiers relus après écriture, structure de dossiers confirmée par
  `ls`/`git status`. Aucun code applicatif encore écrit à ce stade — rien à tester
  fonctionnellement.

## 2026-08-22 — Révision du logo (retour utilisateur sur le premier jet)

- Retour : le mark v1 (facettes plates façon diamant) était propre mais pas assez
  "impressionnant" — demande explicite d'un motif plus travaillé (dégradé de couleurs, motif
  parlant) en restant simple.
- Nouveau mark : pin de carte à dégradé (rouge→or→vert, couleurs du drapeau togolais) avec une
  flèche "level-up" cachée en négatif dans la tête du pin (masque SVG) — lie littéralement les
  deux piliers du produit (carte + gamification) en une seule forme, au lieu d'une simple
  recoloration de l'étoile CESTOM.
- Republié sur le même artifact (même URL) après re-vérification (`--check` OK).

## 2026-08-22 — Scaffold monorepo + plomberie DB vérifiée

- `apps/web` (Next.js 16, TS, Tailwind) et `apps/api` (NestJS, TS strict) scaffoldés en projets
  séparés (pas de workspace npm). `infra/docker-compose.yml` : Postgres+PostGIS local.
- Bloqueur résolu : Node système en v18.20.0, Next.js 16 exige ≥20.9 — basculé via `nvm` sur une
  version plus récente déjà installée localement (voir `docs/STACK.md`).
- API : modules `database` (TypeORM) et `health` (Terminus), `ConfigModule` avec validation Joi
  stricte, helmet + CORS + ValidationPipe globale, ThrottlerModule prêt pour l'auth à venir.
- **Vérifié réellement** (pas supposé) : `npm run build`/`lint` OK sur les deux apps ; conteneur
  Postgres `healthy` ; serveur Nest démarré, `GET /health` confirme une connexion DB réelle
  (`{"status":"ok","info":{"database":{"status":"up"}}}`).
- Contrainte ressources notée (RAM libre faible sur la machine de dev, 1,2 Go/15,7 Go au moment
  du check) : éviter de faire tourner plusieurs serveurs de dev en parallèle en continu.

## 2026-08-22 — Auth + RBAC 2 niveaux

- Modules `cities` (12 villes universitaires marocaines seedées), `users`, `roles` (RBAC
  national/local), `auth` (signup/login email+mdp via bcrypt, Google OAuth câblé mais sans
  vraies clés pour l'instant, JWT, throttling renforcé sur signup/login).
- Décisions de `docs/ARCHITECTURE.md` implémentées concrètement : scope RBAC basé sur la ville
  cible (jamais le GPS live de l'acteur), et `RolesService` n'expose aucune méthode de type
  "action destructrice unilatérale par un rôle national" — bootstrap du premier admin national
  via `BOOTSTRAP_ADMIN_EMAIL`, toute assignation de rôle ultérieure passe par un rôle national
  déjà existant.
- **Vérifié réellement** contre un vrai serveur + vraie base : bootstrap admin, un membre
  ordinaire qui tente `/roles/assign` reçoit 403, l'admin national assigne un rôle local (Rabat)
  avec succès, mauvais mot de passe → 401, email dupliqué → 409, mot de passe trop court rejeté
  par le DTO (400), route protégée sans token → 401. `passwordHash` jamais exposé dans une
  réponse (vérifié sur les 3 réponses signup/me).
- Tests automatisés ajoutés : `apps/api/src/roles/roles.service.spec.ts` (9 tests, dont 2 cas
  négatifs et 1 cas limite de réassignation) — écrit par un agent appliquant le mandat
  `critical-logic-tests`, relu et ré-exécuté indépendamment (10/10 tests passent avec le reste
  de la suite). Aucun bug trouvé dans le service.
- Lint : 14 erreurs et 2 warnings trouvés et corrigés (types `any` non sûrs sur le profil Google
  et le user de la requête JWT, promesse flottante dans `main.ts`, var inutilisée dans
  `auth.service.ts` remplacée par un mapper `toPublicUser` à allowlist explicite plutôt qu'un
  destructure-and-discard). `npm run lint` et `npm run build` passent à zéro erreur après
  correction.

## 2026-08-22 — Premier jet du pitch deck (.pptx)

- `pitch/generate-deck.mjs` (pptxgenjs) génère `pitch/MindClash228-Pitch.pptx` — 11 slides
  (couverture, problème, segments, solution, démo, avantage déloyal, business model, traction,
  stack/coûts, roadmap, closing) à partir de `docs/LEAN_CANVAS.md`/`docs/VISION.md`. Script
  ré-exécutable, pas un one-shot — pensé pour être régénéré quand une vraie capture d'écran du
  MVP existera (slide Démo actuellement un placeholder honnête, pas une fausse capture).
  Polices Windows (Bahnschrift/Segoe UI) plutôt que les Google Fonts de l'identité web, pour
  éviter une substitution silencieuse chez un jury sans ces polices installées.
- **Vérifié réellement** : zip valide (`unzip -t`), 11 slides confirmées, images (logo CESTOM)
  intégrées. **Non vérifié** : rendu visuel réel — aucun outil PowerPoint/LibreOffice disponible
  dans cet environnement pour capturer un aperçu. À ouvrir par l'utilisateur pour repérer un
  éventuel chevauchement avant usage.
- `npm audit` sur `pitch/` signale 2 vulnérabilités high dans `image-size` (dépendance
  transitive de pptxgenjs, DoS sur parsing ICNS/JXL/HEIF) — sans impact réel ici : script
  dev-only, jamais déployé, ne traite que des PNG qu'on contrôle nous-mêmes.

## 2026-08-22 — Backend Social-Map (module `pins`, PostGIS)

- `City` enrichi d'un `centerPoint` (geography Point) ; les 12 villes seedées ont maintenant de
  vraies coordonnées. `Pin` (geography Point + type/titre/description/auteur/ville) — la ville
  est **déduite automatiquement** de la position (plus proche voisin PostGIS, opérateur `<->`),
  jamais fournie par le client.
- Endpoints : `POST /pins`, `GET /pins` (filtre bbox optionnel), `GET /pins/clusters`
  (regroupement réel via `ST_ClusterDBSCAN`, précision en mètres configurable), `GET /pins/:id`,
  `DELETE /pins/:id`.
- **Application concrète du "pouvoir national limité"** (principe de `docs/ARCHITECTURE.md`) :
  suppression d'un Pin réservée à son auteur ou à un rôle local dans SA ville — un rôle national
  n'a **aucun** moyen de supprimer unilatéralement un Pin qu'il n'a pas créé. Vérifié à la fois
  par des tests unitaires (`pins.service.spec.ts`, 6 tests) et en conditions réelles (voir
  ci-dessous) : c'est le test qui compte le plus de cet incrément.
- **Vérifié réellement** contre un vrai serveur + vraie base : création de Pin près de Rabat →
  ville déduite "Rabat" correcte ; idem Marrakech ; clustering de 3 pins proches → 1 cluster de
  count 3 + le pin distant reste seul ; filtre bbox exclut bien Marrakech quand on cible Rabat ;
  admin national qui tente de supprimer un Pin de Rabat qu'il n'a pas créé → 403 ; rôle local
  Rabat qui tente de supprimer un Pin de Marrakech → 403 ; l'auteur supprime son propre Pin →
  200, puis 404 à la relecture.
- Accroc de session (pas un bug produit) : le throttling login (5/60s, voir increment précédent)
  s'est déclenché pendant mes propres tests répétés — 429 attendu et correct, juste reporté le
  test de quelques secondes.
- `npm run build` / `lint` / `test` (16/16) verts sur `apps/api`.

## 2026-08-22 — Backend Bounties (cycle de vie complet)

- `Bounty` (geography Point, ville déduite comme pour `Pin`) : créer / réclamer / résoudre,
  avec expiration **serveur** (2h/12h/24h, horodatage en base, jamais un simple countdown
  client). Pas de scheduler/cron (incompatible scale-to-zero) : expiration "matérialisée" en
  base à la lecture (`materializeExpiry()` avant chaque requête).
- Réclamation implémentée comme une **unique requête UPDATE conditionnelle atomique**
  (`WHERE status='open' AND "expiresAt">now() AND "authorId"!=$1`) plutôt qu'un lire-puis-écrire,
  spécifiquement pour éviter la course entre deux utilisateurs qui réclament en même temps (cas
  limite du mandat `critical-logic-tests`).
- Résolution : l'auteur OU la personne qui a réclamé peuvent clôturer (décision délibérée, pas
  un oubli) — seulement si le statut est `claimed`.

**Bug réel trouvé et corrigé en vérification manuelle** (pas par les tests unitaires — c'est le
point important) : `Repository.query()` de cette version de TypeORM renvoie un **tuple**
`[rows, rowCount]` pour une requête mutante avec `RETURNING`, pas directement le tableau de
lignes comme pour un `SELECT`. Le premier jet faisait `rows.length === 0` sur ce tuple (donc
toujours `2`, jamais `0`) : l'auto-réclamation et la double-réclamation n'étaient **silencieusement
pas bloquées** (200 OK au lieu de 400/409), alors que la mise à jour en base était correctement
empêchée par le `WHERE`. Détecté en testant en vrai contre le serveur (voir ci-dessous), pas
supposé depuis la lecture du code — exactement le genre d'écart qu'un mock naïf en test unitaire
n'aurait pas révélé. Corrigé par destructuration typée `const [rows] = await ...query<[...]>()`.
Les tests unitaires ajoutés après coup (`bounties.service.spec.ts`) reproduisent la vraie forme
du tuple, pas une supposition.

**Vérifié réellement** contre un vrai serveur + vraie base, avant ET après le fix : création avec
ville déduite correcte ; auto-réclamation → 400 ; réclamation par un tiers → 200/claimed ;
double-réclamation → 409 ; résolution par l'auteur → 200/resolved ; résolution d'une Bounty encore
`open` → 409 ; résolution par un tiers non impliqué → 403 ; **expiration réelle** testée en
recalant `expiresAt` dans le passé directement en base (`docker compose exec psql`) — la lecture
matérialise bien `status: expired`, et la réclamation d'une Bounty expirée échoue en 409.

Incident de session (pas un bug produit) : un `npm run build` séparé lancé pendant que
`start:dev --watch` tournait a de nouveau perturbé le process (`EADDRINUSE`, deux instances en
concurrence sur le port 3001 après un hot-reload rapide) — process stale tué proprement, un seul
process relancé. Voir `.claude/HANDOFF/NEXT_SESSION.md`.

`npm run build` / `lint` / `test` (26/26) verts sur `apps/api`. Le noyau MVP backend (auth, RBAC,
Social-Map, Bounties) est maintenant complet et vérifié de bout en bout — reste le frontend
Next.js.

## 2026-08-22/23 — Frontend Next.js (noyau MVP)

- `AuthProvider`/`AudioProvider` (contexts globaux, layout racine) ; `lib/api.ts` (client HTTP
  partagé) ; pages `/`, `/login`, `/signup`, `/auth/callback` (callback Google OAuth, lit le
  token dans le fragment d'URL).
- `SocialMap` (MapLibre GL JS, style CARTO dark-matter gratuit) : clusters de Pins réels
  (`/pins/clusters`, précision dérivée du zoom), Bounties individuelles (pas de clustering —
  cohérent avec leur nature "urgente/actionnable" dans le canevas), clic sur cluster → zoom,
  clic sur pin isolé/Bounty → panneau de détail. Bouton "+" (création) redirige vers `/login` si
  non authentifié plutôt que d'exposer un formulaire qui échouerait en 401.
- `AudioProvider` : architecture posée (autoplay-safe, mute persistant) mais **inerte** — aucun
  fichier audio réel (`TRACKS` vide), conforme à la décision actée dans `docs/ARCHITECTURE.md`.
- Accroc réel trouvé en buildant (pas supposé) : `maplibre-gl` v6.5.0 (bien plus récente que la
  convention "classique" `import maplibregl from 'maplibre-gl'`) n'a **pas d'export par
  défaut** — build cassé net avec ce pattern. Corrigé en imports nommés
  (`import { MapLibreMap, Marker, NavigationControl } from "maplibre-gl"`). Découvert en lisant
  le bundle ESM réel, pas en supposant depuis la mémoire d'entraînement — rappel direct de la
  note `apps/web/AGENTS.md` sur Next.js 16.
- Autre accroc réel : la version d'`eslint-plugin-react-hooks` de ce scaffold a une règle
  `react-hooks/set-state-in-effect` plus stricte qui flague la lecture localStorage/URL dans un
  effet suivie d'un `setState`. Gardé le pattern (lecture dans un effet, pas un `useState`
  paresseux) car c'est le seul qui évite un mismatch d'hydratation SSR — désactivé la règle
  ligne par ligne avec justification, plutôt que de restructurer vers un pattern plus risqué.

**Vérifié** : `npm run build`/`lint` verts (0 erreur) sur `apps/web`. Les 5 routes compilent.
Testé via curl (pas de navigateur) : `/`, `/login`, `/signup`, `/auth/callback` répondent 200,
`/` contient bien le rendu serveur du header ("MINDCLASH"), aucune erreur dans le log du serveur
de dev, le style de carte externe (CARTO) est bien joignable (200) depuis cet environnement.

**Non vérifié — à faire savoir explicitement, pas à cacher** : le rendu visuel réel dans un
navigateur (la carte s'affiche-t-elle correctement, les marqueurs sont-ils bien positionnés/
cliquables, les formulaires fonctionnent-ils de bout en bout). L'extension Claude in Chrome
n'est pas connectée dans cette session (l'utilisateur a choisi de continuer sans lors de
l'installation) — je n'ai donc pas pu piloter un vrai navigateur. `npm run build`/`lint` et les
tests vérifient la correction du code, pas le comportement visuel/interactif réel. L'utilisateur
doit lancer `cd apps/web && npm run dev` et tester lui-même le parcours (voir NEXT_SESSION.md).

Serveur de dev Next.js arrêté après ce check (pas laissé tourner en continu à côté de
Docker+NestJS — RAM machine toujours serrée, ~1,4-1,6 Go libres avec les 3 en même temps).

## 2026-08-23 — Exposition réseau (PC + téléphone) + nettoyage + bug réel trouvé en vrai navigateur

- CORS étendu à une liste blanche séparée par des virgules (`WEB_ORIGIN`) pour autoriser
  simultanément `localhost:3000` (PC) et l'IP LAN de la machine (PC + téléphone sur le même
  Wi-Fi) sans désactiver la protection CORS. `apps/web/.env.local` pointe `NEXT_PUBLIC_API_URL`
  vers l'IP LAN plutôt que `localhost` (sinon un appareil distant appellerait "lui-même").
- **Trouvé en nettoyant** : 9 processus Node orphelins accumulés au fil de la session (3
  instances complètes du serveur API tournaient en même temps, chacune avec son propre
  `npm`→`nest --watch`→`dist/main`). RAM libre remontée de ~1,4 Go à 2,9 Go après les avoir tués
  et relancé un seul process propre. Cause probable : des redémarrages précédents où seul le
  process tenant le port avait été tué (via `netstat`/PID), laissant les process parents/enfants
  orphelins tourner sans jamais libérer leurs propres ressources.
- Accroc transitoire : `next dev -H 0.0.0.0` a échoué une fois avec `EBUSY` sur un fichier dans
  `.next/dev/types/` — verrouillage probable d'OneDrive (le repo est dans un dossier synchronisé
  OneDrive) sur un fichier généré. Résolu par un simple relancement ; à surveiller si ça se
  reproduit — pourrait justifier d'exclure `node_modules/`/`.next/` de la synchronisation OneDrive.
- **Bug réel trouvé par l'utilisateur en utilisant l'app dans un vrai navigateur** (exactement le
  scénario que je ne pouvais pas tester moi-même, faute d'outil navigateur) : `GET /bounties?...
  &status=open` renvoyait 400 `"property status should not exist"`. Cause : `bounties.controller.ts`
  avait `@Query() query: BboxQueryDto` ET `@Query('status') status?: ...` sur le même handler — le
  `ValidationPipe` global (whitelist + forbidNonWhitelisted) valide TOUT l'objet query contre le
  premier DTO, qui ne déclarait pas `status`, donc le rejette, sans se soucier qu'un second
  décorateur comptait le récupérer séparément. Corrigé en étendant `BboxQueryDto` avec un
  `ListBountiesQueryDto` incluant `status`, un seul `@Query()` sur le handler.
- **Vérifié réellement** : requête exacte qui plantait rejouée après le fix → 200 (localhost et
  IP LAN). `npm run lint`/`test` (26/26) toujours verts. C'est un bon rappel concret que
  `build`/`lint`/tests unitaires ne remplacent pas l'usage réel — ce bug n'était détectable que
  par une vraie requête HTTP avec les bons paramètres, ce que ni les tests mockés ni la lecture
  du code n'auraient révélé aussi vite.

## 2026-08-23 — Refonte de l'ambiance sonore (retours utilisateur successifs)

- **"Le son ne joue pas du tout sur téléphone"** : cause probable identifiée — `audio.play()`
  était appelé depuis un `useEffect` réagissant à un changement de state React, pas
  directement dans le gestionnaire d'événement natif du geste utilisateur. Les navigateurs
  mobiles sont plus stricts que desktop sur ce point (le détour par un re-render arrive trop
  tard pour "compter" comme faisant partie du geste). Corrigé en appelant la lecture de façon
  synchrone dans le handler `pointerdown`/`keydown`/`touchend` lui-même.
- **Style musical** : la première piste (contemplative, CC0) ne correspondait pas à l'attente —
  référence donnée par l'utilisateur : le thème "Arise" de Solo Leveling (épique, intense).
  Remplacée par "Battle March - Epic Orchestral Music Loop" (PlayOnLoop, **CC-BY 3.0** — lien de
  crédit ajouté dans le Header, visible, requis par la licence). Volume abaissé à 0.18 (demande
  explicite : "faible niveau").
- **"Sois un ingénieur du son, qu'on ne remarque pas la notion cyclique"** : remplacé le simple
  `<audio loop>` (saut sec à 0:00) par un moteur de boucle en Web Audio API
  (`AudioContext`/`AudioBufferSourceNode`/`GainNode`) avec fondu enchaîné de 1,5s de part et
  d'autre du point de bouclage — deux cycles se chevauchent brièvement (l'un finit en fondu de
  sortie pendant que l'autre démarre en fondu d'entrée), un vrai crossfade plutôt qu'une coupure
  audible. Piste préchargée/décodée en tâche de fond dès le montage (pas besoin de geste pour un
  simple fetch), pour que la lecture démarre instantanément une fois le geste reçu.
- Accroc de lint rencontré : la règle `react-hooks/refs` (nouvelle, stricte) refuse même le
  pattern `if (!ref.current) ref.current = ...` qu'elle recommande elle-même dans son message
  d'erreur — corrigé avec `useState(() => new LoopEngine())` (instance stable, pas de state
  setter jamais appelé) plutôt qu'un ref initialisé pendant le rendu.
- **Vérifié** : `npm run lint`/`build` verts, fichier audio servi (200, taille exacte). **Non
  vérifié** : le rendu sonore réel sur téléphone après ce fix (pas d'outil audio/navigateur pour
  l'écouter moi-même) — à confirmer par l'utilisateur.

## 2026-08-23 — Remplacement de la carte interactive par une carte SVG stylisée

Décision utilisateur suite à l'échec persistant de la carte MapLibre sur téléphone (cause
précise jamais identifiée avec certitude, malgré le fix de visibilité d'erreur du commit
précédent — voir aussi la demande explicite : "oublie la notion de carte, depuis là ça ne
marche pas"). Remplace entièrement MapLibre GL JS + tuiles CARTO par un SVG inline.

- **Données géographiques réelles**, pas approximées : contour du Maroc depuis un GeoJSON
  simplifié réel (`glynnbird/countriesgeojson`), projeté avec une transformation linéaire
  lng/lat → x/y calculée une fois (script Node ponctuel, pas conservé dans le repo — seul le
  résultat l'est). **Les 12 villes seedées côté backend sont projetées avec la MÊME
  transformation** que le contour, garantissant leur cohérence relative (une ville côtière reste
  près du contour, Tanger tombe exactement au point le plus au nord, etc. — vérifié par
  inspection des coordonnées produites, pas juste supposé correct).
- `MoroccoMap.tsx` : contour + 12 cercles de ville avec un nombre "personnes présentes"
  **volontairement aléatoire pour l'instant** (généré une fois au montage, pas à chaque rendu) —
  demande explicite de l'utilisateur, pas encore relié à une vraie métrique.
- `CityPanel.tsx` (nouveau) : clic sur une ville → liste réelle de ses Pins/Bounties (filtrage
  côté client sur `/pins` et `/bounties`, pas encore un paramètre `cityId` dédié côté API — voir
  note dans `morocco-geo.ts`), réutilise `PinDetail`/`BountyDetail` déjà testés pour les actions.
- `CreateSheet.tsx` : la position n'est plus "centre de la carte" (n'existe plus) mais un
  sélecteur de ville, qui résout en interne vers les coordonnées de cette ville.
- `SocialMap.tsx` supprimé, `maplibre-gl` désinstallé, CSS MapLibre-spécifique retiré de
  `globals.css`.

**Vérifié réellement** : `npm run build`/`lint` verts, HTML servi par le serveur de dev contient
bien le SVG rendu côté serveur avec les noms de villes (Rabat/Casablanca/Tanger confirmés dans
la réponse curl) — contrairement à MapLibre, un SVG inline n'a aucune dépendance réseau externe
donc rien ne peut échouer au chargement des tuiles/style. **Non vérifié à l'œil** (toujours pas
d'outil navigateur) — à confirmer par l'utilisateur sur PC et téléphone.

Documentation mise à jour en conséquence : `docs/STACK.md`, `docs/ARCHITECTURE.md`,
`docs/VISION.md`, `docs/RESUME_FONCTIONNEL.md`.

**Bug réel trouvé par l'utilisateur immédiatement après** (erreur d'hydratation React copiée
depuis l'overlay Next.js) : les compteurs de présence utilisaient un vrai `Math.random()` dans
le `useState` paresseux de `MoroccoMap`. `MoroccoMap` est un Client Component mais reste
**rendu côté serveur** pour le HTML initial puis réhydraté côté client — `Math.random()`
produit une valeur différente à chaque appel, donc le serveur et le client calculaient des
nombres différents pour chaque ville, ce que React refuse (`r`/`fontSize`/texte différents,
exactement le genre d'erreur que le message React cite lui-même : "Math.random() which changes
each time it's called"). Corrigé en remplaçant par un hash déterministe du nom de la ville
(`seededPresence`) — même résultat des deux côtés à chaque fois, garanti par construction, tout
en gardant l'effet visuel "pas encore de vraies données" demandé. Vérifié réellement : deux
requêtes `curl` successives sur `/` renvoient exactement le même nombre pour Rabat (59), avant
le fix elles auraient différé à chaque rendu.

## 2026-08-23 — Accueil "vide" + son toujours muet sur téléphone

Deux retours utilisateur après le fix précédent :

1. **"Interface d'accueil vierge, rien d'intéressant qui donne envie de continuer"** : ajouté
   `Hero.tsx` — tagline réelle du canevas ("Explore. Partage. Level-up." + une phrase de
   proposition de valeur), salutation personnalisée si connecté, bouton d'inscription sinon.
   Contenu réel (repris du canevas stratégique), pas de texte inventé. Gate `!loading` déjà
   présent dans le pattern d'auth existant, donc pas de nouveau risque d'hydratation (le
   contenu par défaut rendu côté serveur — `loading=true` — est identique à celui du premier
   rendu client).
2. **"Toujours pas de son sur téléphone"** : hypothèse retenue — le fichier `epic.wav` était en
   **PCM 8 bits**, un format assez inhabituel que certains décodeurs audio mobiles ne
   supportent probablement pas (desktop plus permissif). Comme `LoopEngine.preload()` n'avait
   pas de `try/catch` autour de `decodeAudioData()`, un échec de décodage aurait échoué en
   silence (promesse rejetée jamais interceptée) - explique "aucune erreur visible, juste pas de
   son". Remplacé par un **MP3** (128 kbps, depuis Playonloop.com directement plutôt que la copie
   WAV d'OpenGameArt.org) — format décodé de façon universelle, y compris mobile.

**Vérifié** : fichier servi (200, taille exacte), l'ancien `.wav` renvoie bien 404 (retiré
proprement), `npm run lint`/`build` verts, Hero présent dans le HTML rendu côté serveur. **Non
vérifié** : rendu sonore réel sur téléphone après ce fix (toujours pas d'outil audio disponible
pour l'écouter moi-même) — à confirmer par l'utilisateur.

## 2026-08-23 (suite) — Son "toujours" muet sur téléphone après le passage au MP3

Retour utilisateur : le MP3 ne réglait pas le problème, le son ne démarrait toujours pas sur
téléphone. Le fichier lui-même a d'abord été re-vérifié (pas supposé sain) : `curl` sur
`http://192.168.11.129:3000/audio/epic.mp3` (l'URL LAN réellement utilisée par le téléphone)
renvoie `200`, `Content-Type: audio/mpeg`, `Content-Length: 1420225` — identique à l'accès en
`localhost`. **Le fichier et le serveur sont écartés comme cause.**

**Cause racine trouvée par relecture du code de déverrouillage** (`audio-context.tsx`,
`AudioProvider`) : les écouteurs de "premier geste" étaient posés sur `pointerdown`, `keydown`
ET `touchend`, avec retrait de TOUS les écouteurs dès que UN SEUL se déclenche
(`{ once: true }` + retrait manuel des trois dans le handler). Sur un tap tactile, `pointerdown`
se déclenche systématiquement **avant** `touchend` dans la séquence d'événements du navigateur —
il "gagne" donc toujours la course et déclenche seul le déverrouillage. Or `pointerdown` est un
déclencheur documenté comme insuffisant pour débloquer un `AudioContext` sur plusieurs
navigateurs mobiles (WebKit/iOS en particulier), contrairement à `touchend`/`click`/`keydown`
qui sont universellement reconnus. Comme l'ancien code ne vérifiait jamais l'état réel du
contexte après `resume()` (une promesse peut se résoudre sans que l'état passe à `"running"`) et
ne loggait aucune erreur (`void engine.play(src)` sans `.catch`), l'échec était **silencieux et
systématique à chaque tap** — pas intermittent, ce qui correspond exactement au symptôme rapporté
("toujours pas").

**Corrigé** (`lib/audio-context.tsx`) par trois changements complémentaires :
1. `pointerdown` retiré de la liste des déclencheurs (conservés : `touchend`, `click`,
   `keydown`).
2. `LoopEngine.play()` vérifie désormais explicitement `ctx.state === "running"` après
   `resume()` et lève une erreur sinon, au lieu de continuer silencieusement.
3. Le handler de déverrouillage ne retire ses écouteurs qu'**après confirmation** de succès — si
   un geste échoue, il continue d'écouter le geste suivant au lieu d'abandonner définitivement
   (l'ancien comportement "un seul essai, puis plus jamais" transformait toute défaillance
   ponctuelle en silence permanent pour le reste de la session).

Profité du même fichier pour intégrer deux recommandations issues de la recherche NN/g menée en
parallèle (voir plus bas) : architecture à deux étages de gain (`cycleGain` pour le fondu de
boucle, `masterGain` pour le niveau utilisateur/ducking) permettant un **ducking** immédiat
(volume réduit à 30 % pendant qu'une sheet/formulaire est ouvert·e, restauré à la fermeture) sans
attendre la fin du cycle en cours, et un signal `recentlyUnlocked` bref (2,5 s) consommé par
`MuteToggle` pour rendre visible "le son vient de démarrer, voici où le contrôler" — l'ancien
comportement démarrait l'audio en arrière-plan sans aucun signal visuel.

**Vérifié réellement** : `npm run lint` et `npx tsc --noEmit` verts sur `apps/web` après
réécriture complète de `audio-context.tsx` et `MuteToggle.tsx`. **Non vérifiable par moi** :
rendu sonore réel sur téléphone (toujours aucun outil audio/navigateur disponible dans cet
environnement) — le raisonnement ci-dessus est déduit de la lecture du code et de la
documentation connue des politiques d'autoplay mobiles, pas d'une observation directe du
téléphone. À confirmer par l'utilisateur ; si le son ne démarre toujours pas après ce correctif,
l'hypothèse suivante à explorer est l'interrupteur silencieux matériel iOS (indétectable en JS —
dans ce cas la seule option est un contrôle manuel bien visible, déjà en place via `MuteToggle`).
