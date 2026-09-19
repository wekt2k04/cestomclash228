# Post-Mortem & Document d'Architecture — CestomClash228

*Rédigé le 2026-09-19 en tant que radiographie technique complète du projet, pas un manuel
utilisateur. Chaque affirmation ci-dessous est sourcée sur l'historique réel du dépôt
(`.claude/HANDOFF/LOG.md`, les commits git, le code actuel) — là où ma connaissance directe
s'arrête (l'amorçage initial du projet, la décision précise du pivot d'hébergement), je le dis
explicitement plutôt que de reconstituer un récit inventé. Discipline du projet, tenue ici comme
partout ailleurs : aucun chiffre non vérifié, aucune affirmation non sourcée.*

---

## 1. Genèse et évolution chronologique

### 1.1 Cadrage initial

Le projet suit dès son premier commit ("Cadrage initial") la méthodologie propre à ce dépôt
(`CLAUDE.md`) : palier **Système** — multi-composants, repris entre sessions, enjeux réels —
donc documentation de cadrage (`VISION.md`, `STACK.md`, `ARCHITECTURE.md`) puis construction
incrémentale, chaque incrément vérifié avant d'être loggué comme fait. Le principe directeur
posé dès le départ, et qui explique la quasi-totalité des choix d'infrastructure décrits en
section 2 : un palier gratuit d'hébergement à tenir strictement, sans carte bancaire engagée nulle
part, avec une hypothèse de charge (utilisateurs actifs Année 1) largement sous les seuils
documentés par les fournisseurs cloud.

### 1.2 Le pivot d'infrastructure : Vercel/Supabase → Firebase Hosting + Render + Neon/PostGIS

Les toutes premières versions des documents de cadrage de ce projet référençaient une pile
**Vercel (frontend) + Supabase (backend/DB)** — trace encore visible début septembre 2026 dans
d'anciennes versions d'`ARCHITECTURE.md`/`STACK.md`, et dans une réponse de Q&A du script oral du
pitch que j'ai moi-même trouvée et corrigée le 2026-09-11 (elle citait encore "la base de données
se met en pause après une semaine d'inactivité" — un comportement Supabase, pas Neon). Je n'ai pas
de trace de première main du moment exact ni du raisonnement détaillé de ce pivot (antérieur à ma
fenêtre d'observation directe de ce projet) — ce que le projet documente, et que je peux confirmer
comme motivation cohérente avec toutes les décisions ultérieures observées : la viabilité stricte
du palier gratuit. Concrètement, la pile retenue et **actuellement en production** :

- **Firebase Hosting** (frontend) — hébergement statique pur, aucun serveur qui tourne, donc
  aucune notion de mise en veille côté frontend.
- **Render** (backend) — un vrai processus serveur (NestJS), palier gratuit avec mise en veille
  après inactivité (voir section 2.3).
- **Neon** (base de données) — Postgres serverless avec l'extension **PostGIS**, palier gratuit.

Ce choix n'est pas neutre techniquement : Supabase encapsule Postgres derrière sa propre couche
(API auto-générée, auth intégrée) ; Neon expose un Postgres nu, ce qui est précisément ce dont ce
projet a besoin pour piloter PostGIS et des requêtes SQL atomiques à la main (section 3.3) sans
lutter contre une couche d'abstraction supplémentaire.

### 1.3 Construction incrémentale (résumé chronologique vérifié sur `LOG.md`)

| Date | Incrément | Ce qui a été construit |
|---|---|---|
| 2026-08-22/25 | Fondations | RBAC spatial centralisé (deux niveaux : national/local), migrations TypeORM réelles (jamais `synchronize: true`) — "Incrément 0". |
| 2026-08-23 | Polish MVP | Ambiance sonore (Web Audio API, moteur de boucle à fondu enchaîné), premiers correctifs mobile (déverrouillage audio). |
| 2026-08-24/25 | Refonte visuelle | Passage à une direction visuelle "carnet de terrain" puis identité de marque propre, carte SVG faite main (remplace une carte interactive qui ne s'affichait pas de façon fiable). |
| 2026-09-04 | Sponsoring + Notation | Premier mécanisme de revenu réel (preuve de virement + vérification humaine), notation 1-5 sur les Bounties résolues. |
| 2026-09-05 | Premier audit visuel réel | Extension Claude in Chrome branchée pour la première fois — trouve un bug CSS Cascade Layers sérieux (texte de bouton invisible) **invisible à `lint`/`tsc`/`build`/SSR**, leçon méthodologique retenue explicitement : un outil de rendu réel est indispensable avant d'annoncer un incrément visuel "vérifié". |
| 2026-09-09 | Premier déploiement public | Neon + Render + Firebase Hosting mis en ligne pour la première fois ; refonte marketplace (Bounty étendue avec `kind`/`priceMad`/`isRemote`/`category`). |
| 2026-09-09 (suite) | Audit post-déploiement | Bug de déconnexion instantanée (2 causes distinctes corrigées), cache HTML cassé après déploiement (Firebase servait le HTML en cache 1h — un visiteur qui rechargeait après une mise à jour recevait un `ChunkLoadError`). |
| 2026-09-09/10 | Fiabilité + UX | Ping keep-alive Render, polling passif 20s, cartes/statuts colorés, **bug de navigation préexistant sérieux** trouvé et corrigé (voir section 3.2). |
| 2026-09-10 | Marketplace payant réel | Moteur complet offres/confiance/paiement/chat (section 2.4 et 3.4), peuplement de contenu réaliste, nettoyage des comptes de test en production. |
| 2026-09-11 | Audit de robustesse production | 3 commits jamais poussés retrouvés, **bug d'expiration des Bounties semées** trouvé (durée de vie pensée pour un test immédiat, pas pour tenir jusqu'au jury — cf. section 4.2), fiabilité réelle du keep-alive Render mesurée et corrigée (section 4.2). |
| 2026-09-12 | Robustesse finale + pitch | Correctif de démarrage silencieux (`main.ts`), correctif de déverrouillage audio iOS/WebKit, finalisation du deck de pitch (QR code, logos). |
| 2026-09-13 | Jour de présentation | Peuplement final proportionnel à l'effectif réel par ville, vérification de santé du système déployé. |

---

## 2. Cartographie de l'architecture déployée

### 2.1 Séparation frontend/backend

Le dépôt est un monorepo à deux packages indépendants, **deux process distincts, deux modes de
déploiement distincts** :

- `apps/web` — Next.js (React), **export statique**, aucun rendu serveur à l'exécution. Déployé
  sur Firebase Hosting par une commande manuelle explicite (`firebase deploy`) après chaque
  changement — jamais de déploiement automatique côté frontend.
- `apps/api` — NestJS (Node/TypeScript), un vrai serveur HTTP qui écoute en continu (tant qu'il
  n'est pas mis en veille, voir 2.3). Se redéploie automatiquement sur Render à chaque `git push`
  sur `main` (comportement observé à chaque cycle de ce projet ; configuré une fois sur
  l'interface Render, non revérifiable avec certitude absolue depuis ce dépôt).

Cette asymétrie de déploiement (manuel côté front, automatique côté back) n'est pas un oubli —
c'est une conséquence directe du fait que Firebase Hosting n'a aucun lien natif avec ce dépôt
GitHub, alors que Render est directement connecté au dépôt.

### 2.2 Le moteur géospatial PostGIS

Chaque `Pin` et chaque `Bounty` porte une colonne `location` de type `geography` PostGIS (point,
SRID 4326) — jamais lue directement en JavaScript (c'est du WKB brut), toujours reconstruite côté
SQL via `ST_X`/`ST_Y`. La ville d'un Pin/Bounty n'est **jamais choisie par le client** : elle est
déduite automatiquement à la création par plus-proche-voisin réel (`CitiesService.findNearest`,
opérateur PostGIS `<->`), une seule fonction faisant autorité sur cette question dans tout le
projet — condition explicitement posée dans `ARCHITECTURE.md` pour que le RBAC spatial et le
regroupement par ville ne divergent jamais silencieusement s'ils étaient recalculés ailleurs.

**Bug réel trouvé et corrigé** (revue d'architecture, 2026-08-25) : avant la pose d'un index
spatial GiST sur `cities.centerPoint`, cette recherche de plus proche voisin déclenchait un scan
séquentiel complet de la table à **chaque** création de Pin/Bounty. L'index corrige ça
structurellement — non mesuré en charge réelle (aucun volume de production ne le justifie encore),
mais la correction est la bonne pratique standard pour ce type de requête.

La carte du frontend (bbox de la fenêtre affichée) interroge le backend via `ST_Intersects` +
`ST_MakeEnvelope` — même moteur, même table, aucune couche de cache géospatial séparée à
maintenir en cohérence.

### 2.3 Scale-to-zero et la mitigation de la mise en veille

Render (palier gratuit) met le service backend en veille après **~15 minutes** sans trafic, avec
un redémarrage à froid de 30 à 60 secondes au premier appel suivant — un fait vérifié en direct
cette session (temps de réponse mesuré avant/après une période d'inactivité), pas une hypothèse
issue de la documentation Render seule.

**Historique du correctif, avec son propre échec intermédiaire** (exactement le genre de détail
qu'un document "sans concession" doit contenir) :

1. **Première tentative** : un workflow GitHub Actions (`*/10 * * * *`) pingant `/health` toutes
   les 10 minutes.
2. **Cette tentative a été mesurée, pas supposée fonctionnelle** : `gh run list` sur l'historique
   réel des exécutions a montré un écart moyen réel de **164 minutes** entre deux exécutions
   (jusqu'à 298 minutes de creux), très loin des 10 minutes déclarées — limite documentée de
   GitHub Actions sur les schedules très fréquents, surtout pour un dépôt à activité irrégulière.
   **Ce correctif ne protégeait donc quasiment jamais réellement le service.**
3. **Correctif réel** : un service de ping externe dédié (cron-job.org), toutes les 5 minutes,
   nettement sous le seuil de 15 minutes de Render. Le workflow GitHub Actions original est laissé
   en place comme redondance inoffensive, mais n'est plus le mécanisme dont dépend la
   disponibilité réelle du service.

### 2.4 Le sous-système marketplace payant (construit le 2026-09-10)

Trois tables ajoutées par une seule migration (`1788700000000-AddBountyInterestsAndChat`),
zéro colonne existante modifiée : `bounty_interests` (une proposition d'aide sur une Bounty
payante), `conversations` et `messages` (chat activé uniquement après confirmation de paiement).
Le cycle complet : proposition → sélection par l'auteur sur la base d'un badge de confiance
**calculé** (agrégation SQL sur l'historique réel de Bounties résolues, aucune nouvelle colonne de
profil éditable) → preuve de paiement (lien vers une image déjà hébergée — même limitation déjà
acceptée pour le Sponsoring, aucune infrastructure de stockage de fichiers dans ce projet) →
confirmation → activation du chat, filtré (section 3.5).

---

## 3. Matrice des décisions et trade-offs

### 3.1 Polling client (20s) vs WebSocket

| | WebSocket | Polling client (retenu) |
|---|---|---|
| Connexion | Persistante, maintenue ouverte | Aucune — une requête HTTP ponctuelle |
| Coût sur Render gratuit | Le palier gratuit ne peut pas tenir un grand nombre de connexions persistantes ouvertes sans dégrader le service ou nécessiter un palier payant | Une requête légère toutes les 20 secondes, coût marginal quasi nul |
| Latence perçue | Quasi instantanée | Jusqu'à 20 secondes de délai |
| Complexité d'implémentation | Gestion de reconnexion, de l'état de connexion, scaling horizontal plus délicat | Une constante (`POLL_INTERVAL_MS`) réutilisée partout, un pattern `{quiet?: boolean}` pour ne jamais faire basculer l'UI en erreur sur un échec de poll en arrière-plan |

**Décision** : le compromis (jusqu'à 20s de latence contre zéro connexion persistante à faire
tourner) est jugé acceptable pour un produit d'entraide asynchrone — personne n'attend une réponse
à la milliseconde près sur une demande d'aide. Ce compromis est **assumé et communiqué comme tel**
en Q&A jury, pas caché.

### 3.2 Écriture atomique (compare-and-swap SQL) vs logique applicative

C'est le pattern le plus réutilisé de tout le backend, appliqué à chaque transition d'état
sensible à la concurrence (`BountiesService.claim()`, `SponsorshipService.applyDecision()`,
`BountyInterestsService.accept()`) :

```sql
UPDATE bounty_interests SET status = 'accepted'
WHERE id = $1 AND status = 'pending'
RETURNING id
```

Une architecture "lire l'état, décider en JavaScript, puis écrire" a été **écartée
délibérément** : entre la lecture et l'écriture, une fenêtre existe où un autre acteur peut agir —
deux personnes qui réclament la même Bounty, ou pire, deux propositions différentes acceptées pour
la même Bounty. La requête conditionnelle porte la décision ET l'écriture dans le même
aller-retour SQL ; Postgres garantit qu'aucune deuxième requête ne peut s'intercaler.

**Ce pattern seul ne suffisait pas dans un cas précis, et la faille a été trouvée avant mise en
production, pas après** : un `WHERE status = 'pending'` protège contre la réacceptation de LA
MÊME ligne, mais pas contre l'acceptation concurrente de **deux propositions différentes** pour la
même Bounty (deux lignes distinctes, aucun verrou naturel entre elles). Résolu par un **index
unique partiel Postgres** :

```sql
CREATE UNIQUE INDEX "UQ_bounty_interests_one_accepted_per_bounty"
  ON bounty_interests ("bountyId") WHERE status = 'accepted';
```

La deuxième acceptation concurrente lève une violation de contrainte (`23505`), interceptée
proprement en réponse 409. **Ceci n'est pas resté une garantie théorique** : un test e2e force
littéralement deux appels `accept()` strictement parallèles (`Promise.allSettled`) sur la même
Bounty et vérifie qu'exactement un des deux réussit (200) et l'autre échoue proprement (409) —
jamais les deux, jamais aucun.

### 3.3 SQL brut vs ORM pour les opérations critiques

TypeORM est utilisé pour le mapping d'entités standard, mais **chaque opération impliquant
PostGIS ou une transition d'état atomique passe par `Repository.query()`/`DataSource.query()` en
SQL brut**, jamais par l'API d'update de l'ORM. Raison : l'abstraction ORM standard ne donne pas
le contrôle nécessaire sur la clause `WHERE` conditionnelle qui fait toute la valeur du pattern
décrit en 3.2, ni sur les fonctions géospatiales (`ST_X`, `ST_MakePoint`, `<->`) qui n'ont pas
d'équivalent typé de premier ordre dans TypeORM.

**Piège rencontré et documenté à l'endroit exact où il mord** : pour une requête mutante avec
`RETURNING`, `Repository.query()` renvoie un tuple `[rows, rowCount]` — pas directement le
tableau de lignes comme pour un `SELECT`. Une version standalone de `DataSource.query()` (utilisée
dans les scripts de peuplement, hors du contexte NestJS) a le comportement **inverse** : elle
renvoie directement le tableau. Un script de peuplement a réellement été affecté par cette
divergence (chaque ligne se déclarait "déjà existante" alors que l'insertion réussissait) —
corrigé par une vérification défensive de forme, pas par une supposition.

### 3.4 Preuve de virement + vérification humaine vs passerelle de paiement tierce

| | Passerelle tierce (Stripe/CMI...) | Preuve + vérification humaine (retenu) |
|---|---|---|
| Coût | 1,5 à 3 % par transaction + frais fixes | 0 % |
| Prérequis | Compte marchand, souvent inaccessible sans société immatriculée | Un compte bancaire CESTOM existant suffit |
| Friction | Faible pour l'utilisateur, intégration technique non triviale | Un délai humain de vérification, goulot d'étranglement assumé (section 4.2) |
| Fraude | Gérée par le tiers | Vérification manuelle contre le relevé bancaire réel, pas seulement la capture soumise |

**Décision** : cohérente avec la contrainte de palier 100% gratuit posée dès le cadrage (section
1.1) — toute solution avec passerelle tierce aurait cassé cette contrainte ou ajouté une
dépendance à un compte marchand hors de portée à ce stade.

### 3.5 Filtre anti-désintermédiation : regex ciblées vs détection générique

Le filtre (`contact-filter.ts`) qui bloque les échanges de coordonnées dans le chat aurait pu
être un simple `/\d{2,}/` généraliste — **écarté délibérément** : ça aurait bloqué à tort une
heure de rendez-vous ("15h30") ou un numéro de chambre ("chambre 204"), des faux positifs
plausibles et fréquents dans ce contexte d'usage précis. Motifs ciblés à la place (format réel
d'un numéro marocain/togolais, format email, mots-clés de messagerie), vérifiés explicitement
contre ces faux positifs par une suite de tests dédiée. Rejet net (400) choisi plutôt qu'une
rédaction silencieuse du message — l'utilisateur sait immédiatement que son message n'est pas
parti, ne le renvoie pas autrement en pensant que le contournement a fonctionné.

---

## 4. Audit des forces et faiblesses

### 4.1 Garanties de robustesse

- **Protection réelle, testée, contre la double-acceptation concurrente** d'une proposition de
  Bounty (section 3.2) — pas une garantie de papier, vérifiée par un test de concurrence forcée.
- **Filtre anti-désintermédiation** qui protège directement le modèle économique, avec faux
  positifs vérifiés explicitement plutôt que supposés absents.
- **83 tests automatisés côté backend** (61 unitaires + 22 de bout en bout contre un serveur
  réellement lancé), incluant des cas négatifs obligatoires par discipline de projet (mot de passe
  invalide, Bounty expirée non réclamable, auto-acceptation bloquée, non-participant exclu du
  chat) — pas seulement le chemin nominal.
- **Discipline de vérification comportementale réelle**, pas seulement statique : deux bugs
  sérieux (le Cascade Layers CSS de la section 1.3, et un bug de corruption de l'historique de
  navigateur trouvé le 2026-09-09) étaient **tous deux invisibles à `lint`/`tsc`/`build`/SSR** —
  trouvés uniquement par une inspection réelle dans un navigateur. La leçon a été appliquée de
  façon répétée depuis, y compris pour le correctif de démarrage backend et le correctif audio
  iOS (section 4.2) : jamais "ça devrait marcher" sans une vérification en conditions réelles.

### 4.2 Faiblesses assumées, sans détour

- **Aucune vérification technique d'identité à l'inscription.** N'importe quel email valide et un
  mot de passe suffisent à créer un compte — rien ne garantit techniquement qu'un utilisateur
  appartient réellement au réseau CESTOM. La confiance repose aujourd'hui sur le canal de
  distribution (le groupe WhatsApp CESTOM, fermé à la communauté réelle), pas sur un contrôle en
  base. C'est une vraie limite du MVP actuel, assumée explicitement plutôt que dissimulée en Q&A
  jury.
- **Goulot d'étranglement humain sur la vérification du Sponsoring.** Un seul rôle vérificateur
  aujourd'hui — ne tient pas à un volume de demandes élevé. Mitigation prévue mais non construite :
  ouvrir la vérification à plusieurs personnes habilitées dès que le volume le justifie.
- **Mise en veille et redémarrage à froid du backend.** Mitigée (section 2.3) mais pas éliminée :
  la mitigation dépend d'un service tiers externe (cron-job.org) hors du contrôle direct de
  l'infrastructure du projet — une panne de ce service tiers réintroduirait le problème sans
  qu'aucune alerte ne le signale aujourd'hui.
- **Expiration "paresseuse" des Bounties — un vrai bug de production déjà vécu, pas seulement un
  risque théorique.** Le mécanisme lui-même (matérialisation à la lecture, pas de cron) est un
  choix architectural cohérent avec le scale-to-zero (section 2.3). Mais le contenu de démonstration
  semé le 2026-09-10 avait reçu une durée de vie pensée pour un test immédiat (12-24h) — un audit
  de routine le 2026-09-11 a découvert que la moitié des Bounties semées avaient déjà expiré (donc
  **disparu de tous les onglets de l'interface**, aucun n'affichant le statut "expired") et que le
  reste expirait dans les heures suivantes, pile avant la présentation jury. Corrigé en urgence.
  Leçon retenue : peupler une base avec des dates d'expiration courtes pour un test, puis ne
  jamais revérifier leur état avant un jalon important, est exactement le genre de détail qui
  casse silencieusement une démo — invisible à tout test automatisé.
- **Aucun test de charge réel.** Toute l'argumentation de tenue à l'échelle (polling léger, SQL
  atomique sans verrou applicatif, paliers gratuits dimensionnés pour largement couvrir le SOM
  Année 1 visé) repose sur un raisonnement architectural, pas sur une mesure de charge réelle —
  aucun volume de production ne le justifie encore. À dire tel quel si la question est posée,
  jamais présenté comme prouvé.
- **Pas de supervision centralisée des erreurs.** Le correctif du 2026-09-12 sur `main.ts`
  (journalisation explicite de tout échec de démarrage) réduit le risque de panne silencieuse au
  démarrage, mais il n'existe aujourd'hui aucun service de monitoring d'erreurs (type Sentry) — la
  seule visibilité sur un incident en production reste les logs bruts de Render, consultés
  manuellement.

---

*Sources : `.claude/HANDOFF/LOG.md`, historique git, code du dépôt au 2026-09-19,
`docs/APPRENTISSAGE/top-15-fichiers-maitres.md`, `docs/REVISION_JURY.md`.*
