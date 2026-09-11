# Révision jury — CestomClash228

*Document de révision unique, complet et autonome pour défendre le projet devant le jury
CréaAfrica (phase éliminatoire, dimanche 13 septembre 2026, 19h30) — tout dans un seul fichier,
rien à aller chercher ailleurs pendant une répétition. 5 parties : le pitch, la Q&A anticipée, les
5 fichiers qui portent la vraie logique métier, la logique métier/le passage à l'échelle, et le
business case. Rédigé le 2026-09-11 à partir du code réel du dépôt et des documents déjà
existants — rien n'est inventé, chaque fichier de code cité a été relu intégralement le jour de la
rédaction.*

**Sur la partie 1 (pitch)** : le texte oral qui suit est repris de `pitch/SCRIPT_ORAL.md`, la
version de référence, elle-même synchronisée slide par slide avec `pitch/CestomClash228-Pitch.pptx`
(le PPT est fait défiler par quelqu'un d'autre le jour J — le texte doit rester cohérent avec les 5
slides réelles). Si le contenu du pitch change, mettre à jour `SCRIPT_ORAL.md` en premier, puis
répercuter ici.

---

## 1. Pitch — 5 minutes (source : `pitch/SCRIPT_ORAL.md`)

| Slide | Contenu | Durée cible | Cumul |
|---|---|---|---|
| 1 | Couverture | 20 s | 0:20 |
| 2 | Problème | 55 s | 1:15 |
| 3 | Solution | 55 s | 2:10 |
| 4 | Business case | 110 s | 3:55 |
| 5 | Conclusion | 45 s | 4:40 |

Cible 4:45, ~15s de marge sur les 5 minutes. Slide 4 volontairement la plus longue à l'oral
(critère de notation "business plan, surtout les chiffres").

**Slide 1 — Couverture (~20s)**
> Bonjour, je suis [ton prénom], porteur du projet CestomClash228, avec le soutien de la CESTOM.
> Aujourd'hui, six cent cinquante étudiants togolais au Maroc réapprennent chacun, seuls, ce que
> les autres savent déjà. CestomClash228 change ça.

**Slide 2 — Problème (~55s)**
> Trois réalités, vécues la même semaine par n'importe quel nouvel arrivant. Un : l'information
> est éclatée, jamais indexée, jamais retrouvable après coup. Deux : celui qui aide un pair n'a
> rien en retour — zéro reconnaissance, zéro trace. Trois, et c'est le plus dur : l'isolement à
> l'arrivée, exactement au moment où on a le plus besoin d'un repère.
>
> Un exemple réel, pas hypothétique : *"Je suis coincé à la gare de Casa-Voyageurs à 23h, qui peut
> m'héberger ?"* Ce message existe. Il se perd dans le flux. Chaque semaine.

*Marque une vraie pause après la citation — c'est l'ancrage émotionnel de tout le pitch.*

**Slide 3 — Solution (~55s)**
> À chacun de ces trois problèmes, une réponse concrète — déjà en code, pas une intention. Une
> carte par ville, avec des Pins : l'information devient persistante, cherchable. Des Bounties,
> avec notation : on résout une demande, on est noté, on construit une réputation qui dure. Et
> tout ça porté par la CESTOM elle-même — pas une application anonyme de plus.
>
> Le parcours utilisateur tient en trois gestes, ceux de notre tagline : Explore. Partage.
> Level-up.

**Slide 4 — Business case (~110s, la plus longue)**
> Parlons chiffres — parce que c'est ce qui compte ici, un vrai modèle économique, pas du
> bénévolat. Phase 1, maintenant : le Sponsoring vérifié — virement réel, preuve, validation
> humaine, zéro pourcentage prélevé par une passerelle tierce. C'est du code en développement pour
> ce concours, pas une slide d'intention.
>
> Phase 2, une fois la confiance installée : commission sur les services rendus entre étudiants.
> Phase 3, la vision : la même architecture transposée à d'autres diasporas étudiantes.
>
> Le marché, avec des vrais chiffres : six cent cinquante membres CESTOM réels, six villes,
> source cestom.org vérifiable en deux clics. Hypothèse de portée 500 en année 1, adoption 30 à
> 40% : on vise 150 à 200 utilisateurs actifs. Coût d'infrastructure : zéro euro tant qu'on reste
> sous les seuils gratuits.

*Ralentir le débit ici, plus payant que d'aller vite — 3 chiffres à articuler distinctement : 650,
150-200, 0%.*

**Slide 5 — Conclusion (~45s)**
> Ce qui existe déjà, aujourd'hui : le code tourne, trente-deux tests sur trente-deux passent, la
> direction visuelle est tranchée, l'hébergement ne coûte rien.
>
> Ce qu'on vous demande : pas de financement à ce stade. De la visibilité — devant vous, devant la
> communauté de ce concours, pour amorcer la traction. Le financement, s'il vient, viendra d'une
> victoire ici, pas d'une demande directe aujourd'hui.
>
> CestomClash228, en une phrase : Explore. Partage. Level-up. Merci.

---

## 2. Questions probables du jury

Organisées par critère de la grille officielle (100 points) — savoir dans quelle catégorie tombe
une question aide à calibrer la réponse. Reprend et complète la liste de `SCRIPT_ORAL.md`.

### Pertinence du projet — /20

**"En quoi c'est différent d'un simple groupe WhatsApp ?"**
Trois défauts structurels que WhatsApp ne peut pas corriger sans cesser d'être WhatsApp :
non indexable, non consultable par un nouvel arrivant sans l'historique, aucune mécanique de
valorisation de l'aide rendue.

**"C'est un vrai problème vécu, ou inventé pour le concours ?"**
Le porteur de projet est membre du bureau CESTOM — accès direct au terrain et à la gouvernance.

### Posture / maîtrise du projet — /20

**"C'est un prototype ou un produit utilisé réellement ?"**
Un prototype fonctionnel réel — déployé, testé à plusieurs niveaux (tests automatisés + parcours
complet rejoué en direct avec de vrais comptes), peuplé de contenu réaliste. Pas encore à l'échelle
de centaines d'utilisateurs quotidiens réels — le stade honnête d'un MVP à ce jour.
*Coaching : répondre avec assurance, sans minimiser ni survendre — un jury valorise un MVP honnête
plus qu'une survente qui s'effondre à la première question de suivi.*

**"Que se passe-t-il si deux personnes répondent à la même demande en même temps ?"**
Chaque changement d'état passe par une seule requête SQL conditionnelle, jamais un lire-puis-
écrire. Pour l'acceptation d'une offre de service, un index unique partiel en base garantit
qu'une seule proposition peut être acceptée par demande — testé avec deux requêtes forcées en
parallèle (voir section 3, entrée 2).

**"Ces 650 membres, c'est vérifié comment ?"** *(de SCRIPT_ORAL.md)*
cestom.org, capture d'écran du 2026-08-31, répartition publique par ville.

### Business approche — /20

**"Comment vous passez de 650 à 150-200 utilisateurs actifs ?"** *(de SCRIPT_ORAL.md)*
Hypothèse de portée (500 informés en Année 1) × taux d'adoption 30-40% — à ajuster avec les
vraies données après un trimestre d'usage réel.

**"Pourquoi pas une vraie passerelle de paiement (CMI, Stripe) ?"**
Zéro coût d'intégration (une passerelle prélève 1,5-3% + frais fixes), zéro dépendance à un
compte marchand souvent inaccessible sans société immatriculée, cohérent avec la contrainte
tenue depuis le début : aucun service payant engagé.

**"Qui vérifie les preuves de paiement ? N'est-ce pas un goulot d'étranglement ?"**
Vérification humaine avec accès direct au relevé du compte CESTOM, pas seulement à la capture
soumise. Risque identifié : mitigation prévue en ouvrant la vérification à plusieurs personnes
habilitées dès que le volume le justifie.

**"Et si ça reste du bénévolat déguisé ?"** *(de SCRIPT_ORAL.md)*
Le Sponsoring vérifié est un vrai flux monétaire actif dès cette version, pas une promesse — à
distinguer clairement d'un don.

**"Votre cible est très niche — n'est-ce pas trop petit pour un business ?"**
Niche délibérément en Phase 1 (650 membres réels, légitimité et distribution déjà en place) — la
vision Phase 3 transpose l'architecture à toute diaspora étudiante structurée équivalente.

### Innovation — /20

**"Qu'est-ce qui empêche un concurrent de faire pareil demain ?"**
Un concurrent qui arrive après coup démarre avec une carte vide (cold start classique d'un produit
à contenu généré par les utilisateurs) et sans la légitimité institutionnelle CESTOM, qui ne se
réplique pas rapidement.

**"Ça marche que pour les Togolais ?"** *(de SCRIPT_ORAL.md)*
Phase 3 : l'architecture se transpose à toute diaspora étudiante structurée autour d'une
association reconnue.

### Faisabilité — /15

**"Et si le nombre d'utilisateurs explose, ça tient ?"** *(de SCRIPT_ORAL.md, corrigé le
2026-09-11 — l'ancienne réponse citait Vercel/Supabase, pile technique abandonnée)*
Hébergement 100% gratuit (Firebase Hosting, Render, Neon/PostGIS), pensé pour coûter zéro au
repos. Contrepartie assumée et vérifiée en conditions réelles : le backend Render se met en veille
après ~15 minutes sans trafic (30-60s de réveil) — un ping automatique le maintient éveillé en
continu. Cette limite disparaît dès le premier revenu de Sponsoring, qui finance un palier payant.

*Recommandation de posture (de SCRIPT_ORAL.md) : glisser cette limite assumée soi-même plutôt que
d'attendre qu'on te la reproche — un jury remarque la maturité d'un candidat qui connaît les
faiblesses de son propre système.*

*Si une question sort de ce qui est sourcé ici : "je vérifie et je reviens vers vous" plutôt
qu'inventer un chiffre.*

---

## 3. Top 5 — la logique métier en code

Pour répondre avec assurance à toute question technique de suivi. Les 5 fichiers ci-dessous, plus
détaillés (13 fichiers au total, dont ceux-ci), vivent dans
`docs/APPRENTISSAGE/top-15-fichiers-maitres.md` (entrées 11-13 pour les 3 premiers ici) —
version courte, focalisée sur le pitch, ci-dessous.

### 1 · `apps/api/src/bounties/bounties.service.ts` — le cœur

La machine à états d'une Bounty (ouverte → prise en charge → résolue → notée), et l'expiration
"paresseuse" — pas de tâche planifiée en arrière-plan qui coûterait de l'argent au repos.

> **Concept — concurrence atomique (compare-and-swap SQL) :** au lieu de lire un état puis
> décider quoi écrire (fenêtre où un autre acteur peut agir entre les deux), une seule requête
> conditionnelle porte à la fois la condition et l'écriture. Postgres garantit qu'aucune deuxième
> requête ne peut passer entre la lecture et l'écriture.

```ts
async claim(userId: string, bountyId: string): Promise<BountyView> {
  await this.materializeExpiry();
  // Une SEULE requête conditionnelle, jamais un lire-puis-écrire —
  // élimine la course entre deux personnes qui réclament en même temps.
  const [rows] = await this.bounties.query(
    `UPDATE bounties
     SET status = 'claimed', "claimedById" = $1
     WHERE id = $2 AND status = 'open' AND "expiresAt" > now() AND "authorId" != $1
     RETURNING id`,
    [userId, bountyId],
  );
  if (rows.length === 0) { /* diagnostic précis de la raison de l'échec */ }
  await this.chat.ensureConversationForBounty(bountyId);
  return this.findOne(bountyId);
}
```

**Pour la pitch :** "chaque transition d'état passe par une seule requête atomique — jamais deux
personnes ne peuvent réclamer la même Bounty."

### 2 · `apps/api/src/bounty-interests/bounty-interests.service.ts` + migration — le marché de confiance

Le moteur de mise en relation payante : plusieurs candidats, un badge de confiance calculé depuis
l'historique réel (jamais un profil auto-déclaré), une acceptation verrouillée **même sous accès
concurrent** grâce à un index unique partiel en base.

> **Concept — contrainte d'unicité partielle (Postgres partial unique index) :** un index unique
> qui ne s'applique qu'aux lignes remplissant une condition. Ici, `UNIQUE ... WHERE
> status='accepted'` garantit qu'au plus une proposition par Bounty peut être acceptée à un
> instant donné, sans empêcher plusieurs lignes `pending`/`declined` d'exister pour la même
> Bounty.

```sql
-- migration : une seule proposition ACCEPTED par Bounty, garanti par Postgres lui-même
CREATE UNIQUE INDEX "UQ_bounty_interests_one_accepted_per_bounty"
  ON bounty_interests ("bountyId") WHERE status = 'accepted';
```
```ts
// service : le WHERE protège contre une double-acceptation de LA MÊME ligne ;
// l'index protège contre l'acceptation concurrente de DEUX offres différentes.
try {
  const [rows] = await this.interests.query(
    `UPDATE bounty_interests SET status = 'accepted'
     WHERE id = $1 AND status = 'pending' RETURNING id`, [interestId],
  );
} catch (err) {
  if (isUniqueViolation(err)) throw new ConflictException(
    'Une autre proposition a déjà été acceptée pour cette Bounty.');
}
```

**Pour la pitch :** "testé avec deux acceptations envoyées en parallèle — exactement une passe,
l'autre reçoit une erreur propre, jamais un état incohérent."

### 3 · `apps/api/src/common/contact-filter.ts` — protège le revenu

Empêche deux utilisateurs de sortir la relation de la plateforme (échange de numéro/WhatsApp)
avant qu'une transaction soit confirmée — rejet net, jamais une censure silencieuse.

> **Concept — anti-désintermédiation :** terme d'économie de plateforme pour le risque qu'un
> marché à deux faces se fasse court-circuiter dès la mise en relation, avant que la plateforme
> n'ait capté de valeur.

```ts
// Téléphone marocain/togolais, email, mots-clés de messagerie —
// volontairement pas un simple \d{2,} (bloquerait "15h30", "chambre 204")
const PHONE_PATTERN = /(?:\+212|0)[\s.-]?[5-7](?:[\s.-]?\d){8}|\+228[\s.-]?(?:\d[\s.-]?){8}/;
const EMAIL_PATTERN = /[\w.+-]+@[\w-]+\.[a-z]{2,}/i;
const MESSAGING_KEYWORD_PATTERN =
  /\b(whatsapp|wa\.me|telegram|t\.me|instagram|snapchat|facebook|messenger|imo)\b/i;

export function containsContactInfo(text: string): boolean {
  return PHONE_PATTERN.test(text) || EMAIL_PATTERN.test(text)
      || MESSAGING_KEYWORD_PATTERN.test(text);
}
```

**Pour la pitch :** "un détail de 30 lignes, mais c'est ce qui protège le modèle économique — sans
ça, rien n'empêche deux utilisateurs de continuer hors de l'appli dès la première mise en
relation."

### 4 · `apps/api/src/cities/cities.service.ts` — la géolocalisation, en vrai

Le "géolocalisé" du pitch n'est pas un mot en l'air : chaque Pin/Bounty est rattaché à sa ville
par plus-proche-voisin réel via PostGIS.

> **Concept — recherche du plus proche voisin (PostGIS `<->` + index GiST) :** trouver l'entité
> géographique la plus proche d'un point sans comparer ce point à toutes les entités une par une.

```ts
// Opérateur PostGIS <-> = plus proche voisin, appuyé sur un index spatial GiST —
// avant cet index, ce chemin faisait un scan complet de la table à CHAQUE
// création de Pin/Bounty (trouvé en revue d'architecture, corrigé).
async findNearest(lat: number, lng: number): Promise<City | null> {
  const rows = await this.cities.query(
    `SELECT id, name FROM cities
     WHERE "centerPoint" IS NOT NULL
     ORDER BY "centerPoint" <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
     LIMIT 1`,
    [lng, lat],
  );
  return rows[0] ? this.findById(rows[0].id) : null;
}
```

**Pour la pitch :** "la carte n'est pas décorative — c'est le principe d'organisation de toute la
donnée, avec un vrai moteur géospatial en dessous."

### 5 · `apps/web/src/lib/api.ts` — le choix de coût

Pas de WebSocket. Un hébergement backend gratuit ne tient pas des connexions persistantes à
l'échelle — la réactivité vient d'un polling léger, un choix directement lié aux "ressources
computationnelles" (section 4).

> **Concept — polling vs push (WebSocket) :** le serveur pousse activement (connexion tenue
> ouverte) ou le client revérifie périodiquement. Ici, polling choisi précisément parce qu'un
> hébergement gratuit à mise en veille ne peut pas tenir des connexions ouvertes à l'échelle.

```ts
// Pas de WebSocket (Render gratuit ne tient pas les connexions persistantes) —
// polling déclenché par le client, 1 requête légère toutes les 20s.
export const POLL_INTERVAL_MS = 20_000;
```

**Pour la pitch :** "chaque choix technique est aussi un choix de coût — zéro connexion
persistante à faire tourner."

---

## 4. Logique métier, fonctionnalités MVP, et passage à l'échelle

### Fonctionnalités du MVP présentées au concours

- **Carte par ville** — ancrage géographique de toute l'information, remplace le fil d'actualité classique.
- **Pins (4 types)** — astuce, lieu sûr, piège administratif, alerte ; persistants, sans expiration.
- **Bounties gratuites** — cycle de vie complet : créer / prendre en charge / résoudre / expirer.
- **Marketplace payant** — offres multiples, confiance calculée, preuve de paiement, chat activé après confirmation.
- **Notation** — note 1-5 sur une Bounty résolue, visible durablement, construit une réputation.
- **Sponsoring vérifié** — revenu réel par preuve de virement + validation humaine, zéro passerelle tierce.

### Comment ça passerait à une échelle plus large

L'architecture est pensée "scale-to-zero" dès le départ : aucune dépendance qui coûte au repos
(pas de tâche planifiée permanente, pas de connexion base de données maintenue en continu côté
client). Le premier palier de croissance ne change rien au code — seulement la facture
d'hébergement, à un seuil documenté par les fournisseurs comme couvrant plusieurs milliers
d'utilisateurs actifs. Au-delà, deux points structurels évolueraient en premier : l'expiration
"paresseuse" des Bounties redeviendrait une vraie tâche planifiée si le volume de lecture la
rendait coûteuse à recalculer sans cesse, et le vérificateur unique du Sponsoring s'ouvrirait à
plusieurs personnes habilitées (déjà identifié comme risque, section 2).

### Ressources computationnelles — ce qui est vérifié, honnêtement

| Poste | Coût actuel | Si le volume dépasse le palier gratuit |
|---|---|---|
| Hébergement frontend | 0 € | Palier payant bien au-delà du trafic Année 1 estimé |
| Backend API | 0 € | ~7-25 $/mois pour un plan sans mise en veille |
| Base de données (PostGIS) | 0 € | ~25 $/mois pour stockage/connexions accrus |
| Vérification Sponsoring | Temps humain, pas de coût monétaire | Coût de temps croissant — mitigation : plusieurs vérificateurs |

**Si le jury demande un chiffre précis d'utilisateurs supportés** : ne pas en inventer un.
Répondre "on suit l'usage réel face aux seuils documentés par les fournisseurs, pas encore
atteints" est une réponse plus solide qu'un chiffre inventé qui ne résisterait pas à une question
de suivi.

---

## 5. Business case — comment ça produit du revenu

Séquencé en 3 phases pour rester soutenable sans capital de départ (`docs/BUSINESS_PLAN.md` §6).

| Phase | Statut | Description |
|---|---|---|
| **1 — Sponsoring vérifié** | Construit | Virement réel + preuve + validation humaine. Marge quasi-totale dès le premier client, zéro coût d'intégration, zéro passerelle tierce. |
| **2 — Commission sur services** | Socle déjà construit | Le plan d'origine (31 août) la décrivait comme "roadmap, pas construite". Depuis, le moteur complet (offres, confiance, preuve de paiement, chat) est bâti et testé — il ne manque qu'un pourcentage prélevé à la confirmation du paiement. |
| **3 — Licence à d'autres diasporas** | Vision | L'architecture (carte, réputation, sponsoring, RBAC) n'est pas spécifique à la communauté togolaise — transposable à toute diaspora étudiante structurée équivalente. |

### Marché — chiffres réels, pas des généralités

- **SAM — 650** : membres CESTOM réels, 6 villes (cestom.org). Rabat 220, Casablanca 180,
  Marrakech 95, Fès 85, Tanger 40, Oujda 30.
- **Portée An 1 — 500** : hypothèse de notoriété via le canal WhatsApp CESTOM déjà utilisé
  quotidiennement (77% du SAM réel).
- **SOM — 150 à 200** : portée × 30-40% d'adoption — hypothèse de départ défendable pour un canal
  de confiance déjà en place.

**Sur les chiffres non encore validés** (prix du Sponsoring, ratio de sponsors payants/mois,
revenu projeté) : `docs/BUSINESS_PLAN.md` les marque explicitement `[À COMPLÉTER]` plutôt que
d'inventer une valeur plausible mais non sourcée. Si le jury pousse sur un chiffre précis absent
d'ici, l'assumer directement plutôt que d'improviser un nombre.

---

*Sources : `pitch/SCRIPT_ORAL.md`, `docs/BUSINESS_PLAN.md`, `docs/ARCHITECTURE.md`, code du dépôt
au 2026-09-11. Plateforme en ligne : https://cestomclash228.web.app.*
