# VISION — MindClash 228

**Cible :** Concours CréaAfrica (démo, échéance < 1 mois) puis déploiement réel pour CESTOM
(Communauté des Étudiants et Stagiaires Togolais au Maroc).

Canevas stratégique complet : [docs/LEAN_CANVAS.md](LEAN_CANVAS.md).
Identité visuelle : voir le lien publié dans `.claude/HANDOFF/NEXT_SESSION.md`.

## Le produit

**"Explore. Partage. Level-up."** Une PWA géolocalisée pour la diaspora étudiante togolaise
au Maroc : une carte interactive ("Social-Map") remplace le newsfeed classique. L'entraide et
le vécu du terrain sont ancrés spatialement plutôt que noyés dans des groupes WhatsApp
chaotiques ou des algorithmes de divertissement.

## Le problème

- **Isolement / choc culturel** : les nouveaux arrivants togolais manquent des codes locaux
  essentiels (climat, bureaucratie des préfectures, attentes académiques marocaines).
- **Information fragmentée** : WhatsApp non indexable, TikTok distrait, plateformes
  institutionnelles trop froides/asynchrones pour l'urgence du quotidien.
- **Toxicité en meute** : risque de cyberharcèlement et signalements abusifs coordonnés par
  des groupes locaux restreints.

## Public cible

- **Freshmen** (nouveaux arrivants, anxieux) — consomment le contenu de survie, émettent des
  Bounties.
- **Vétérans** (fin de cycle) — cherchent réputation et legacy avant le marché du travail.
- **Majorité silencieuse** (~70%) — timides, syndrome de l'imposteur → cible du Ghost Mode
  (hors périmètre du MVP, voir ci-dessous).
- **Gouvernance CESTOM** : Bureau Exécutif central (9 rôles, mandat 2 ans) et bureaux locaux
  (SG/délégués, taille variable selon la ville).

## Avantage déloyal

Légitimité institutionnelle instantanée (le produit est codé autour des statuts réels de
CESTOM, pas une startup externe qui doit acheter la confiance). Effet de réseau spatial : plus
la carte se remplit de Pins, plus elle devient irremplaçable — une carte concurrente naît vide
(cold start).

## Périmètre du premier incrément (démo pitchable, < 1 mois)

Décision actée (2026-08-22) — **noyau ultra-serré**, tout le reste en mock/roadmap pour le
pitch (mais détaillé dans le futur `.pptx`) :

| Fonctionnalité | Statut MVP |
|---|---|
| Social-Map (PostGIS, clustering, MapLibre) | **Réel** |
| Bounties (créer / réclamer / résoudre / expirer) | **Réel** |
| Auth (email+mot de passe + Google OAuth) | **Réel** |
| RBAC à 2 niveaux (national / local), pouvoir national volontairement limité | **Réel** |
| Reality-Vlogs (upload vidéo, Cloudflare R2) | Roadmap / pitch uniquement |
| Ghost Mode (anonymat réversible, Redis) | Roadmap / pitch uniquement |
| Modération anti-brigading (>6 signalements/6 villes) | Roadmap / pitch uniquement |
| Sponsoring (Pins dorés) | Roadmap / pitch uniquement |
| Ambiance sonore (son de fond façon jeu, contextuel) | **Réel** — architecture posée dès le premier écran, bloqué sur la fourniture de vrais fichiers audio (voir `docs/ARCHITECTURE.md`) |

## Idée de croissance captée (hors noyau MVP)

Proposée par l'utilisateur le 2026-08-22 — **pont WhatsApp de viralité** : quand un Reality-Vlog
dépasse un seuil de viralité sur MindClash 228, poster automatiquement une notification dans le
groupe WhatsApp CESTOM existant (langage naturel, incitatif — donner envie d'aller réagir/donner
son avis sur la plateforme, pas un message robotique) pour engager la communauté qui est déjà là.
Numéro WhatsApp de départ : celui de l'utilisateur (membre du bureau CESTOM), à remplacer par un
numéro "CESTOM TV" dédié plus tard.

Pourquoi c'est fort : ça exploite le canal déjà identifié comme "bruit" en section Problème comme
entonnoir d'acquisition/réengagement, dans l'esprit FOMO Sociale déjà présent dans les Canaux de
distribution (`docs/LEAN_CANVAS.md` section 6) — un bon élément pour le `.pptx`.

Pourquoi ce n'est pas dans le noyau MVP actuel : dépend de Reality-Vlogs, déjà hors périmètre
(tableau ci-dessus), et ajoute une dépendance externe non budgétée dans `docs/STACK.md` (API
WhatsApp Business — numéro vérifié, templates de message approuvés pour l'envoi proactif,
infrastructure de webhook). À reprendre explicitement si/quand Reality-Vlogs entre en scope.

## Métriques qu'on vise (post-lancement, pas des gates MVP)

DAU/MAU > 30 %, rétention J1/J7/J30, ratio consommation/création, taux de conversion
"Ghost to Public", Time-to-Resolve des Bounties.

## Décisions actées à retenir

- Le **Bureau Exécutif central a un pouvoir volontairement limité** : aucune action
  destructrice (bannir, supprimer, quarantaine) ne peut être déclenchée unilatéralement par un
  seul rôle national — garde-fou explicite, pas un oubli. Voir `docs/ARCHITECTURE.md`.
