# État des workflows — MindClash 228

Tableau de bord d'audit, tenu à jour à chaque changement qui touche un workflow listé ici.
**Historique = `git log -p` sur ce fichier** (façon GitHub : chaque changement de statut est un
commit horodaté et diffable, pas une réécriture silencieuse). Ce fichier ne remplace pas
`.claude/HANDOFF/LOG.md` (qui explique le *pourquoi*) — il donne l'état *actuel*, vérifiable en
une commande, workflow par workflow. Voir `.claude/agents/workflow-audit.md` pour la méthode.

Statuts : ✅ Vérifié réellement (commande listée exécutée, résultat conforme) · ⚠️ À revérifier
(touché par un changement récent, pas encore re-testé) · ❌ Connu cassé · ⛔ Non vérifiable dans
cet environnement (nécessite un appareil/navigateur réel — reste à la charge de l'utilisateur).

Prérequis pour les commandes ci-dessous : API sur `localhost:3001`, Web sur `localhost:3000`
(ou l'IP LAN équivalente), tous deux lancés en `dev`.

## Backend

| Workflow | Dernière vérification | Statut |
|---|---|---|
| `GET /cities` (liste publique) | 2026-08-23 | ✅ |
| Garde JWT (`GET /auth/me` sans token → 401) | 2026-08-23 | ✅ |
| `GET /pins`, `GET /bounties?status=open` (lecture publique + filtre query) | 2026-08-23 | ✅ |
| Signup → Login → `/auth/me` (cycle complet) | 2026-08-23 | ✅ |
| Créer Pin (authentifié) | 2026-08-23 | ✅ |
| Créer Bounty (authentifié) | 2026-08-23 | ✅ |
| Claim Bounty — auto-claim refusé (400) | 2026-08-23 | ✅ |
| Claim Bounty — tiers accepté (200) | 2026-08-23 | ✅ |
| Claim Bounty — double claim refusé (409, pas de race) | 2026-08-23 | ✅ |
| Resolve Bounty par l'auteur (200) | 2026-08-23 | ✅ |
| Suite de tests unitaires (`roles`/`pins`/`bounties`.service.spec.ts) | 2026-08-23 | ✅ (26/26) |
| RBAC — pouvoir limité national (aucune action destructrice unilatérale) | 2026-08-25 — centralisé (`RolesService.isLocalModeratorForCity`), re-testé (6 nouveaux tests dédiés incl. exclusion national), audité par `architecture-review` | ✅ |
| Migrations TypeORM (remplace `synchronize`) | 2026-08-25 — baseline + `AddSpatialIndexes`, cycle run/revert/run vérifié sur 2 bases vierges isolées, dev backfillée sans perte | ✅ |
| Index spatiaux GiST (pins/bounties/cities) | 2026-08-25 — créés, usage réel confirmé par `EXPLAIN` sur la base de dev | ✅ |
| Google OAuth (`/auth/google`) | — | ⛔ (pas de credentials Google réels configurés — connu, non bloquant) |

**Commande de référence** (cycle complet auth+pins+bounties, compte jetable) :
```
node -e "
const base = 'http://localhost:3001';
const email = 'audit-test+' + Date.now() + '@mindclash.local';
fetch(base + '/auth/signup', { method: 'POST', headers: {'Content-Type':'application/json'},
  body: JSON.stringify({ email, password: 'AuditTest1234', displayName: 'Audit Bot' }) })
  .then(r => r.json()).then(b => console.log('signup', b.accessToken ? 'OK' : 'FAIL', b));
"
```
Note : les comptes `audit-test*@mindclash.local` créés par ces vérifications restent dans la
base locale (dev, jetable) — pas de nettoyage automatique, pas un problème en local.

## Frontend

| Workflow | Dernière vérification | Statut |
|---|---|---|
| `npm run lint` (apps/web) | 2026-08-23 (après la passe UX NN/g complète) | ✅ |
| `npx tsc --noEmit` (apps/web) | 2026-08-23 (après la passe UX NN/g complète) | ✅ |
| Accueil SSR — Hero + noms de villes présents dans le HTML rendu serveur | 2026-08-23 | ✅ |
| Carte Maroc — rendu SVG, sélection de ville → panneau | 2026-08-23 — **coordonnées de 3 villes ajustées** (anti-chevauchement, voir LOG.md), rayons discrétisés en 3 paliers, `role="button"`+clavier ajoutés. SSR vérifié : nouvelles coordonnées et 12× `role="button"` présents dans le HTML rendu | ⚠️ build/curl vert, jamais confirmé à l'œil (rendu visuel réel, sélection tactile) |
| `CreateSheet` — création Pin/Bounty depuis l'UI | 2026-08-23 — labels visibles + validation au blur + confirmation d'abandon ajoutés | ⛔ jamais testé UI réelle, seulement via API directe |
| `DetailSheet` — scrim, bouton retour navigateur, ducking audio à l'ouverture | 2026-08-23 — **nouveau comportement**, écrit ce jour (historique navigateur, scrim cliquable) | ⛔ non testable ici (nécessite un geste retour réel sur appareil) |
| Login/Signup — validation au blur, retour visuel mot de passe | 2026-08-23 — réécrit, pages SSR re-vérifiées (200, contenu attendu présent) | ⚠️ build/curl vert, jamais confirmé à l'œil |
| Audio — déverrouillage 1er geste, boucle, mute, ducking | 2026-08-23 — réécrit (bug de déverrouillage mobile corrigé, voir LOG.md) | ⛔ **non confirmé sur téléphone réel — point actif en attente de retour utilisateur** |
| Exposition LAN (PC + téléphone atteignent l'app) | 2026-08-22 | ✅ (confirmé par l'utilisateur) |
| Hydratation SSR/client (pas de mismatch React) | 2026-08-23 (dernier bug de ce type corrigé) | ✅ (corrigé, pas re-régressé depuis) |

**Limite structurelle** : aucun outil de navigateur/appareil réel n'est disponible dans cet
environnement (voir `.claude/HANDOFF/NEXT_SESSION.md`). Tout ce qui est marqué ⛔ ne peut être
vérifié que par un test réel de l'utilisateur — ne jamais annoncer ces lignes comme "vérifiées"
sur la seule base d'un lint/build vert. **En particulier le bouton retour navigateur pour fermer
une sheet (`DetailSheet`) est une implémentation réelle mais entièrement non testée en dehors de
la lecture du code** — priorité de confirmation la prochaine fois que l'utilisateur teste sur
téléphone.

## Règle d'audit

Avant d'annoncer un incrément "fait" : identifier les workflows du tableau ci-dessus que le
changement touche, ré-exécuter leur commande de référence (ou expliciter pourquoi c'est
impossible ici), mettre à jour leur ligne (statut + date), et committer ce fichier **dans le même
commit** que le changement de code qui a motivé la mise à jour. Un changement qui touche un
workflow ⛔ doit dire explicitement à l'utilisateur ce qui reste à confirmer de son côté — ne
jamais laisser un ⚠️/⛔ silencieux se faire passer pour un ✅.
