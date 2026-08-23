# Crédits audio

## Piste active : `epic.mp3`

"Battle March - Epic Orchestral Music Loop" par **PlayOnLoop** (Playonloop.com). Version MP3
téléchargée le 2026-08-23 depuis la [page du morceau sur Playonloop.com](https://www.playonloop.com/2010-music-loops/battle-march/)
(bouton "Download Preview") — remplace une première version WAV (PCM 8 bits, depuis
OpenGameArt.org) qui ne jouait pas du tout sur téléphone, très probablement parce que certains
décodeurs audio mobiles ne supportent pas le PCM 8 bits. Le MP3 est un format universellement
décodé.

- **Licence : CC-BY 3.0** — utilisation libre, **attribution requise** : crédit sous forme de
  lien vers Playonloop.com (lien visible dans l'en-tête de l'application).
- Choisi après retour utilisateur du 2026-08-23 : la toute première piste (contemplative) ne
  correspondait pas à l'énergie recherchée — référence donnée : le thème "Arise" de Solo
  Leveling (épique, intense).
- Jouée à faible volume (0.18) pour rester une ambiance de fond, pas un premier plan.
- Bouclée via un moteur Web Audio API avec fondu enchaîné (pas un `<audio loop>` simple) — voir
  `src/lib/audio-context.tsx`.

## Historique (retiré le 2026-08-23)

1. "Short Loops Background Music Pack" (CC0, OpenGameArt.org) — `calm.ogg`/`urgent.ogg`, jugée
   trop "contemplative".
2. "Battle March" en WAV PCM 8 bits (OpenGameArt.org) — bon style, mais ne jouait pas sur
   téléphone (format probablement mal supporté par certains décodeurs mobiles).
