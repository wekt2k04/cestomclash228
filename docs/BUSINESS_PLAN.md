# Business Plan — CestomClash228

*Version détaillée du 2026-08-31, pour le jury CréaAfrica (voir `docs/CONCOURS.md` — pertinence
du problème/solution, business plan chiffré, marché ciblé et sa taille, explicitement pas un
dossier associatif/bénévole). Discipline tenue tout du long : **aucun chiffre dur n'est inventé**.
Chaque donnée manquante est marquée `[À COMPLÉTER]` avec la méthode de calcul déjà posée à côté —
il suffit d'injecter le vrai chiffre pour que la projection se calcule. Ne jamais remettre ce
document au jury avec un `[À COMPLÉTER]` non résolu.*

## Table des matières

1. Résumé exécutif
2. Porteur de projet et légitimité
3. Analyse du problème
4. Étude de marché
5. Produit et différenciation
6. Modèle économique détaillé
7. Projections financières (3 ans)
8. Stratégie Go-to-Market
9. Plan opérationnel et technique
10. Organisation et gouvernance
11. Analyse concurrentielle
12. Analyse SWOT
13. Risques et mitigation
14. Indicateurs de performance (KPIs)
15. Demande au concours (ask) et utilisation
16. Vision à long terme (3-5 ans)
17. Annexe — glossaire et sources

---

## 1. Résumé exécutif

CestomClash228 transforme l'entraide entre étudiants togolais au Maroc — aujourd'hui dispersée
dans des groupes WhatsApp non structurés, non indexables, sans mémoire ni valeur durable — en un
produit géolocalisé qui génère trois choses que WhatsApp ne génère pas : de l'**information
persistante et consultable** (Pins), de la **réputation individuelle traçable** (Notation sur
Bounties résolus), et un **revenu réel pour l'organisation qui le porte** (Sponsoring vérifié, dès
la version présentée au concours — pas une promesse). Construit avec et pour la CESTOM
(Communauté des Étudiants et Stagiaires Togolais au Maroc), le produit démarre avec une base
d'utilisateurs, une légitimité institutionnelle, et un canal de distribution déjà existants —
un avantage de mise sur le marché qu'un concurrent générique n'a pas. Le modèle économique est
séquencé en 3 phases pour rester financièrement soutenable sans capital de départ : sponsoring
vérifié sans intermédiaire de paiement (marge quasi-totale dès le premier client), puis commission
sur services une fois la confiance établie, puis licence du modèle à d'autres communautés
étudiantes diasporiques structurées.

## 2. Porteur de projet et légitimité

Le projet est porté par un membre du bureau CESTOM, avec un accès direct à la gouvernance et au
réseau de la communauté cible — ce n'est pas un produit qui doit se faire connaître et gagner la
confiance d'une communauté qui ne le connaît pas : la distribution initiale utilise un canal déjà
en place (le groupe WhatsApp CESTOM existant, mentionné dans `docs/VISION.md` comme "pont de
viralité" pour une itération future). `[À COMPLÉTER : nom(s) et rôle(s) exact(s) du/des porteur(s)
de projet à présenter au jury — un seul fondateur ou une petite équipe ?]`

## 3. Analyse du problème

### 3.1 Le vécu concret d'un étudiant togolais au Maroc

- **Isolement et choc culturel à l'arrivée** : codes locaux manquants au moment précis où ils sont
  critiques — climat, bureaucratie des préfectures (renouvellement de titre de séjour, ouverture
  de compte bancaire), attentes académiques marocaines différentes du système togolais.
- **Information fragmentée et volatile** : l'essentiel de l'entraide réelle transite déjà par
  WhatsApp, mais ce canal a trois défauts structurels pour cet usage : non indexable (impossible
  de retrouver une info donnée il y a 2 mois), non consultable par un nouvel arrivant qui n'a pas
  l'historique du groupe, et sujet à la toxicité en meute (signalements coordonnés, harcèlement
  dans des groupes locaux restreints).
- **Aucune mécanique de valorisation de l'aide rendue** : celui qui aide concrètement un pair
  (démarche administrative, logement, information) n'obtient aujourd'hui ni reconnaissance
  durable, ni rémunération, ni trace exploitable pour sa réputation — un pur coût de temps sans
  contrepartie, ce qui limite structurellement l'offre d'aide dans la durée (les "vétérans" qui
  aideraient volontiers s'essoufflent sans reconnaissance).

### 3.2 Pourquoi ce problème est adressable maintenant, et par ce porteur de projet précisément

La CESTOM existe déjà comme structure organisée (Bureau Exécutif central, bureaux locaux par
ville) — le problème n'est pas l'absence de communauté, c'est l'absence d'un **outil** qui capture
la valeur que cette communauté produit déjà de façon informelle. C'est un problème d'infrastructure
logicielle sur un terrain social déjà mûr, pas un problème d'adoption sociale à construire de zéro.

## 4. Étude de marché

### 4.1 Segmentation TAM / SAM / SOM

| Périmètre | Définition | Taille |
|---|---|---|
| **TAM** (marché total adressable) | Toute diaspora étudiante africaine structurée autour d'une association reconnue, au Maroc et au-delà (vision Phase 3, licence du modèle) | `[À COMPLÉTER — ordre de grandeur estimable via le nombre d'étudiants subsahariens au Maroc, statistiques ministérielles marocaines de l'enseignement supérieur si disponibles]` |
| **SAM** (marché disponible, notre segment réaliste) | Communauté étudiante togolaise au Maroc, structurée autour de la CESTOM | `[À COMPLÉTER — effectif CESTOM réel]` |
| **SOM** (marché captable à 12-18 mois) | Part du SAM qu'on peut réalistement convertir en utilisateurs actifs sur la première année, compte tenu de la distribution via le réseau CESTOM existant | **Méthode** : SOM = SAM × taux d'adoption hypothèse. Un taux de 30-40 % est une hypothèse de départ défendable pour un outil distribué via un canal communautaire de confiance déjà utilisé quotidiennement (WhatsApp CESTOM) — à ajuster avec un vrai taux d'adoption observé après un premier trimestre d'usage réel, pas à présenter comme mesuré au jury tant que ce n'est pas le cas. |

### 4.2 Segments d'utilisateurs (repris et affinés de `docs/VISION.md`)

| Segment | Comportement | Rôle dans le modèle économique |
|---|---|---|
| Freshmen (nouveaux arrivants) | Consomment du contenu de survie, émettent des Bounties | Génèrent la demande — pas de revenu direct, mais la valeur qui rend la carte indispensable |
| Vétérans (fin de cycle) | Cherchent réputation avant le marché du travail | Répondent aux Bounties → alimentent le système de Notation, qui est l'actif de confiance du produit |
| Majorité silencieuse (~70 %) | Timides, consultent plus qu'ils ne publient | Volume d'audience pour le Sponsoring (plus il y a de vues, plus un Pin sponsorisé a de valeur) |
| Acteurs tiers payeurs (commerces locaux, institutions) | Ne sont pas des étudiants — veulent de la visibilité ciblée auprès de cette communauté | **Source de revenu directe** (Sponsoring vérifié, Phase 1) |

### 4.3 Tendances qui jouent en notre faveur

- Digitalisation croissante des démarches administratives au Maroc, qui augmente la valeur d'une
  information à jour et fiable sur "comment faire concrètement".
- Poids croissant de la réputation numérique individuelle (portfolios, profils vérifiés) dans les
  parcours étudiants et professionnels — la Notation s'inscrit dans cette tendance plutôt que de
  la créer.
- Coût d'infrastructure logicielle en chute continue (paliers gratuits Vercel/Render/Supabase
  couvrant plusieurs milliers d'utilisateurs actifs, voir `docs/STACK.md`) — un produit comme
  celui-ci était plus coûteux à opérer il y a 5 ans qu'aujourd'hui.

## 5. Produit et différenciation

### 5.1 Fonctionnalités cœur (présentées au concours)

- **Carte par ville** : ancrage géographique de toute l'information, remplace le newsfeed
  classique par un support spatial.
- **Pins** : informations pratiques persistantes (astuces, lieux sûrs, alertes, pièges
  administratifs), consultables par tous, sans expiration.
- **Bounties** : demandes d'aide concrètes, avec cycle de vie complet (créer / réclamer /
  résoudre / expirer) — déjà en code fonctionnel et testé.
- **Notation** (nouvelle, actée le 2026-08-31) : note 1-5 sur la résolution d'un Bounty, visible
  sur le profil de qui a aidé — construit la réputation individuelle dans la durée.
- **Sponsoring vérifié** (nouveau, actée le 2026-08-31, détail Section 6) : mécanisme de revenu
  réel sans passerelle de paiement tierce.
- **RBAC à deux niveaux** : gouvernance calquée sur la structure réelle de la CESTOM (national /
  local), avec un principe de sécurité fort — aucune action destructrice unilatérale par un rôle
  national, déjà testé.

### 5.2 Barrières à l'entrée pour un concurrent

- **Effet de réseau spatial** : chaque Pin ajouté rend la carte plus précieuse pour le prochain
  utilisateur. Un concurrent qui arrive après coup démarre avec une carte vide (problème classique
  du cold start dans les produits à contenu généré par les utilisateurs).
- **Légitimité institutionnelle non réplicable rapidement** : construit avec et pour la CESTOM,
  un concurrent générique devrait construire cette confiance et cet accès de zéro.
- **Coût d'opération quasi nul** : marge protégée dès le premier revenu, pas besoin de lever du
  capital pour survivre à la phase de croissance initiale.

### 5.3 Roadmap produit (après le concours, hors périmètre de la démo)

Mode anonyme réversible (Ghost Mode — pour la majorité silencieuse qui n'ose pas publier à
visage découvert), modération anti-brigading (seuil >6 signalements venant de ≥6 villes
distinctes, rend le raid en meute mathématiquement impossible), contenus vidéo courts
(Reality-Vlogs).

## 6. Modèle économique détaillé

### 6.1 Phase 1 — Sponsoring vérifié (construit et démontré au concours)

**Mécanique exacte** : un acteur (commerce local, institution, particulier) qui veut un privilège
sur la plateforme (Pin mis en avant, badge "recommandé", visibilité boostée) effectue un
**virement bancaire réel** vers un compte CESTOM dédié, puis **soumet une preuve** (capture
d'écran du virement) dans l'application. Une entité `SponsorshipRequest` (payeur, montant
déclaré, image de preuve, statut) est créée. Un rôle **vérificateur** interne (personne désignée
par le porteur du projet, pas une nouvelle strate de gouvernance CESTOM — décision actée le
2026-08-31) valide ou rejette manuellement chaque demande. Si validée, le privilège s'active.

**Pourquoi ce choix plutôt qu'une vraie passerelle de paiement** : zéro coût d'intégration
(Stripe et équivalents prélèvent typiquement 1,5 à 3 % par transaction, plus des frais fixes),
zéro dépendance à un compte marchand (souvent inaccessible sans société immatriculée, ce que la
CESTOM n'est pas nécessairement au sens commercial), et cohérent avec la contrainte déjà actée
pour l'infrastructure technique du projet (aucun service payant, aucune carte bancaire engagée).
Le coût de ce choix est la friction manuelle de vérification — acceptable au volume initial visé,
à réévaluer si le volume de demandes dépasse la capacité humaine de vérification (voir Section 13,
Risques).

**Tarification** : `[À COMPLÉTER — fourchette de prix à définir avec l'utilisateur ; poser comme
point de comparaison le coût d'une visibilité équivalente sur un canal existant (ex. un post
sponsorisé dans un groupe Facebook communautaire local, ou un flyer physique distribué sur un
campus) pour ancrer le prix dans une valeur perçue réelle plutôt qu'un chiffre arbitraire]`

### 6.2 Phase 2 — Commission sur services rendus (roadmap, pas construite pour le concours)

Une fois une base d'utilisateurs et de confiance établie via la Phase 1, une commission peut être
prélevée sur les mises en relation payantes entre étudiants (services rendus contre rémunération,
au-delà de l'entraide gratuite qui reste le cœur du produit) — modèle proche de plateformes de
mise en relation existantes (logistique de dernière minute type Glovo), adapté à l'échelle et aux
réalités d'une communauté étudiante plutôt qu'à un marché grand public. Prérequis explicite avant
d'activer cette phase : volume d'usage suffisant pour que la commission soit significative sans
décourager l'entraide gratuite qui fait la valeur initiale du produit — pas d'échéance fixée.

### 6.3 Phase 3 — Licence à d'autres communautés diasporiques (vision)

L'architecture (carte, réputation, sponsoring vérifié, modération spatiale, RBAC à deux niveaux)
n'est pas spécifique à la communauté togolaise — elle se transpose à toute diaspora étudiante
structurée autour d'une association reconnue équivalente à la CESTOM. Revenu envisagé : licence
ou marque blanche, pas un chiffre projeté à ce stade (vision, pas plan d'exécution).

### 6.4 Structure de coûts

| Poste | Coût actuel | Coût si le volume dépasse les paliers gratuits |
|---|---|---|
| Hébergement frontend (Vercel) | 0 | Palier payant à partir d'un volume de trafic largement supérieur au SOM Année 1 estimé |
| Hébergement backend (Render) | 0 | ~7-25 $/mois pour un plan payant sans mise en veille |
| Base de données (Supabase) | 0 | ~25 $/mois pour un plan payant (stockage/connexions accrus) |
| Vérification manuelle du Sponsoring | Temps humain (porteur de projet ou personne désignée), pas de coût monétaire direct | Coût de temps croissant avec le volume — voir Risques, Section 13 |
| Développement | Temps du porteur de projet, pas de salaire versé à ce stade | `[À COMPLÉTER si le projet embauche après le concours]` |

**Point clé pour le jury** : la structure de coûts reste à 0 € d'infrastructure tant que l'usage
reste dans les paliers gratuits (couvrant, d'après la documentation des fournisseurs, plusieurs
milliers d'utilisateurs actifs quotidiens) — la marge sur le premier revenu de Sponsoring est donc
quasi-totale, sans phase de brûlage de capital nécessaire pour démarrer.

## 7. Projections financières (3 ans)

*Modèle avec hypothèses explicites — remplacer chaque `[H]` (hypothèse) par une valeur validée
avant de présenter un chiffre final au jury. La méthode de calcul, elle, est fixée et ne change
pas quand les hypothèses sont mises à jour.*

| Variable | Formule | Hypothèse de départ |
|---|---|---|
| Utilisateurs actifs Année 1 | SOM (Section 4.1) | `[H1] = SAM × [30-40 %]` |
| Sponsors payants / mois | Utilisateurs actifs × taux d'attractivité pour un sponsor local | `[H2] — à valider : ratio observé dans des programmes de visibilité locale comparables (aucune donnée interne encore disponible)` |
| Revenu mensuel Phase 1 | Sponsors payants/mois × prix moyen d'un Sponsoring | `[H2] × [H3, Section 6.1]` |
| Revenu Année 1 | Revenu mensuel × 12, avec montée en charge progressive (pas un revenu plein dès le mois 1) | Modéliser une rampe (ex. 20 % du régime de croisière au T1, 100 % au T4) plutôt qu'un chiffre plat — plus honnête et plus défendable devant un jury technique |
| Coûts Année 1 | Section 6.4 | 0 tant que sous les seuils des paliers gratuits |
| Marge Année 1 | Revenu − Coûts | Quasi égale au revenu tant que l'infrastructure reste gratuite |

**Années 2-3** : la Phase 2 (commission sur services) s'ajoute au Sponsoring plutôt que de le
remplacer — projeter une deuxième ligne de revenu qui démarre à 0 en Année 1, croît en Année 2
une fois la confiance établie, sans hypothèse chiffrée tant que la Phase 1 n'a pas produit de
données réelles d'usage pour la calibrer.

**Ce tableau est délibérément un squelette de calcul, pas des chiffres finaux** — le remplir avec
des valeurs plausibles mais non sourcées serait plus trompeur pour le jury qu'utile ; un jury
technique qui pose des questions sur le business plan (critère explicite du concours) valorise
davantage une méthode rigoureuse assumée que des chiffres qui ne résisteraient pas à une question
de suivi.

## 8. Stratégie Go-to-Market

1. **Canal de lancement** : le groupe WhatsApp CESTOM existant (déjà identifié comme canal de
   distribution dans `docs/VISION.md`) — annonce native par la gouvernance CESTOM elle-même,
   coût d'acquisition nul, confiance déjà établie.
2. **Amorçage du contenu** : le porteur de projet et quelques membres du bureau CESTOM créent les
   premiers Pins (informations pratiques déjà connues de la gouvernance) avant l'ouverture
   publique, pour éviter l'effet "carte vide" au premier lancement.
3. **Premiers Sponsors** : ciblage direct de commerces/services déjà fréquentés par la communauté
   étudiante togolaise (restaurants, agences de transfert d'argent, associations partenaires) —
   accès facilité par le réseau CESTOM existant plutôt qu'une prospection commerciale à froid.
4. **Boucle de rétention** : le pont WhatsApp de viralité (roadmap, voir `docs/VISION.md`) —
   quand un contenu dépasse un seuil d'engagement, notification native dans le groupe WhatsApp
   existant pour réengager la communauté sur le canal qu'elle utilise déjà quotidiennement.

## 9. Plan opérationnel et technique

Stack détaillée dans `docs/STACK.md` et `docs/ARCHITECTURE.md`. Points clés pour un jury non
technique : hébergement 100 % sur paliers gratuits (Vercel, Render, Supabase — aucune carte
bancaire requise), architecture pensée "scale-to-zero" (coût d'infrastructure nul quand le
produit n'est pas utilisé, pas de facture qui tourne à vide la nuit). Jalons produit détaillés
dans `docs/PLAN_EXTENSION.md`.

## 10. Organisation et gouvernance

Le produit est construit avec et pour la CESTOM (Bureau Exécutif central, 9 rôles, mandat 2 ans ;
bureaux locaux par ville). La gouvernance produit (rôle vérificateur du Sponsoring) reste
volontairement simple et distincte de la gouvernance associative CESTOM — décision actée le
2026-08-31 pour ne pas complexifier un mécanisme qui doit rester opérable par une seule personne
ou une petite équipe désignée au démarrage. `[À COMPLÉTER : structure juridique envisagée pour
percevoir et gérer les revenus de Sponsoring — compte CESTOM existant, ou entité dédiée à créer ?
Question à trancher avant tout premier virement réel, hors périmètre de ce document]`

## 11. Analyse concurrentielle

| Concurrent | Ce qu'il couvre | Ce qui lui manque face à CestomClash228 |
|---|---|---|
| Groupes WhatsApp/Facebook communautaires existants | Entraide informelle, déjà utilisée quotidiennement | Non indexable, pas de réputation traçable, pas de mécanisme de revenu, information perdue dans le flux |
| Applications d'expatriation généralistes (type Meetup, InterNations) | Mise en réseau d'expatriés, événementiel | Pas localisées sur les problèmes spécifiques de la diaspora étudiante togolaise, pas de légitimité institutionnelle locale, pas gratuites pour l'utilisateur final en général |
| Plateformes de petites annonces généralistes (type OLX, Avito) | Mise en relation marchande large | Pas orientées communauté ni réputation, pas de filtrage par légitimité associative, pas de logique d'entraide non-marchande |
| Une carte communautaire concurrente qui apparaîtrait après | Techniquement réplicable | Démarre avec une carte vide (cold start) et sans la légitimité CESTOM déjà acquise par ce projet |

## 12. Analyse SWOT

| Forces | Faiblesses |
|---|---|
| Légitimité et distribution CESTOM immédiates | Dépendance à une seule organisation partenaire au démarrage |
| Coût d'infrastructure quasi nul | Vérification du Sponsoring encore manuelle (non automatisée) |
| Effet de réseau spatial qui verrouille l'avantage dans la durée | Équipe de développement réduite à ce stade |
| Modèle de revenu actif dès la version présentée au concours | Aucune donnée d'usage réelle encore disponible pour calibrer les projections |

| Opportunités | Menaces |
|---|---|
| Autres diasporas étudiantes structurées (Phase 3) | Un acteur mieux financé qui répliquerait le concept sans la contrainte "zéro capital" |
| Digitalisation croissante des démarches administratives au Maroc | Dépendance aux paliers gratuits des fournisseurs cloud (conditions qui peuvent changer) |
| Poids croissant de la réputation numérique individuelle | Volume de vérification manuelle du Sponsoring qui devient un goulot d'étranglement en cas de succès rapide |

## 13. Risques et mitigation

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Goulot d'étranglement humain sur la vérification des preuves de virement en cas de forte demande | Moyenne | Moyen | Prévoir plusieurs personnes habilitées à vérifier dès que le volume le justifie ; automatiser une passerelle de paiement réelle seulement si le volume rend la vérification manuelle intenable |
| Faible taux d'adoption initial malgré le canal CESTOM | Moyenne | Élevé | Amorçage de contenu avant ouverture publique (Section 8), pour éviter l'effet carte vide qui décourage l'adoption |
| Dépassement des paliers gratuits d'hébergement plus vite que prévu | Faible à ce stade (SOM Année 1 largement sous les seuils documentés des fournisseurs) | Faible (coût de bascule limité, voir Section 6.4) | Suivi mensuel de l'usage réel vs seuils des paliers gratuits |
| Fraude sur les preuves de virement (fausse capture d'écran) | Faible à moyenne | Moyen | Vérification humaine avec accès direct au relevé du compte CESTOM dédié, pas seulement à la capture soumise |

## 14. Indicateurs de performance (KPIs)

Repris et complétés depuis `docs/VISION.md` : DAU/MAU > 30 %, rétention J1/J7/J30, ratio
consommation/création de contenu, Time-to-Resolve des Bounties. Ajoutés pour le volet
économique : nombre de demandes de Sponsoring soumises/mois, taux d'approbation par le
vérificateur, délai moyen de vérification, revenu mensuel récurrent (Phase 1).

## 15. Demande au concours (ask) et utilisation

`[À COMPLÉTER avec l'utilisateur — modalités exactes du concours CréaAfrica non connues :
financement, mentorat, mise en réseau, autre. Une fois connu, détailler ici comment le montant
ou l'accompagnement demandé accélère précisément une étape de ce plan (ex. financer la première
automatisation de la vérification des paiements, ou l'extension à une deuxième ville pilote).]`

## 16. Vision à long terme (3-5 ans)

- **Année 1** : consolidation sur la communauté étudiante togolaise au Maroc — Sponsoring vérifié
  comme unique source de revenu, priorité à la confiance et à la densité de contenu sur la carte.
- **Année 2** : activation de la Phase 2 (commission sur services rendus) une fois l'usage et la
  confiance mesurés ; éventuelle automatisation de la vérification du Sponsoring si le volume le
  justifie.
- **Années 3-5** : Phase 3 — transposition du modèle à d'autres communautés étudiantes
  diasporiques structurées (au Maroc d'abord, par proximité opérationnelle, puis au-delà),
  éventuels partenariats avec des associations étudiantes ou des établissements d'enseignement
  supérieur accueillant des étudiants internationaux.

## 17. Annexe — glossaire et sources

- **Pin** : information pratique persistante géolocalisée, visible par tous.
- **Bounty** : demande d'aide concrète, avec cycle de vie (créer/réclamer/résoudre/expirer).
- **Sponsoring vérifié** : mécanisme de revenu par preuve de virement + validation humaine, sans
  passerelle de paiement tierce.
- **SAM / SOM / TAM** : définitions standard d'étude de marché, appliquées en Section 4.1.
- Sources internes citées : `docs/VISION.md`, `docs/LEAN_CANVAS.md`, `docs/ARCHITECTURE.md`,
  `docs/STACK.md`, `docs/PLAN_EXTENSION.md`, `docs/CONCOURS.md`.
