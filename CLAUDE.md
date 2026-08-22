# CLAUDE.md — Amorçage de projet

*Ce fichier a deux vies. Tant que `docs/VISION.md` n'existe pas, il amorce un projet vide (§0).
Une fois cadré, il devient la méthode de travail courante (§1-7) — remplacer alors §0 par un
simple pointeur vers `docs/VISION.md` et l'éventuel `.claude/HANDOFF/NEXT_SESSION.md`. Le reste
ne change pas : c'est la méthode, pas le contenu d'un projet en particulier.*

## 0. Amorçage (une seule fois, projet vide)

Si `docs/VISION.md` n'existe pas : ne pas écrire de code avant d'avoir demandé, en langage
libre (pas de menu fermé — la question est ouverte) : quoi construire, pour qui, contraintes
déjà connues (stack imposée, plateforme, échéance, durée de vie attendue, solo ou repris par
d'autres/plus tard). À partir de la réponse :

1. Choisir un palier d'ossature (§1) et le dire explicitement ("je pars sur le palier X parce
   que Y — dis-moi si tu veux plus/moins de structure") avant de continuer. Si la réponse reste
   ambiguë sur le palier, la plateforme ou la stack : une question fermée de clarification est
   légitime (§2) — ne jamais deviner à la place de l'utilisateur.
2. Générer les docs du palier choisi + un `README.md` humain minimal (nom, one-liner, comment
   lancer) — même un script jetable en mérite un.
3. `git init` si absent. Créer `.claude/agents/` seulement si le palier le justifie (§3).
4. Commit ("Cadrage initial"), puis démarrer la construction (§4) jusqu'à un résultat complet
   et fonctionnel — pas un squelette qu'on abandonne à mi-chemin.

Si `docs/VISION.md` existe déjà : projet déjà cadré, lire ce doc + `NEXT_SESSION.md` s'il
existe, continuer depuis l'état courant. Ne jamais reposer la question de cadrage.

## 1. Paliers — ne jamais sur-structurer

Chaque doc ou agent en trop coûte des tokens à toutes les sessions futures, pas qu'à celle-ci.
Le palier se choisit à l'amorçage (§0) et peut monter plus tard si le projet grossit
réellement — jamais préventivement.

| Palier | Quand | Docs | Agents | Handoff |
|---|---|---|---|---|
| Script | Jetable, usage perso, < 1 session | `README.md` seul | aucun | aucun |
| Appli | Plusieurs sessions, un seul dev | + `VISION.md` + `STACK.md` (courts) | seulement si risque récurrent identifié | `NEXT_SESSION.md` |
| Système | Multi-composants, repris entre sessions/appareils, enjeux réels | + `ARCHITECTURE.md` | 1 par risque récurrent réel | `NEXT_SESSION.md` + `LOG.md` + `.in_progress` |

## 2. Exécutant, pas décideur

Les docs de cadrage encodent les décisions déjà actées. Une question de logique
métier/architecture/techno qui n'y est pas déjà répondue n'est jamais tranchée seul(e) : elle
va dans "Décisions en attente" (`NEXT_SESSION.md`, ou à défaut se pose directement). Doute
entre décider et demander → demander : une question coûte peu, une décision prise à la place
de l'utilisateur coûte cher à défaire.

## 3. Agents custom — seulement si un risque revient

Créer un agent `.claude/agents/*.md` seulement pour un type de vérification qui reviendra à
chaque changement (sécurité si données sensibles/auth, qualité de schéma si pipeline de
données, revue d'architecture si plusieurs couches, tests si logique critique). Un agent créé
par réflexe est un coût net, pas un gain — aux paliers Script/Appli sans risque identifié,
aucun.

## 4. Construction : incrément → vérifié/audité → commit/log → suivant

Découper en incréments vérifiables indépendamment. Après CHAQUE incrément : le faire tourner
réellement (build + tests verts, ou vérification manuelle explicite — jamais "ça devrait
marcher"), le faire auditer par l'agent concerné s'il en existe un pour ce type de changement,
puis committer, puis logger si palier Système (`LOG.md` append-only, jamais réécrit). Ne
jamais logger "fait" un travail non vérifié. Marqueur `.claude/HANDOFF/.in_progress` pendant un
incrément de plus de quelques minutes, supprimé juste après le commit ; une session qui le
trouve au démarrage vérifie `git status`/`git diff` avant de faire confiance à du non commité.

## 5. Vérifier, ne jamais supposer

Avant d'affirmer un fait sur l'état du projet (fichier présent, test qui passe, comportement
réel) : le vérifier avec l'outil approprié. En cas de contradiction entre une doc et l'état
observé, l'état réel fait foi — corriger la doc, pas l'inverse.

## 6. Racine propre

Racine = minimum conventionnel (fichiers de build/config, `.gitignore`, `README.md`,
`CLAUDE.md`) + dossiers de premier niveau. Tout le reste (docs, scripts, rapports) va dans un
sous-dossier dédié, jamais à la racine.

## 7. Fonctionnel, pas un squelette

Un incrément annoncé "fait" tourne réellement — pas de stub vide, pas de TODO à la place d'une
fonctionnalité prétendument livrée. Documentation à jour à chaque incrément, pas rattrapée en
fin de projet.
