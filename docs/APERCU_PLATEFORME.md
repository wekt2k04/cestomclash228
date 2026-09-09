# Aperçu de la plateforme — CestomClash228

*Document rédigé pour un lecteur côté client/jury, technique mais pas développeur : comprendre
ce qu'est le produit, s'en faire une idée honnête (forces et limites réelles, pas un pitch
enjolivé), et savoir comment on y navigue. Détail développeur complet dans
`docs/RESUME_FONCTIONNEL.md` (logique) et `docs/ARCHITECTURE.md` (technique). État vérifié
workflow par workflow dans `.claude/HANDOFF/WORKFLOW_STATUS.md`.*

## En une phrase

**"Explore. Partage. Level-up."** — une carte géolocalisée de l'entraide, pas un fil d'actualité
de plus.

## Ce dont il est question (logique métier)

CestomClash228 est une application pensée pour la diaspora étudiante togolaise au Maroc : elle
s'appuie sur les données et la communauté de CESTOM (l'association qui les fédère) et leur rend
un service, sans en être un produit officiel. Le problème qu'elle attaque est concret — un
nouvel arrivant togolais manque des codes locaux essentiels (climat, démarches de préfecture,
attentes académiques marocaines), et l'information qui pourrait l'aider est éparpillée dans des
groupes WhatsApp non indexables ou noyée dans des algorithmes de divertissement, avec en plus un
vrai risque de toxicité en meute sur les petits groupes locaux. La réponse produit est de
remplacer le newsfeed classique par une **Social-Map** : une carte du Maroc où l'entraide est
ancrée par ville plutôt que par ordre chronologique. Deux briques y tournent réellement
aujourd'hui — les **Pins** (bons plans, lieux sûrs, alertes déposés sur une ville) et les
**Bounties** (demandes d'aide chronométrées de 2h/12h/24h, qu'un tiers peut réclamer et
résoudre, avec expiration vérifiée côté serveur, pas juste un compte à rebours à l'écran).
Au-dessus, une couche de gouvernance calque le fonctionnement réel de CESTOM (un rôle national
et des rôles locaux par ville) avec un principe assumé : le pouvoir national est **volontairement
plafonné** — aucune action destructrice (bannir, supprimer) ne peut être déclenchée
unilatéralement par une seule personne. Deux briques économiques réelles complètent l'ensemble :
le **Sponsoring vérifié** (une récompense promise sur une Bounty, débloquée seulement après
vérification d'une preuve de virement par un rôle dédié) et la **Notation** (l'auteur d'une
Bounty résolue note qui l'a aidé) — les débuts d'une réputation qui compte. Le reste de la
vision produit (Ghost Mode anonyme, témoignages vidéo, modération anti-brigading automatique,
relais WhatsApp) est assumé comme feuille de route, pas présenté comme déjà construit.

## Comment ça fonctionne (technique, vue d'ensemble)

Oui, c'en est une : une PWA (application web installable sur le téléphone, pas une app à
télécharger sur un store) composée de deux briques qui se parlent en HTTP/JSON — un frontend
Next.js/React et une API NestJS connectée à PostgreSQL étendu par PostGIS, le moteur qui permet
de stocker les Pins/Bounties par position géographique et de calculer leur ville la plus proche.
Volontairement, ce n'est **pas** une carte interactive façon Google Maps : un premier essai
(MapLibre + tuiles) ne s'affichait pas de façon fiable sur mobile, remplacé par une carte
stylisée dessinée en SVG (plus simple, plus rapide à charger sur une connexion moyenne) — le
clic sur une ville reste réel, seul le zoom/pan libre est sacrifié. L'authentification combine
email+mot de passe (haché, avec limite de tentatives) et Google OAuth (câblé mais pas encore
activé faute de vraies clés) ; le contrôle d'accès (qui peut agir sur quoi) est vérifié côté
serveur systématiquement, jamais seulement caché côté interface. À ce stade, rien n'est déployé
publiquement : tout tourne encore en environnement de développement, accessible seulement en
réseau local — le passage en ligne (paliers gratuits type Vercel/Render/Supabase, pensé
"coût zéro au repos" dès la conception) reste à faire.

## Forces

- **Logique câblée côté serveur pour les zones à risque, pas juste maquettée** : le contrôle
  d'accès par rôle/ville est centralisé et audité, une Bounty ne peut pas être réclamée deux fois
  en même temps (pas de condition de course), l'auteur d'une Bounty ne peut pas la réclamer
  lui-même, et l'expiration est vérifiée par l'horloge du serveur à chaque tentative — pas un
  chiffre cosmétique côté écran.
- **Gouvernance à pouvoir plafonné** : argument de confiance réel, pas seulement affiché — un
  garde-fou explicite contre l'abus d'un rôle national unique, cohérent avec la légitimité
  institutionnelle de CESTOM plutôt qu'une startup externe qui doit acheter la confiance.
- **Deux briques économiques déjà réelles**, pas seulement pitchées : Sponsoring vérifié et
  Notation sont testés bout-en-bout (requêtes HTTP réelles) et audités, pas de simples maquettes.
- **Coût d'infrastructure pensé dès la conception** pour rester à zéro au repos (pas de tâche
  planifiée permanente, compatible paliers gratuits) — cohérent avec un projet étudiant sans
  budget de départ.
- **Effet de réseau spatial assumé comme avantage** : plus la carte se remplit de Pins réels,
  plus elle devient difficile à recréer de zéro pour un concurrent qui partirait d'une carte
  vide.

## Faiblesses et limites actuelles

- **Rien n'est déployé publiquement** — la démo tourne en local/réseau local, pas encore
  accessible par une URL publique.
- **Les chiffres de présence par ville affichés sur la carte sont aujourd'hui aléatoires**, pas
  encore branchés sur une vraie mesure d'activité — décision assumée pour prioriser l'affichage
  d'abord, mais à corriger avant un vrai lancement.
- **La connexion Google ne fonctionne pas encore concrètement** (mécanisme câblé, sans clés
  réelles configurées).
- **La carte est volontairement non-interactive** (SVG stylisé plutôt qu'une vraie carte
  zoomable/déplaçable) — un choix de fiabilité mobile assumé, qui limite l'exploration libre.
- **Plusieurs comportements mobiles sont corrigés dans le code mais pas encore reconfirmés sur un
  appareil réel** (reprise du son après verrouillage d'écran, dégagement sous l'encoche d'un
  iPhone, chevauchement d'étiquettes de villes proches) — aucun outil de test sur appareil
  physique n'est disponible dans l'environnement de développement actuel, donc honnêtement
  marqué comme non confirmé plutôt que déclaré "fait".
- **Une bonne partie de la vision produit reste à construire** : Ghost Mode, témoignages vidéo,
  modération anti-brigading automatique et relais WhatsApp existent en conception détaillée, pas
  en code.
- **La "ville" d'un Pin/Bounty est déduite par proximité au point le plus proche**, pas par de
  vraies frontières administratives — une approximation qui peut se tromper en zone limitrophe.

## Fonctionnalités métier

**Construites et vérifiées (requêtes réelles, pas seulement lues dans le code) :**

1. **Social-Map** — carte des villes couvertes, cliquable, ouvrant la liste réelle des Pins et
   Bounties de la ville choisie.
2. **Pins** — déposer une astuce, un lieu sûr ou une alerte géolocalisée sur une ville.
3. **Bounties** — demande d'aide chronométrée (2h / 12h / 24h) ; réclamable par un tiers (jamais
   par l'auteur) ; résolution possible par l'auteur ou par la personne qui a aidé ; expiration
   automatique vérifiée côté serveur.
4. **RBAC à 2 niveaux** — rôle national (vue large, pouvoir plafonné) et rôle local (scope
   strictement limité à sa ville), calqués sur la structure réelle de CESTOM.
5. **Sponsoring vérifié** — promesse de récompense sur une Bounty, débloquée seulement après
   validation d'une preuve de virement par un rôle vérificateur dédié.
6. **Notation** — l'auteur d'une Bounty résolue note (1 à 5, une seule fois) la personne qui l'a
   aidé.
7. **Authentification** — email + mot de passe haché ; Google OAuth câblé mais inactif.
8. **Ambiance sonore contextuelle** — fond musical avec contrôle mute permanent, pas un gadget
   silencieux.

**En feuille de route (conçues, pas construites — présentées comme telles) :**

- **Ghost Mode** — anonymat réversible, pensé pour la majorité silencieuse (~70% du public visé)
  qui hésite à s'exposer publiquement.
- **Reality-Vlogs** — témoignages vidéo courts.
- **Modération anti-brigading** — quarantaine automatique déclenchée par un algorithme
  multi-villes (jamais par un admin seul), contre le harcèlement coordonné.
- **Pont de notification WhatsApp** — relais automatique vers les groupes CESTOM existants quand
  un contenu dépasse un seuil de viralité.

## Workflows de navigation

La plateforme n'a que quelques vraies pages (routes) séparées — la majorité du parcours se fait
par des panneaux qui glissent par-dessus l'écran courant (mêmes mécanique de fermeture partout :
clic en dehors, ou bouton retour du téléphone/navigateur), pas par des rechargements de page.

1. **Arrivée** (`/`) — un visiteur non connecté voit d'abord un écran d'accueil dédié (pas
   directement la carte), avec un bouton "Explorer". Un membre déjà connecté saute directement à
   l'étape suivante.
2. **Exploration** — la carte du Maroc s'affiche (villes cliquables, taille proportionnelle à la
   présence). Clic sur une ville → un panneau s'ouvre avec la liste réelle de ses Pins et
   Bounties.
3. **Détail** — clic sur un Pin ou une Bounty dans ce panneau → un second panneau de détail
   s'ouvre (même mécanique) ; sur une Bounty, les actions proposées (prendre en charge / résoudre
   / noter) dépendent du statut de la Bounty (Ouverte / Prise en charge / Résolue / Expirée, avec
   un code couleur dédié) et du rôle de la personne connectée.
4. **Créer** — un bouton "Créer" flottant, toujours atteignable, ouvre un formulaire de dépôt
   (Pin ou Bounty), pré-rempli avec la ville déjà sélectionnée si applicable. Si personne n'est
   connectée, ce bouton redirige d'abord vers la connexion plutôt que d'ouvrir le formulaire.
5. **Compte** — connexion (`/login`) et inscription (`/signup`) accessibles depuis l'en-tête à
   tout moment, avec une page de callback dédiée pour le retour d'authentification Google.
6. **Sponsoring** — page séparée (`/sponsoring`), accessible depuis l'en-tête, pour consulter/
   proposer une récompense vérifiée sur une Bounty.

## Pour aller plus loin

- Logique métier détaillée, écran par écran : `docs/RESUME_FONCTIONNEL.md`.
- Décisions d'architecture et leurs raisons : `docs/ARCHITECTURE.md`.
- Étude de marché, chiffrage, projections : `docs/BUSINESS_PLAN.md`.
- Calendrier et règles du concours CréaAfrica : `docs/CONCOURS.md`.
- État vérifié vs à reconfirmer, workflow par workflow : `.claude/HANDOFF/WORKFLOW_STATUS.md`.
