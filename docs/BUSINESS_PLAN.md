# Business Plan — CestomClash228

*Document de travail, premier jet du 2026-08-31. Écrit pour répondre au format du jury CréaAfrica
(voir `docs/CONCOURS.md`) : pertinence du problème/solution, business plan chiffré, marché ciblé
et sa taille — explicitement pas un dossier associatif/bénévole. Les chiffres marqués
`[À COMPLÉTER]` ne sont pas inventés — à remplir avec l'utilisateur avant dépôt, jamais remis
au jury tels quels.*

## 1. Résumé exécutif

CestomClash228 est une plateforme géolocalisée qui transforme l'entraide entre étudiants togolais
au Maroc — aujourd'hui dispersée dans des groupes WhatsApp non structurés — en un produit
consultable, traçable, et **monétisable**. Le produit combine une carte interactive par ville
(demandes d'aide, informations pratiques), un système de mise en relation entre étudiants qui ont
besoin d'un service et ceux qui peuvent le rendre, une notation de la qualité du service rendu, et
un mécanisme de revenu par sponsoring local dès la version présentée au concours. Construit avec
et pour la CESTOM (Communauté des Étudiants et Stagiaires Togolais au Maroc), ce qui donne une
légitimité et une base d'utilisateurs immédiates — un avantage de traction, pas le modèle
économique lui-même.

## 2. Le problème

- **Isolement et choc culturel** : un nouvel arrivant togolais au Maroc manque des codes locaux
  essentiels — bureaucratie des préfectures, logement, attentes académiques — au moment précis où
  il en a le plus besoin.
- **Information fragmentée et non exploitable** : l'essentiel de l'entraide réelle se passe déjà
  dans des groupes WhatsApp, mais ce canal n'est pas indexable, pas consultable après coup, et ne
  génère aucune valeur pour personne — ni pour l'étudiant qui aide (aucune reconnaissance
  durable), ni pour une organisation qui voudrait s'appuyer dessus.
- **Aucun mécanisme de valorisation de l'aide rendue** : celui qui aide concrètement un pair (aide
  administrative, logement, information) n'obtient aujourd'hui rien en retour — ni réputation
  traçable, ni rémunération, ni reconnaissance visible.

## 3. La solution

Une carte du Maroc, par ville, où deux objets structurent tout : des **informations pratiques**
persistantes (bons plans, alertes, pièges administratifs) et des **demandes d'aide concrètes**
que d'autres étudiants résolvent. Une fois une demande résolue, celui qui a aidé reçoit une
**note** (1 à 5) — trace de réputation réelle, publique, qui construit une réputation dans la
durée, contrairement à un message WhatsApp qui disparaît dans le flux.

## 4. Modèle économique

*Le point que le jury pèse le plus — traité sans ambiguïté.*

**Phase 1 (ce qui est démontré au concours) — Sponsoring vérifié.** Un acteur (commerce local,
institution, particulier) qui veut un privilège sur la plateforme — une information mise en avant,
un badge de recommandation — effectue un virement bancaire vers un compte CESTOM dédié et soumet
la preuve dans l'application. Un rôle vérificateur interne valide manuellement chaque preuve avant
d'activer le privilège. **Aucune passerelle de paiement tierce n'est nécessaire** à ce stade — donc
aucun coût d'infrastructure de paiement, aucune commission prélevée par un tiers (Stripe et
équivalents prennent typiquement 1,5 à 3 % par transaction) — 100 % du montant reste dans le
circuit CESTOM.

**Phase 2 (roadmap, pas construite pour le concours) — Commission sur services rendus.** Une fois
une base d'utilisateurs et de confiance établie via la Phase 1, une commission peut être prélevée
sur les mises en relation payantes entre étudiants (services rendus contre rémunération, pas
seulement de l'entraide gratuite) — modèle proche de plateformes de mise en relation existantes
(type Glovo pour la logistique de dernière minute), adapté aux réalités et à l'échelle d'une
communauté étudiante plutôt qu'à un marché grand public.

**Phase 3 (vision) — Licence à d'autres communautés diasporiques.** L'architecture (carte,
réputation, sponsoring vérifié, modération spatiale) n'est pas spécifique à la communauté togolaise
— elle se transpose à toute diaspora étudiante structurée autour d'une association reconnue.

## 5. Marché ciblé et taille

**Marché primaire (celui qu'on adresse dès maintenant)** : la communauté étudiante togolaise au
Maroc, structurée autour de la CESTOM.

- Nombre d'étudiants togolais actuellement au Maroc : `[À COMPLÉTER — chiffre CESTOM réel]`
- Nombre de nouveaux arrivants par an (flux, pas stock — détermine la fréquence d'usage du produit
  par les "Freshmen", le segment qui consomme le plus) : `[À COMPLÉTER]`
- Nombre de villes marocaines avec une présence CESTOM structurée : `[À COMPLÉTER — voir
  `docs/PLAN_EXTENSION.md`, question encore ouverte avec l'utilisateur au 2026-08-31]`

**Marché secondaire (scalabilité, à mentionner comme trajectoire, pas comme chiffre du jour)** :
les autres diasporas étudiantes africaines au Maroc et ailleurs, structurées autour d'une
association reconnue équivalente à la CESTOM — taille non chiffrée à ce stade, à présenter comme
direction de croissance plutôt que comme donnée du marché primaire.

## 6. Avantage concurrentiel

- **Traction et légitimité immédiates** : construit avec et pour une organisation existante
  (CESTOM), pas une startup qui doit acheter la confiance d'une communauté qui ne la connaît pas —
  un avantage de mise sur le marché, distinct du modèle de revenu lui-même.
- **Effet de réseau spatial** : chaque information ajoutée à la carte la rend plus précieuse pour
  le prochain utilisateur. Un concurrent qui arrive après coup démarre avec une carte vide.
- **Coût d'infrastructure quasi nul** : hébergement 100 % sur des paliers gratuits (voir
  `docs/STACK.md`), aucune carte bancaire engagée, marge protégée dès le premier utilisateur payant
  du Sponsoring.

## 7. Ce qui est réel aujourd'hui (traction produit, pas hypothèse)

- Carte géolocalisée, création/résolution de demandes d'aide, authentification, gouvernance à
  deux niveaux (national/local) — code fonctionnel, testé (32/32 tests automatisés au dernier
  audit du 2026-08-25).
- 3 directions visuelles complètes explorées et maquettées ; direction retenue le 2026-08-31.
- Décision de refonte du modèle économique (Sponsoring vérifié + Notation) actée le 2026-08-31,
  en cours de développement.

## 8. Ce qui reste à construire (roadmap honnête, pas caché)

- Sponsoring vérifié (Phase 1 ci-dessus) et Notation — en cours, ciblé pour le concours.
- Modération anti-brigading, mode anonyme réversible, contenus vidéo courts — après le concours.
- Commission sur services rendus (Phase 2) — dépend d'une base d'utilisateurs établie.

## 9. Demande au concours (ask)

`[À COMPLÉTER avec l'utilisateur — modalités exactes du concours CréaAfrica non connues :
financement, mentorat, mise en réseau, autre]`
