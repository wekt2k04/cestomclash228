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

## 2026-08-23 (suite) — Passe UX complète guidée par la recherche NN/g

Demande explicite : sectionner l'appli en interfaces, identifier par interface les éléments à
étudier, chercher la recherche de conception scientifique (Nielsen Norman Group en priorité)
pertinente pour chacun, puis concevoir en conséquence — audio compris. 4 recherches menées en
parallèle (forks), une par groupe d'interfaces : (1) formulaires (CreateSheet/login/signup),
(2) mobile/tactile/bottom sheets, (3) hiérarchie visuelle/dataviz (carte), (4) feedback
système/erreurs + audio. Chaque changement ci-dessous cite le principe qui le motive — jamais
appliqué par pur goût esthétique.

**Formulaires** (`CreateSheet.tsx`, `login/page.tsx`, `signup/page.tsx`) :
- Labels visibles ajoutés sur Titre/Description (CreateSheet) — NN/g cite l'absence de label
  visible (placeholder seul) comme une des erreurs de formulaire les plus fréquentes : le
  placeholder disparaît dès la saisie commencée, l'utilisateur perd le contexte du champ.
- Validation au blur (pas à la frappe, pas seulement à la soumission) avec message d'erreur par
  champ, `aria-invalid`/`aria-describedby` — équilibre entre "trop tôt" (perçu comme agressif) et
  "trop tard" (aller-retour complet perdu).
- Retour positif (coche verte) sur le mot de passe du signup une fois le seuil de 8 caractères
  atteint — confirmation immédiate qu'une contrainte affichée est satisfaite, pas seulement ses
  violations.
- Sélecteur de type de Pin (CreateSheet) : `<select>` à 4 options remplacé par des boutons
  visibles (`TabButton`, déjà utilisé ailleurs dans le même formulaire) — NN/g déconseille les
  menus déroulants en dessous d'environ 6-7 options (coût d'interaction plus élevé qu'un choix
  visible, options invisibles tant que non ouvertes). Le sélecteur de ville (12 options)
  volontairement laissé en `<select>` — NN/g recommande justement le menu déroulant à cette
  échelle-là.

**Mobile/tactile/bottom sheets** (`DetailSheet.tsx`, `Header.tsx`, `MuteToggle.tsx`) :
- Cibles tactiles portées à 40-44px minimum (WCAG 2.5.5 / NN/g) : boutons d'auth du Header
  (32px de haut → 44px), `MuteToggle` (36×36 → 44×44), bouton de fermeture de `DetailSheet`
  (zone de frappe élargie par padding négatif, sans changer la taille visuelle de l'icône).
- Scrim (fond assombri, cliquable) ajouté derrière chaque sheet — son absence laissait le
  contenu derrière une sheet ouverte visuellement actif et cliquable, ambigu sur ce qui a le
  focus de l'interaction.
- Intégration au bouton retour du navigateur : ouvrir une sheet pousse une entrée d'historique ;
  le geste "retour" natif (bouton Android, swipe iOS, bouton navigateur desktop) la ferme comme
  n'importe quel overlay natif — auparavant un pur état React invisible pour l'historique du
  navigateur, contraire à l'attente d'un utilisateur mobile.
- `CreateSheet` seule (la seule sheet avec saisie non enregistrée) confirme l'abandon d'un
  brouillon avant fermeture (`window.confirm`) — NN/g distingue "Cancel" (annule une action, perte
  de données possible) de "Close" (simple fermeture, rien à perdre) ; les sheets en lecture seule
  (CityPanel/PinDetail/BountyDetail) n'ont pas cette confirmation, rien à y perdre.

**Hiérarchie visuelle / carte** (`MoroccoMap.tsx`, `morocco-geo.ts`) :
- Taille des cercles discrétisée en 3 paliers nets (11/15/19px) au lieu d'une interpolation
  continue (14-28px) — un encodage visuel continu par la taille est difficile à comparer
  précisément à l'œil ; quelques paliers distincts se perçoivent et se comparent immédiatement.
- Un seul élément mis en avant (halo pointillé doré sur la ville la plus active) — au-delà de
  1-2 points d'emphase simultanés, la hiérarchie visuelle s'effondre. Pas de nouvel accent
  couleur : réutilise `--gold`, déjà dans la palette existante (limite à 4 accents déjà
  respectée, cf. entrée précédente sur l'identité visuelle).
- **Risque géométrique réel corrigé** : à la projection lng/lat→x/y brute, Rabat/Kénitra
  n'étaient qu'à ~17px l'une de l'autre et Fès/Meknès/Ifrane à ~26px — avec un rayon max
  réaliste, ces marqueurs auraient visuellement fusionné (violation du principe de proximité de
  la Gestalt, un utilisateur perçoit un seul point là où il y en a deux ou trois, et ne peut plus
  cliquer isolément sur l'un d'eux). Corrigé en éloignant Kénitra/Meknès/Ifrane de leur ancrage
  géographique (Rabat, Fès) **le long du même vecteur réel** — direction relative inchangée,
  distance étirée jusqu'à un écart ≥ 40px vérifié par calcul explicite pour les 3 paires
  concernées (17-28px → 41-47px). Rayon max lui-même réduit en parallèle (28px → 19px), ce qui
  réduit aussi le risque résiduel pour les paires plus modérément proches (Rabat/Casablanca
  ~42px, Kénitra/Meknès ~41px — marge faible mais positive, complétée visuellement par le
  contour sombre de 2px déjà présent autour de chaque cercle).
- Chaque marqueur de ville rendu accessible au clavier (`role="button"`, `tabIndex`, `onKeyDown`
  Entrée/Espace, `aria-label` avec le nom et le compte) — un `<g onClick>` SVG nu n'est ni
  focusable ni activable au clavier, gap trouvé en implémentant le point précédent, corrigé dans
  la foulée (même fichier, même risque de fond : accessibilité des contrôles). `role="img"` retiré
  du `<svg>` racine (incompatible avec des enfants focusables), remplacé par son seul
  `aria-label` pour le contexte d'ensemble.

**Feedback système / erreurs** (`CityPanel.tsx`, `BountyDetail.tsx`, `PinDetail.tsx`,
`login`/`signup`, nouveau `ErrorMessage.tsx`/`Spinner.tsx` partagés) :
- **Bug réel corrigé** : `CityPanel` avalait silencieusement tout échec réseau
  (`.catch(() => {})`) — violation directe de l'heuristique NN/g "visibilité de l'état du
  système". Remplacé par un état d'erreur explicite avec bouton "Réessayer".
- "Chargement…" (texte nu) remplacé par un skeleton screen dans `CityPanel` — perçu comme plus
  rapide qu'un texte/spinner nu à durée égale, et évite le saut de mise en page au chargement
  réel (NN/g, skeleton screens).
- `role="alert"` ajouté à tous les messages d'erreur (aucun n'en avait avant) — sans lui, un
  lecteur d'écran ne signale jamais l'apparition d'un message injecté après coup dans le DOM.
  Icône ajoutée à côté du texte rouge — la couleur seule est invisible pour un daltonisme
  rouge-vert. Les deux extraits dans `ErrorMessage.tsx`, réutilisé partout (3+ duplications
  avant extraction).
- Boutons "busy" (déjà correctement `disabled`) complétés par un spinner inline visible
  (`Spinner.tsx`) — un simple changement de texte ("…") peut passer inaperçu en lecture rapide.

**Audio** : voir entrée précédente (ducking + signal `recentlyUnlocked`) — traité dans le même
lot que le bug de déverrouillage mobile, sources : WCAG 1.4.2 (contrôle audio, déjà conforme,
rien à changer côté consentement/mute) + principe de charge cognitive (réduire le volume ambiant
pendant une tâche de lecture/saisie).

**Vérifié réellement** à chaque fichier, pas en bloc à la fin : `npm run lint` et
`npx tsc --noEmit` verts après CHAQUE fichier modifié (pas seulement en fin de lot) ; SSR
re-vérifié par `curl` après le changement de coordonnées de `morocco-geo.ts` (nouvelles
coordonnées et 12× `role="button"` bien présents dans le HTML rendu serveur) et après la
réécriture de login/signup (200, contenu attendu présent). **Non vérifiable ici** : tout rendu
visuel réel et toute interaction tactile/clavier réelle — voir
`.claude/HANDOFF/WORKFLOW_STATUS.md` pour le détail ligne par ligne de ce qui reste à confirmer
par l'utilisateur.

## 2026-08-24 — Retour utilisateur : rendu réel jugé mauvais, refonte visuelle engagée

- **Confirmation concrète du risque que `workflow-audit.md` existe pour couvrir** : tout le lint/
  build/curl de la passe NN/g du 2026-08-23 était vert, mais le premier vrai regard utilisateur
  juge le rendu "très mauvais" — preuve directe que "ça compile" ne dit rien de "c'est bon à
  regarder". Aucune ligne ⛔/⚠️ de `WORKFLOW_STATUS.md` n'a été repeinte en ✅ sans nouvelle preuve.
- **Diagnostic avant d'agir** (jamais supposé) : relecture de l'Artifact d'identité visuelle
  publié le 2026-08-22 (palette "tactique + accents drapeau togolais", Chakra Petch/IBM Plex Sans)
  comparée à `globals.css` — les tokens sont bien câblés, **ce n'est pas un problème de branding
  manquant**. Le vrai problème trouvé en lisant le code : le bouton "+" flottant
  (`CityOverview.tsx`) n'a aucun label visible, seulement une icône SVG et un `aria-label` (lecteur
  d'écran seul) — personne ne peut savoir ce qu'il fait sans taper à l'aveugle, sur mobile comme
  sur desktop. Le `Hero` ajouté le 2026-08-23 pour rendre l'accueil engageant existe bien mais ne
  suffit visiblement toujours pas une fois vu en vrai.
- **Décisions actées avec l'utilisateur** (à ne pas re-demander) :
  - Direction visuelle : **s'éloigner du sombre/tactique vers quelque chose de plus
    gamifié/coloré** (références déjà citées dans `docs/VISION.md` : Piano Tiles, Shadow Fight) —
    pas juste une meilleure exécution de l'identité actuelle.
  - La carte ne doit **pas** être la toute première chose vue à l'ouverture — il faut d'abord
    quelque chose qui explique à quoi sert le produit et comment s'en servir.
  - Méthode demandée, dans l'ordre : agents dédiés → fonctionnalités voulues (l'utilisateur a
    "beaucoup d'idées" à détailler) → pré-design → design → code complet → audit/incrément. Le
    prochain échange doit recueillir ses idées de fonctionnalités avant tout maquettage.
  - Toute proposition doit se baser sur `docs/VISION.md`/`docs/LEAN_CANVAS.md` (le cadrage déjà
    acté), pas des idées génériques déconnectées du produit réel.
- **Créé `.claude/agents/product-designer.md`** — agent dédié à produire une maquette visuelle
  **réelle** (Artifact canvas via le skill `design`), jamais une description textuelle. Conçu pour
  être invoqué en plusieurs instances parallèles (angles créatifs différents dans le prompt de
  chacune, pas dans l'agent lui-même) afin de comparer plusieurs directions — répond à la demande
  explicite de l'utilisateur d'agents "rigoureux et chirurgicaux, en parallèle". Contraintes
  codées dans l'agent pour ne pas reproduire les erreurs déjà identifiées : label visible
  obligatoire sur tout bouton, cible tactile ≥44px, jamais d'invention de fonctionnalité hors
  cadrage. Pas encore invoqué — la phase "fonctionnalités" doit être close avant le pré-design.

## 2026-08-24/25 — Plan détaillé pour 4 fonctionnalités + refonte + déploiement

- Utilisateur a choisi (QCM en 2 manches) de construire pour de vrai les 4 fonctionnalités jusque
  là "roadmap/pitch uniquement" (Ghost Mode, Reality-Vlogs, Modération anti-brigading, Sponsoring),
  avec la même rigueur que Bounties, en couverture large (tout visible à l'écran), en parallèle
  d'une refonte visuelle (direction gamifiée/colorée, accueil qui explique le produit avant la
  carte) et d'un premier déploiement en ligne. Décisions actées dans ce round : anonymat Ghost
  Mode invisible à TOUS les rôles (même national/local, pas seulement au public) ; sponsoring en
  logique réelle sans vrai paiement ; infra auto-hébergée sur un seul serveur (pas de nouveaux
  comptes SaaS type Upstash/R2) ; délai réel <2 semaines mais explicitement pas la contrainte
  prioritaire pour l'utilisateur — la qualité et l'envergure priment.
- 3 agents d'exploration parallèles (`Explore`, ~75k tokens chacun) ont vérifié en direct
  l'état réel du backend (schéma, RBAC, pattern `bounties`), du frontend (`DetailSheet`,
  `CreateSheet`, `auth-context`, `audio-context`, `MoroccoMap`) et de l'infra (docker-compose,
  STACK.md, .env, absence totale de Dockerfile/CI/remote git) avant tout plan — pas de supposition.
- Un agent `Plan` (~244k tokens, 92 lectures/greps réels) a ensuite conçu le séquençage complet,
  avec 9 décisions de conception non triviales tranchées et justifiées plutôt que laissées en
  ambiguïté : masquage de l'auteur Ghost Mode par projection SQL conditionnelle (pas de nouvelle
  colonne, `authorId` reste toujours le vrai auteur) + `viewerIsRealAuthor` calculé serveur pour
  que l'auteur seul voie son bouton de révélation sans jamais exposer son id ; action nommée
  `reveal` (jamais `claim`, pour ne pas collisionner avec la sémantique Bounty) ; anti-brigading
  identifié comme **prérequis réel** de Ghost Mode (aujourd'hui un rôle local supprime un Pin de sa
  ville sans aucun signalement préalable — un levier plus fort qu'un post anonyme non protégé) ;
  Redis retiré du périmètre (aucune des 4 fonctionnalités telles que cadrées n'en a besoin, facile
  à réintroduire si besoin réel) ; deux index uniques partiels Postgres nécessaires pour dédupliquer
  les signalements (un `UNIQUE` composite classique ne bloque pas quand une des deux colonnes cible
  est NULL) ; split Vercel(front)/VPS(back) confirmé par lecture du code (frontend 100% CSR, jamais
  d'appel serveur au build).
- Écarts trouvés par rapport à ce qui était supposé : `Bounty` n'a aujourd'hui aucune route de
  suppression/modération (donc pas un bug à corriger, juste un manque de câblage à préparer) ;
  `/health` vérifie déjà une vraie connexion Postgres via Terminus (réutilisable tel quel) ; aucun
  manifest PWA/service worker n'existe malgré le nom "PWA" partout dans les docs (noté comme
  question ouverte, pas construit silencieusement) ; `multer` déjà résolvable en dépendance
  transitive, aucune nouvelle dépendance runtime nécessaire pour l'upload vidéo.
- Plan complet écrit dans `docs/PLAN_EXTENSION.md` (persistant dans le repo — le fichier de travail
  du mode Plan de Claude Code vit hors-repo dans le profil utilisateur, se serait perdu entre
  sessions sinon). 3 décisions encore bloquantes avant de coder, listées en tête de ce document :
  Ghost Mode simple vs. purgatoire d'upvotes, `synchronize:false` en dev ou prod seulement, timing
  VPS/domaine.
- **Créé `.claude/agents/token-steward.md` et `.claude/agents/quality-gate.md`** — demande
  explicite utilisateur, méthode et formules détaillées dans `docs/PLAN_EXTENSION.md` § Phase 0
  (score composite pondéré façon Altman Z-score avec verrou dur sur la sécurité, relance max 2×).
- **Non vérifié à ce stade** : aucune ligne de code des 4 fonctionnalités n'existe encore — ce plan
  est une conception, pas une implémentation. Rien à logguer "fait" avant l'Incrément 0.
- **2026-08-25 — Infra revue, plus de VPS/domaine payant** : en posant les 3 questions bloquantes
  restantes, l'utilisateur a refusé tout paiement/carte bancaire pour le déploiement. Or le VPS
  n'était nécessaire que pour héberger Redis (déjà retiré du périmètre, Ghost Mode simple choisi)
  et le stockage vidéo — remplacé par un trio 100% palier gratuit : Vercel (front, inchangé) +
  Render (API, déploie le même `Dockerfile` déjà prévu) + Supabase (Postgres+PostGIS **et**
  Storage pour les vidéos, un seul compte pour les deux). Aucune carte bancaire, aucun nom de
  domaine à acheter (sous-domaines automatiques). Root cause de la confusion initiale : le plan
  avait interprété "tout auto-hébergé sur un seul serveur" comme excluant tout service managé,
  alors que le vrai besoin de l'utilisateur était "pas de nouveau paiement", pas "pas de service
  tiers" — les deux ne coïncident pas quand un palier gratuit existe. Limites assumées et
  documentées (pas cachées) : Render gratuit s'endort après 15min d'inactivité (30-60s de réveil),
  Supabase gratuit se met en pause après ~1 semaine (réveil manuel dashboard, à faire avant le
  pitch). `docs/PLAN_EXTENSION.md` Incréments 1a et 6 réécrits en conséquence, 3 décisions
  bloquantes maintenant toutes résolues — l'Incrément 0 peut démarrer.

## 2026-08-25 — Incrément 0 terminé : RBAC centralisé + migrations TypeORM réelles

- **RBAC** : `pins.service.ts::remove()` appelait une comparaison inline
  (`role?.scope === LOCAL && role.cityId === pin.cityId`) au lieu de `RolesService`. Ajouté
  `RolesService.isLocalModeratorForCity()`/`requireLocalModerationScope()` — **délibérément pas**
  `requireCityScope()`/`canActOnCity()` existants, qui retournent `true` pour tout rôle national
  quelle que soit la ville (correct pour un scope de lecture, aurait été une vraie faille de
  sécurité ici : pouvoir de suppression unilatérale national, contraire à la doctrine actée).
  6 nouveaux tests dans `roles.service.spec.ts`, 5 tests existants de `pins.service.spec.ts`
  adaptés (mêmes verdicts, comportement identique vérifié caractère pour caractère).
- **Migrations réelles** : `synchronize` passé à `false` inconditionnellement (était `true` en
  dev). Nouveau `data-source.ts` (DataSource CLI autonome, `dotenv` ajouté en devDependency).
  Migration baseline générée et testée contre un **conteneur Postgres+PostGIS vierge isolé** (pas
  la base de dev) — **bug réel trouvé avant qu'il ne devienne silencieux** : la migration
  auto-générée ne créait pas explicitement les extensions `postgis`/`uuid-ossp` (`synchronize`
  les créait en douce jusqu'ici) ; aurait échoué sur un vrai déploiement neuf (Supabase). Corrigé
  (`CREATE EXTENSION IF NOT EXISTS` explicite), re-testé sur un DEUXIÈME conteneur vraiment
  vierge. Base de dev existante migrée sans perte : table `migrations` backfillée avec le
  baseline marqué "déjà appliqué" (schéma déjà identique via `synchronize`), jamais rejoué le SQL
  dessus — confirmé par `migration:run` → "No migrations are pending".
- **Audit réel par `architecture-review`** (pas simulé, invoqué en tâche de fond) : a confirmé
  la distinction RBAC correcte et le SEUL endroit du code à risque (grep exhaustif : aucun autre
  usage de `requireCityScope`/`canActOnCity` dans le repo) ; a trouvé et fait corriger 2 problèmes
  réels avant ce commit : (1) `docs/PLAN_EXTENSION.md` prescrivait littéralement `requireCityScope`
  comme solution — le code avait bien évité ce piège mais le doc restait une mine active pour une
  session future, corrigé ; (2) **aucun index spatial GiST n'a jamais existé** sur
  `pins.location`/`bounties.location`/`cities.centerPoint` (`synchronize` n'en crée pas sans
  `@Index` déclaré) — `findNearest()` (appelée à chaque création de Pin/Bounty) faisait un scan
  séquentiel complet de `cities`, un commentaire affirmait pourtant l'inverse à tort (corrigé).
  Nouvelle migration `AddSpatialIndexes` (GiST ×3 + btree sur `cityId` ×2, anticipe le filtrage
  par ville de l'Incrément 4), testée en cycle run/revert/run sur un troisième conteneur vierge,
  appliquée pour de vrai sur la base de dev, usage confirmé par `EXPLAIN` (`Index Scan using
  "IDX_cities_center_point"`) — pas juste vérifié que l'index existe.
- Point de vigilance non bloquant signalé pour l'Incrément 5 (pas d'action requise maintenant) :
  `PinDetail.tsx` réimplique la même règle RBAC côté frontend juste pour l'affichage du bouton —
  cohérent aujourd'hui, à garder synchronisé quand `remove()` sera durci pour Ghost Mode.
- **Vérifié réellement** : `npm run test` 32/32, `npm run lint` propre, `tsc --noEmit` propre,
  API relancée et re-testée en direct (`/health`, `/cities`) après chaque changement de schéma.
  **L'Incrément 0 est fait et audité — l'Incrément 1 (déploiement + design) peut démarrer.**

## 2026-09-04 — Refonte visuelle + Sponsoring vérifié + Notation (Incréments 2, 3, 3bis)

**Point urgent constaté ce jour** : l'échéance du concours (2026-09-03 23:59, voir
`docs/CONCOURS.md`) est dépassée — signalé à l'utilisateur, qui a demandé de continuer
vers "ce soir" comme nouvelle cible.

**Refonte visuelle (Incrément 2, fait le 2026-08-31 en tout début de cette session)** :
palette afro-futuriste appliquée au vrai code (pas seulement aux maquettes) — tokens
`globals.css` relus depuis la maquette retenue (Artifact lu explicitement pour extraire
les vraies valeurs oklch, pas devinées) : rouge/or/vert confirmés identiques, `--cyan`
renommé `--terracotta` (fond bleu-gris froid teinte 260 → anthracite chaud teinte 35-55).
Renommage `MindClash 228` → `CestomClash228` dans les 4 endroits utilisateur visibles
(Header, signup, login, `<title>`) — identifiants internes (clés localStorage, nom du
composant `MindClashMark`) laissés inchangés, aucun gain utilisateur à les toucher. Bouton
"+" flottant (icône seule depuis le 2026-08-24, jamais corrigé) remplacé par une pilule
icône+texte. Nouvel écran `WelcomeIntro.tsx` : vrai premier écran séparé de la carte pour
un visiteur non connecté (Pins/Bounties expliqués, CTA) — demandé le 2026-08-24, jamais
codé jusqu'ici (`Hero.tsx` restait un bandeau collé au-dessus de la carte). Vérifié
réellement : lint/tsc propres, serveur dev relancé, SSR vérifié par curl (2×
"CestomClash228", 0× "MindClash"), CSS compilé inspecté (`--bg:#1a0704`,
`--terracotta:#ed7940`, 0 résidu "cyan"). **Jamais vu à l'écran** — confirmé ce jour
qu'aucun outil navigateur n'est disponible (extension Claude in Chrome non connectée).

**Sponsoring vérifié + Notation (Incréments 3/3bis)** : nouveau module
`apps/api/src/sponsorship/` complet (entité `SponsorshipRequest`, service, contrôleur,
DTOs, migration) + `PATCH /bounties/:id/rate` (auteur seul, après résolution, une fois).
Vérificateur = `RolesService.isVerifier`/`requireVerifierScope`, réutilise le scope
national existant plutôt qu'un nouveau rang RBAC (décision actée au pivot du 2026-08-31).

**Audité réellement par `security-review` + `architecture-review` (tâches de fond, pas
simulé) — 2 problèmes réels trouvés et corrigés avant de considérer l'incrément fini** :
1. **CRITIQUE** : `approve()`/`reject()` ne comparaient jamais `requesterId` à
   `verifierId` — un rôle national pouvait approuver SA PROPRE demande de sponsoring,
   annulant tout l'intérêt du mécanisme (aucune passerelle de paiement ne rattrape ça
   derrière). Corrigé par un `UPDATE ... WHERE status='pending' AND "requesterId" != $verifierId`
   atomique unique (même pattern que `BountiesService.claim()`) — bloque à la fois
   l'auto-approbation ET une race entre deux vérificateurs concurrents dans la même requête.
2. **MOYEN** : `proofImageUrl` validé par un simple `@IsUrl()` acceptait des hôtes
   privés/loopback/link-local littéraux (`127.0.0.1`, `169.254.169.254` — metadata cloud,
   `10.x`/`192.168.x`) — risque de désanonymisation d'un vérificateur nommé (balise de
   traçage via chargement d'image) et SSRF latent si un futur traitement serveur lit
   cette URL. Corrigé par un validateur `class-validator` custom (https obligatoire,
   hôtes privés rejetés par motif littéral).
3. `architecture-review` a en plus trouvé une dérive de contrat API réelle
   (`apps/web/src/lib/types.ts` `BountyView` pas synchronisé avec le backend malgré son
   propre commentaire de tête affirmant le contraire — `ratingValue`/`ratingComment`
   absents) et une contradiction documentaire entre `NEXT_SESSION.md` (encore "pas
   encore fait") et `PLAN_EXTENSION.md`/`WORKFLOW_STATUS.md` (déjà "✅ fait") — j'avais
   mis à jour ces deux derniers avant que l'audit ne revienne, erreur de séquencement.
   Les deux corrigés dans le même commit, plus `docs/ARCHITECTURE.md`/`VISION.md`/
   `RESUME_FONCTIONNEL.md`/`CONCOURS.md` qui affirmaient encore Sponsoring "roadmap".

**Vérifié réellement, deux fois** (avant et après le correctif de sécurité, sur des
requêtes HTTP réelles contre une base Postgres+PostGIS isolée fraîche, pas seulement des
mocks) : cycle complet création → refus non-vérificateur → approbation → re-approbation
refusée → liste publique sans fuite de montant/preuve → lecture refusée à un tiers ;
auto-approbation explicitement testée et confirmée bloquée après le fix ; 6 URLs
malveillantes rejetées, 1 URL valide acceptée ; montant hors bornes rejeté proprement
(400, pas 500). `npm run test` 59/59, lint+tsc propres sur les deux apps. Cycle de
migration run/revert/run vérifié sur conteneur isolé. UI réelle ajoutée pour la Notation
(`BountyDetail.tsx`) — **pas encore d'UI pour le Sponsoring** (backend complet et audité,
mais inatteignable depuis l'app pour l'instant).

**Piège opérationnel reconstaté** : plusieurs process `nest start --watch` orphelins
accumulés pendant les tests multi-bases de cette session (même cause déjà documentée
plus haut dans ce fichier — un port réutilisé sans tuer toute la chaîne parent). Nettoyé
via `Get-CimInstance Win32_Process` + kill ciblé avant de relancer proprement.

## 2026-09-04 (suite) — Interface Sponsoring vérifié (rattrape le manque signalé plus haut)

Nouvelle page `apps/web/src/app/sponsoring/page.tsx` : formulaire de soumission, suivi "Mes
demandes", file de vérification (réservée à `role.scope === "national"`), liste publique des
sponsors. Comble l'écart signalé dans l'entrée précédente ("pas encore d'UI pour le
Sponsoring"). Lien de navigation ajouté au `Header` (desktop uniquement). Vérifié réellement :
lint/tsc propres, SSR vérifié par curl (200, contenu attendu présent). Pattern
`eslint-disable-next-line react-hooks/set-state-in-effect` réutilisé tel qu'établi dans
`auth-context.tsx` pour le même cas (effet qui déclenche un fetch async au montage).

## 2026-09-05 — Premiere inspection visuelle reelle (Claude in Chrome) + faille critique trouvee

L'utilisateur a connecte l'extension Claude in Chrome (jamais disponible avant cette session) et
demande explicitement de l'utiliser pour inspecter le rendu reel - premiere fois que l'appli est
vue a l'ecran depuis le debut de ce chantier, apres tout un travail verifie seulement au niveau
code/SSR/tests.

**Faille CRITIQUE trouvee et corrigee** (retour utilisateur : "il faut hover sur les boutons
orange avant de voir ce qui est ecrit, sinon on ne voit rien") : `apps/web/src/app/globals.css`
avait ses regles `a { color: var(--terracotta) }` / `a:hover { color: var(--ink) }` ecrites HORS
de tout `@layer` - dans le modele CSS Cascade Layers, le bucket "non calque" l'emporte TOUJOURS
sur `@layer utilities` de Tailwind, quelle que soit la specificite calculee. Consequence reelle :
tout `<Link>` next/link stylise comme un bouton (`bg-terracotta` + `text-terracotta-ink`, ex.
"Rejoindre la communaute" sur `Header.tsx` et `Hero.tsx`) voyait son texte ecrase en
`--terracotta` (identique au fond) - texte orange sur fond orange, litteralement invisible - et
seul `:hover` (qui active `a:hover`, toujours dans le meme bucket non calque mais plus specifique)
revelait le texte en `--ink`. Corrige en deplacant ces regles dans `@layer base` (avant
`@layer utilities` dans l'ordre Tailwind v4 : theme, base, components, utilities). **Verifie a
l'ecran, pas seulement en theorie** : capture avant/apres montrant le texte "Rejoindre" bien
visible sans survol. Aucun `<button>` n'etait affecte (seuls les `<Link>` passent par la balise
`<a>`) - grep exhaustif confirme uniquement 2 instances touchees, toutes deux corrigees par ce
fix global (pas de patch au cas par cas necessaire).

**Autres corrections du meme echange, toutes verifiees a l'ecran via Claude in Chrome** :
- `MoroccoMap.tsx` : la carte etait entierement monochrome orange (`fill="var(--terracotta)"`
  pour TOUTES les villes quel que soit leur palier de taille) - contribuait a la fatigue visuelle
  signalee ("ca fait tres mal aux yeux"). Introduit `colorFor()` : vert/or/terracotta par palier
  de taille (`tierFor()`), le ring "ville en tete" reste dore independamment. `Hero.tsx` (un point
  de la tagline passe au vert) et `WelcomeIntro.tsx` (carte "Bounties" passee au vert) rebalances
  dans le meme esprit - reduire la dominance orange generale plutot que de choisir une nouvelle
  palette de zero.
- `Header.tsx` : lien "Musique : PlayOnLoop" reformule en "♪ Musique (credit)" avec tooltip
  explicite - retour utilisateur "le lien de la musique mene vers autre chose, ca ne me plait
  pas". Le lien reste (attribution CC-BY 3.0 obligatoire, ne JAMAIS le retirer - verifie que le
  fichier `epic.mp3` est bien local, `apps/web/public/audio/`, pas un stream externe), juste
  reformule pour ne plus ressembler a un controle de lecture.
- `audio-context.tsx` : volume par defaut releve de 0.18 a 0.32. Aucune erreur console associee
  au deverrouillage (verifie via Claude in Chrome), donc le son etait probablement techniquement
  actif mais imperceptible plutot que reellement absent - hypothese la plus probable pour le
  retour "le son ne se joue pas (A15, tout navigateur)", non confirmable a 100% sans test sur
  l'appareil reel de l'utilisateur.
- `WelcomeIntro.tsx`/`globals.css` : logo (`MindClashMark`) en rotation continue (9s/tour, lineaire,
  respecte `prefers-reduced-motion`) sur l'ecran d'accueil - demande utilisateur explicite. Cible
  par classe CSS (`.mc-logo-spin`) plutot que par ID : `MindClashMark` a des `id` SVG internes
  (`mc-pin-grad`/`mc-pin-mask`) dupliques quand le composant est monte 2x sur une meme page
  (Header + WelcomeIntro simultanement) - sans consequence aujourd'hui (memes valeurs des deux
  cotes) mais une regle scopee par ID aurait pu casser silencieusement sur la 2e instance.

**Non resolu, signale honnetement, pas cache** : le bouton "Explorer la carte" n'a pas repondu de
facon fiable a 5 tentatives de clic automatise via Claude in Chrome (coordonnees precises ET
reference d'element via `find`), y compris apres arret complet de toute edition de fichier en
cours (ecartant une explication par Fast Refresh/HMR en cours, hypothese initiale plausible mais
infirmee par ce dernier essai). La carte elle-meme fonctionne une fois atteinte (donnees reelles
des 6 villes CESTOM affichees correctement, verifie visuellement). Conforme aux instructions du
projet sur les rabbit holes d'automatisation navigateur (arreter apres echecs repetes plutot que
de deviner indefiniment) - a confirmer par l'utilisateur avec un clic reel avant de decider si
c'est un artefact de l'automatisation ou un vrai bug.

**Point methodologique confirme une fois de plus** : lint/tsc/tests/SSR au vert ne garantissent
RIEN sur le rendu visuel reel - la faille de contraste ci-dessus etait invisible a tous les outils
utilises dans ce projet jusqu'a aujourd'hui. Voir aussi l'entree du 2026-08-24 (meme lecon, deja
tiree une fois, reconfirmee ici sur un axe different - contraste plutot que composition/mise en
page).

**Verifie reellement** : `npm run lint`/`npx tsc --noEmit` propres sur `apps/web` apres chaque
lot de changements, capture d'ecran avant/apres pour la faille critique, carte re-inspectee apres
le changement de couleurs (rendu confirme correct visuellement avant le blocage sur le clic).
