# Pitch deck — CestomClash228

`CestomClash228-Pitch.pptx` est généré par `generate-deck.mjs`. **Remplace `MindClash228-
Pitch.pptx` (supprimé du repo le 2026-08-31)**, suite au renommage `MindClash 228` →
`CestomClash228` acté le même jour. Contenu tiré de `docs/BUSINESS_PLAN.md` (le business plan
détaillé est un document séparé, pas intégré au PPT — décision explicite de l'utilisateur),
`docs/VISION.md` et `docs/PLAN_EXTENSION.md` § Pivot 2026-08-31.

**Passé à 5 slides le 2026-08-31** (Problème et Solution séparées + vraie slide de Conclusion
distincte d'une slide de données), sur demande explicite de l'utilisateur ("problème, solution,
..., business case, grand résumé ou conclusion"). **Dépasse le "3-4 slides max" de
`docs/CONCOURS.md`** — assumé pour honorer l'instruction, à trimmer à 4 (fusionner Problème+
Solution, arrangement précédent encore dans l'historique git) si le format strict prime en
pratique le jour du dépôt.

**Sur les visuels "3D isométrique afro-futuriste" demandés** : aucun moteur de génération
d'images ni fonction de vision par ordinateur n'est disponible dans cet environnement (vérifié à
deux reprises par recherche d'outils le 2026-08-31, pas juste supposé) — impossible de produire
de vrais rendus 3D photoréalistes type Octane/Unreal Engine ici. La richesse visuelle vient de
primitives `pptxgenjs` réelles et vérifiées (cartes "verre dépoli" par dégradé+bordure+glow,
glow néon simulé via ombre externe à décalage nul, accents géométriques "isométriques" via les
presets `diamond`/`parallelogram`, réseau de lignes sur la mini-carte) — un habillage vectoriel
cohérent avec la charte (dark mode, néons cyan/or/vert), pas des illustrations figuratives.

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

## Structure (5 slides, header/footer identiques sur chaque slide sauf couverture)

1. **Couverture** — nom, tagline, accroche produit, accent géométrique "isométrique" (3 formes
   `diamond`/`parallelogram`, coin supérieur droit).
2. **Problème** — 3 cartes "verre dépoli" (icône "!"), citation réelle (reprise du deck
   d'origine), accent de fond rouge.
3. **Solution** — 3 cartes miroir de la Slide 2 (icône "+", même ordre pour la lecture 1:1),
   flux "Explore → Partage → Level-up" en bas de slide, accent de fond vert.
4. **Business case** — 3 phases de revenu numérotées, **mini-carte réelle des 6 villes CESTOM**
   avec effet réseau (lignes ville→centroïde, glow), total 650 membres mis en avant.
5. **Conclusion** — ce qui est réel aujourd'hui, ask au jury (à compléter), tagline de clôture,
   contact.

**Dépasse le "3-4 slides max"** de `docs/CONCOURS.md` (voir note en tête de fichier) — décision à
confirmer par l'utilisateur avant dépôt final.

## État connu à ce jour (2026-08-31, après restructuration 5 slides + habillage visuel)

- **Slide 5, encart "Ce qu'on demande"** contient encore un placeholder explicite `[À compléter]`
  — modalités exactes du concours (financement/mentorat/autre) non connues à ce jour. **Ne jamais
  déposer ce fichier au jury avec ce placeholder non résolu.** Chiffres de marché résolus : SAM
  réel (650, cestom.org) affiché sur la mini-carte (Slide 4).
- Habillage visuel étendu suite aux retours "trop monotone, fade" puis "génère les images ici"
  (pas d'outil de génération d'images disponible, voir plus haut) : cartes "verre dépoli"
  (dégradé + bordure translucide + glow), glow néon simulé (ombre externe à décalage nul, pas de
  type `glow` natif dans `ShadowProps` — vérifié dans les typings pptxgenjs avant usage), accents
  géométriques isométriques (`diamond`+`parallelogram`, pas de `custGeom` — coordonnées non
  documentées dans les fichiers embarqués, écarté par prudence), réseau de lignes sur la
  mini-carte. Palette assombrie/repunchée vers l'anthracite + néons (voir `COLOR` dans
  `generate-deck.mjs`).
- Polices : Bahnschrift + Segoe UI (polices Windows standard, pas les Google Fonts de l'identité
  web — PowerPoint ne les embarque pas par défaut, un jury sur une machine sans ces polices
  verrait une substitution silencieuse). Bahnschrift garde un registre technique proche de
  Chakra Petch.
- Fichier vérifié par `verify_deck.py` (zip valide, XML bien formé sur les 5 slides, aucun
  dépassement de cadre, aucun chevauchement de texte >25%, 0 problème sur la dernière exécution)
  + un contrôle numérique séparé (aucune valeur `NaN`/infinie dans les coordonnées brutes du XML,
  un défaut qu'une comparaison Python silencieuse aurait pu laisser passer) — **toujours pas
  d'inspection visuelle réelle possible** (aucun outil de rendu PowerPoint/LibreOffice
  disponible ici, et les nouveaux accents géométriques n'ont jamais été vus à l'écran par
  personne, y compris moi). Une relecture visuelle par l'utilisateur reste nécessaire avant dépôt.
- Accents français vérifiés au niveau des octets (UTF-8 correct, ex. `è` = U+00E8) après qu'un
  terminal ait affiché des caractères mal rendus (`�`) — confirmé artefact d'affichage du
  terminal (`verify_deck.py` force maintenant `stdout` en UTF-8 pour ne plus planter dessus),
  pas une corruption réelle du fichier.
