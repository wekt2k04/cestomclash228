# Pitch deck — CestomClash228

`CestomClash228-Pitch.pptx` est généré par `generate-deck.mjs`. **Remplace `MindClash228-
Pitch.pptx` (supprimé du repo le 2026-08-31)** — reformaté de 11 slides à **4 slides** pour
coller au format réel du concours CréaAfrica (5 minutes de pitch, voir `docs/CONCOURS.md`), suite
au renommage `MindClash 228` → `CestomClash228` acté le même jour. Contenu tiré de
`docs/BUSINESS_PLAN.md` (le business plan détaillé est un document séparé, pas intégré au PPT —
décision explicite de l'utilisateur), `docs/VISION.md` et `docs/PLAN_EXTENSION.md` § Pivot
2026-08-31.

## Régénérer

```
cd pitch
npm install   # une seule fois
node generate-deck.mjs
```

Écrase `CestomClash228-Pitch.pptx` en place.

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
- Fichier vérifié **structurellement seulement** (zip valide, exactement 4 `ppt/slides/slideN.xml`
  présents, tailles de contenu en nette hausse après l'ajout des visuels — cohérent avec le
  contenu ajouté) — **pas inspecté visuellement**, aucun outil de rendu PowerPoint/LibreOffice
  disponible dans cet environnement. À ouvrir et corriger en priorité : la mini-carte de la Slide 3
  et les icônes des Slides 2-3 (positionnement calculé, jamais vu à l'écran) — le risque de
  chevauchement est réel, pas hypothétique, plus élevé qu'avant vu la densité ajoutée.
