# MindClash 228 — Résumé fonctionnel

*Ce que fait le produit aujourd'hui, expliqué en logique métier plutôt qu'en termes techniques.
Mis à jour le 2026-08-23. Détail technique complet dans `docs/ARCHITECTURE.md` et
`.claude/HANDOFF/LOG.md`.*

## Ce qui existe

Une application où un étudiant togolais au Maroc peut créer un compte, voir une carte du Maroc
avec la présence par ville, déposer une astuce ou lancer une demande d'aide géolocalisée, et
aider quelqu'un d'autre. Une couche de gouvernance (rôles national/local) existe en dessous,
calquée sur le fonctionnement réel de CESTOM. Testée en conditions réelles sur PC et téléphone
(réseau local) le 2026-08-23.

## Comment ça marche

**Créer un compte.** Par email + mot de passe, ou en un clic via Google (cette dernière option
ne fonctionne pas encore concrètement — voir remarques). Compte créé et connexion immédiate,
pas de validation par email pour l'instant (volontaire pour le MVP).

**La carte du Maroc.** Une carte stylisée (pas une carte interactive type Google Maps) montrant
les 12 villes universitaires couvertes, chacune avec un cercle indiquant le nombre de personnes
présentes. **Ces chiffres sont pour l'instant aléatoires** — pas encore reliés à une vraie
mesure d'activité. Cliquer sur une ville ouvre la liste réelle des astuces ("Pins") et demandes
d'aide ("Bounties") de cette ville. *Changement du 2026-08-23 : remplace une carte interactive
qui ne s'affichait pas de façon fiable sur téléphone — voir remarques.*

**Déposer une astuce (Pin).** Bon plan, lieu sûr, piège administratif à éviter, ou alerte —
associé à la ville choisie lors de la création.

**Les Bounties (demandes d'aide chronométrées).** Une personne lance une demande ("besoin d'un
binôme pour déboguer avant 18h") avec un délai au choix : 2h, 12h ou 24h. Une autre personne
peut la réclamer — sauf l'auteur lui-même. Une fois réclamée, l'auteur *ou* la personne qui a
aidé peut la marquer comme résolue. Si personne ne la réclame avant le délai, elle expire
automatiquement et devient impossible à réclamer — le serveur vérifie réellement l'heure à
chaque tentative, ce n'est pas juste un chiffre à l'écran. Si deux personnes tentent de
réclamer exactement en même temps, une seule y arrive.

**Les rôles (SG local / Bureau national).** Un membre ordinaire n'a aucun privilège particulier.
Un rôle local ne peut agir que sur sa propre ville. Le rôle national peut voir plus large —
**mais ne peut pas** supprimer le Pin ou intervenir sur la Bounty de quelqu'un d'autre sans son
accord : seul l'auteur d'un contenu, ou un rôle local sur son propre territoire, peut le
supprimer. C'est volontaire : le pouvoir central est plafonné pour éviter les abus.

**L'ambiance sonore.** Une musique de fond démarre automatiquement dès la première interaction
avec l'application (impossible de la faire jouer avant — c'est une règle des navigateurs,
aucun site ne peut l'éviter), à faible volume, avec un fondu enchaîné qui masque le point où
elle boucle plutôt qu'une coupure nette. Un bouton permet de la couper. Piste "Battle March"
(PlayOnLoop, licence avec crédit visible dans l'en-tête de l'app).

## Remarques à prendre en compte

- **Testé en vrai sur PC et téléphone** (via le réseau local, pas encore en ligne) — un vrai bug
  a été trouvé et corrigé de cette façon (l'API rejetait à tort les demandes de Bounties
  filtrées par statut). Le son ne fonctionnait pas non plus sur téléphone au premier essai,
  corrigé aussi.
- **La connexion Google ne fonctionne pas encore concrètement** : le mécanisme est câblé mais il
  manque de vraies clés Google (à obtenir sur la console développeur Google).
- **Les chiffres de présence par ville sur la carte sont aléatoires** — décision explicite pour
  se concentrer d'abord sur l'affichage, à relier à une vraie mesure plus tard.
- **La ville d'un Pin/Bounty est déduite par "ville la plus proche"**, pas par de vraies
  frontières administratives.
- **Rien n'est déployé publiquement.** Tout tourne en local (PC + réseau Wi-Fi local). Le
  passage en ligne (Vercel/Railway/Supabase, voir `docs/STACK.md`) reste à faire.
- **Ce qui n'existe pas encore**, volontairement laissé pour plus tard : Ghost Mode (anonymat
  réversible), Reality-Vlogs (vidéos), modération anti-brigading automatique, sponsoring
  (Pins dorés), pont de notification WhatsApp. Le pitch deck (`pitch/MindClash228-Pitch.pptx`)
  les présente comme une feuille de route, pas comme déjà construits.
- **La démo du pitch deck est un espace réservé** — pas encore de vraie capture d'écran de
  l'application à jour (carte redessinée depuis).
