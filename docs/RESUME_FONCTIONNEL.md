# MindClash 228 — Résumé fonctionnel

*Ce que fait le produit aujourd'hui, expliqué en logique métier plutôt qu'en termes techniques.
Mis à jour le 2026-08-23. Détail technique complet dans `docs/ARCHITECTURE.md` et
`.claude/HANDOFF/LOG.md`.*

## Ce qui existe

Une application où un étudiant togolais au Maroc peut créer un compte, voir une carte du Maroc
peuplée d'astuces et de demandes d'aide géolocalisées, et participer : déposer une astuce,
lancer une demande d'aide chronométrée, aider quelqu'un d'autre. Une couche de gouvernance
(rôles national/local) existe en dessous, calquée sur le fonctionnement réel de CESTOM.

## Comment ça marche

**Créer un compte.** Par email + mot de passe, ou en un clic via Google. Dans les deux cas, un
compte est créé et la personne est connectée immédiatement — pas de validation par email pour
l'instant (volontaire pour le MVP, à durcir avant un vrai déploiement).

**La carte (Social-Map).** Chaque astuce ("Pin" : bon plan, lieu sûr, piège administratif à
éviter, alerte) est déposée à un endroit précis. Le système déduit automatiquement dans quelle
ville elle se trouve — pas besoin de le préciser soi-même. Quand plusieurs Pins sont proches les
uns des autres, la carte les regroupe visuellement en un seul point avec un compteur (pour ne
pas la surcharger), et se détaille au fur et à mesure qu'on zoome.

**Les Bounties (demandes d'aide chronométrées).** Une personne lance une demande ("besoin d'un
binôme pour déboguer à la bibliothèque avant 18h") avec un délai au choix : 2h, 12h ou 24h. Une
autre personne peut la réclamer — sauf l'auteur lui-même, on ne peut pas s'aider soi-même. Une
fois réclamée, l'auteur *ou* la personne qui a aidé peut la marquer comme résolue. Si personne
ne la réclame avant le délai, elle expire automatiquement et devient impossible à réclamer — ce
n'est pas juste un chiffre qui tourne à l'écran, le serveur vérifie réellement l'heure à chaque
tentative. Si deux personnes tentent de réclamer exactement en même temps, une seule y arrive
(pas de conflit possible).

**Les rôles (SG local / Bureau national).** Un membre ordinaire n'a aucun privilège particulier.
Un rôle local ne peut agir que sur sa propre ville. Le rôle national peut voir plus large — mais
**ne peut pas** supprimer le Pin ou intervenir sur la Bounty de quelqu'un d'autre sans son accord
: seul l'auteur d'un contenu, ou un rôle local sur son propre territoire, peut le supprimer. C'est
volontaire (décision du 2026-08-22) : le pouvoir central est plafonné pour éviter les abus, même
si techniquement le système "fait confiance" au rôle national sur d'autres aspects (statistiques,
mise en avant de contenu).

**L'ambiance sonore.** Le mécanisme est prêt (un son de fond qui pourrait s'activer au premier
geste de l'utilisateur, avec un bouton pour couper) mais il n'y a pas encore de vrai fichier
audio choisi — donc silencieux pour l'instant.

## Remarques à prendre en compte

- **Rien n'a été vérifié à l'œil dans un vrai navigateur.** Le backend a été testé en conditions
  réelles (vrai serveur, vraie base de données) pour chaque fonctionnalité. Le frontend, lui, a
  seulement été vérifié par la compilation et par des requêtes techniques (pas d'outil de
  navigateur disponible dans cette session — proposé, mais pas activé). Il faut le lancer et le
  parcourir avant de le considérer fiable visuellement.
- **La connexion Google ne fonctionnera pas encore** : le mécanisme est câblé mais il manque de
  vraies clés Google (à obtenir sur la console développeur Google).
- **La ville d'un Pin/Bounty est déduite par "ville la plus proche"**, pas par de vraies
  frontières administratives — un point pile entre deux villes pourrait être mal classé.
  Suffisant pour une démo, à affiner si ça devient un vrai souci en usage réel.
- **Rien n'est déployé.** Tout tourne en local (base de données locale, pas de compte cloud). Le
  passage en ligne (Vercel/Railway/Supabase, voir `docs/STACK.md`) reste à faire.
- **Ce qui n'existe pas encore**, volontairement laissé pour plus tard : Ghost Mode (anonymat
  réversible), Reality-Vlogs (vidéos), modération anti-brigading automatique, sponsoring
  (Pins dorés), pont de notification WhatsApp. Le pitch deck (`pitch/MindClash228-Pitch.pptx`)
  les présente comme une feuille de route, pas comme déjà construits.
- **La démo du pitch deck est un espace réservé** — pas encore de vraie capture d'écran de
  l'application, en attendant la vérification visuelle ci-dessus.
