# Pitch deck — CestomClash228

`CestomClash228-Pitch.pptx` est généré par `generate-deck.mjs`. **Remplace `MindClash228-
Pitch.pptx` (supprimé du repo le 2026-08-31)** — reformaté de 11 slides à **4 slides** pour
coller au format réel du concours CréaAfrica (5 minutes de pitch, voir `docs/CONCOURS.md`), suite
au renommage `MindClash 228` → `CestomClash228` acté le même jour. Contenu tiré de
`docs/BUSINESS_PLAN.md` (le business plan détaillé est un document séparé, pas intégré au PPT —
décision explicite de l'utilisateur), `docs/VISION.md` et `docs/PLAN_EXTENSION.md` § Pivot
2026-08-31.

## Régénérer et vérifier

```
cd pitch
npm install   # une seule fois
node generate-deck.mjs
python verify_deck.py   # conda base (lxml) - voir ci-dessous
```

Écrase `CestomClash228-Pitch.pptx` en place. **Toujours lancer `verify_deck.py` après une
régénération** — c'est la seule vérification disponible dans cet environnement (pas d'outil de
rendu PowerPoint/LibreOffice). Le script ouvre le pptx comme un zip OOXML (`lxml`, pas besoin de
`python-pptx`) et vérifie : intégrité du zip, XML bien formé par slide, aucune forme qui dépasse
le cadre du slide, aucun chevauchement >25% entre boîtes de texte. Code de sortie 1 si un problème
est trouvé. **A déjà trouvé un vrai défaut** le 2026-08-31 : les labels de ville "Rabat"/
"Casablanca" sur la mini-carte (Slide 3) se chevauchaient (villes géographiquement proches,
labels centrés sous chaque point) — corrigé en remplaçant les labels individuels par une légende
textuelle unique à droite de la carte (voir `generate-deck.mjs`, plus aucun risque de collision
géométrique par construction).

## Structure (4 slides, header/footer identiques sur chaque slide)

1. Couverture — nom, tagline, accroche produit.
2. Problème → Solution (mapping 1:1, 3 lignes, icône "!" / "+" sur chaque carte, accent de fond
   discret).
3. Modèle économique & marché — 3 phases de revenu numérotées (icône 1/2/3), **mini-carte réelle
   des 6 villes CESTOM** (cercles proportionnels à `sqrt(effectif)`, positions relatives réelles)
   avec le total 650 membres mis en avant (source cestom.org).
4. Traction & demande — ce qui est réel aujourd'hui, ask au jury (à compléter), accent de fond
   discret.

## État connu à ce jour (2026-08-31, mis à jour après ajout des éléments visuels)

- **Slide 4, encart "Ce qu'on demande"** contient encore un placeholder explicite `[À compléter]`
  — modalités exactes du concours (financement/mentorat/autre) non connues à ce jour. **Ne jamais
  déposer ce fichier au jury avec ce placeholder non résolu.** Le placeholder chiffres de marché
  (Slide 3) est résolu : SAM réel (650, cestom.org) maintenant affiché via la mini-carte.
- Ajout d'éléments visuels suite au retour "trop monotone, fade, pas d'images" : icônes cercle+
  glyphe (pas d'image externe ni police d'icônes — zéro risque de rendu cassé), mini-carte de
  données réelle (Slide 3), accents de fond à faible opacité (Slides 2 et 4). Toujours uniquement
  des formes simples (cercles, rectangles) — pas de chemin vectoriel complexe non vérifiable.
- Palette reprise telle quelle du deck précédent (dark bg + rouge/or/vert/cyan) — **pas encore
  alignée** sur la direction afro-futuriste retenue le 2026-08-31 pour la refonte visuelle du
  produit (Incrément 2, `docs/PLAN_EXTENSION.md`). Alignement visuel = amélioration de suivi, pas
  bloquant pour le contenu.
- Polices : Bahnschrift + Segoe UI (polices Windows standard, pas les Google Fonts de l'identité
  web — PowerPoint ne les embarque pas par défaut, un jury sur une machine sans ces polices
  verrait une substitution silencieuse). Bahnschrift garde un registre technique proche de
  Chakra Petch.
- Fichier vérifié par `verify_deck.py` (zip valide, XML bien formé, aucun dépassement de cadre,
  aucun chevauchement de texte >25%, 0 problème sur la dernière exécution) — **toujours pas
  d'inspection visuelle réelle possible** (aucun outil de rendu PowerPoint/LibreOffice
  disponible ici). Le script vérifie la géométrie calculée, pas le rendu final (polices,
  anti-aliasing, retour à la ligne exact du texte) — une relecture visuelle par l'utilisateur
  reste recommandée avant dépôt, mais le risque de chevauchement grossier est maintenant
  activement testé plutôt que simplement espéré.
- Accents français vérifiés au niveau des octets (UTF-8 correct, ex. `è` = U+00E8) après qu'un
  terminal ait affiché des caractères mal rendus (`�`) — confirmé artefact d'affichage du
  terminal, pas une corruption réelle du fichier.
