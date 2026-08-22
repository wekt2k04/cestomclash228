# Pitch deck — MindClash 228

`MindClash228-Pitch.pptx` est généré par `generate-deck.mjs` à partir du contenu de
`docs/LEAN_CANVAS.md` et des décisions actées dans `docs/VISION.md`/`docs/ARCHITECTURE.md`.

## Régénérer

```
cd pitch
npm install   # une seule fois
node generate-deck.mjs
```

Écrase `MindClash228-Pitch.pptx` en place.

## État connu à ce jour (2026-08-22)

- **Slide 5 (Démo)** est un placeholder honnête — pas de vraie capture d'écran, le noyau MVP
  (Social-Map/Bounties/Auth/RBAC) n'est pas encore terminé côté frontend. À remplacer par une
  vraie capture dès que l'écran Social-Map tourne.
- **Slide 11 (Closing)** a un "ask" entre crochets à remplir — je ne connais pas les modalités
  exactes du concours CréaAfrica (financement, mentorat, autre).
- Polices : Bahnschrift + Segoe UI (polices Windows standard) plutôt que Chakra Petch/IBM Plex
  Sans de l'identité visuelle web — PowerPoint n'embarque pas les Google Fonts par défaut, et un
  jury sur une machine sans ces polices verrait une substitution silencieuse. Bahnschrift a un
  registre technique proche de Chakra Petch.
- Fichier vérifié structurellement (zip valide, 11 slides, images intégrées) mais **pas
  inspecté visuellement** — pas d'outil de rendu PowerPoint/LibreOffice disponible dans cet
  environnement. À ouvrir et corriger si un chevauchement ou un débordement apparaît.
