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
| RBAC — pouvoir limité national (aucune action destructrice unilatérale) | jamais re-testé en direct depuis l'implémentation initiale | ⚠️ |
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
| `npm run lint` (apps/web) | 2026-08-23 | ✅ |
| `npx tsc --noEmit` (apps/web) | 2026-08-23 | ✅ |
| Accueil SSR — Hero + noms de villes présents dans le HTML rendu serveur | 2026-08-23 | ✅ |
| Carte Maroc — rendu SVG, sélection de ville → panneau | 2026-08-22 (build/curl seulement) | ⚠️ jamais confirmé à l'œil |
| `CreateSheet` — création Pin/Bounty depuis l'UI | jamais testé UI réelle, seulement via API directe | ⛔ |
| Audio — déverrouillage 1er geste, boucle, mute, ducking | 2026-08-23 — **réécrit ce jour**, bug de déverrouillage mobile corrigé (voir LOG.md) | ⛔ **non confirmé sur téléphone réel — c'est le point actif en attente de retour utilisateur** |
| Exposition LAN (PC + téléphone atteignent l'app) | 2026-08-22 | ✅ (confirmé par l'utilisateur) |
| Hydratation SSR/client (pas de mismatch React) | 2026-08-23 (dernier bug de ce type corrigé) | ✅ (corrigé, pas re-régressé depuis) |

**Limite structurelle** : aucun outil de navigateur/appareil réel n'est disponible dans cet
environnement (voir `.claude/HANDOFF/NEXT_SESSION.md`). Tout ce qui est marqué ⛔ ne peut être
vérifié que par un test réel de l'utilisateur — ne jamais annoncer ces lignes comme "vérifiées"
sur la seule base d'un lint/build vert.

## Règle d'audit

Avant d'annoncer un incrément "fait" : identifier les workflows du tableau ci-dessus que le
changement touche, ré-exécuter leur commande de référence (ou expliciter pourquoi c'est
impossible ici), mettre à jour leur ligne (statut + date), et committer ce fichier **dans le même
commit** que le changement de code qui a motivé la mise à jour. Un changement qui touche un
workflow ⛔ doit dire explicitement à l'utilisateur ce qui reste à confirmer de son côté — ne
jamais laisser un ⚠️/⛔ silencieux se faire passer pour un ✅.
