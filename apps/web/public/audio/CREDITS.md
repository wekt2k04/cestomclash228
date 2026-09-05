# Crédits audio

## Piste active (mood "calm") : `ambient.mp3`

"A Picture of Beauty" par **PlayOnLoop** (Playonloop.com). Version preview MP3 téléchargée le
2026-09-05 depuis la [page du morceau](https://www.playonloop.com/2016-music-loops/a-picture-of-beauty/)
(`https://www.playonloop.com/previews/POL-a-picture-of-beauty-preview.mp3`) — remplace "Battle
March" sur demande explicite de l'utilisateur : un morceau "neutre, vecteur d'émotions, sans
caractéristique particulière" plutôt que l'ambiance épique/intense précédente.

Description donnée par PlayOnLoop : *"A lush, peaceful and deeply atmospheric piano song.
Emotional, flowing, with spacious, reverberated acoustic sounds and peaceful melodies."*
Catégorie : Acoustic/Piano, Easy Listening. Tags : Nostalgic, Romantic, Soft, Light.

- **Licence : CC-BY 3.0** — utilisation libre, **attribution requise** : crédit sous forme de
  lien vers Playonloop.com (lien visible dans l'en-tête de l'application, reformulé le 2026-09-05
  en "♪ Musique (crédit)" suite à un retour utilisateur — voir `Header.tsx`).
- Format vérifié : MPEG Layer III (MP3), 128 kbps, 44.1 kHz stéréo, 2.6 Mo — même famille de
  format que la piste précédente, déjà confirmée universellement décodée (y compris mobile).
- Bouclée via le même moteur Web Audio API à fondu enchaîné que la piste précédente (pas un
  `<audio loop>` simple) — voir `src/lib/audio-context.tsx`, `LoopEngine`. Le "pas d'impression
  de loop" demandé vient de ce mécanisme de code (fondu de 1.5s à chaque cycle), pas d'une
  propriété du fichier lui-même — s'applique donc à n'importe quelle piste chargée ici.
- **Limite honnête, non vérifiable dans cet environnement** : le choix de ce morceau précis
  (parmi plusieurs candidats "ambient/piano/émotionnel" du catalogue PlayOnLoop) s'est fait sur
  la base de sa description textuelle et de ses tags, **jamais en l'écoutant réellement** —
  aucune capacité audio disponible ici. Si le rendu à l'écoute ne convient pas (trop
  "romantique"/spécifique plutôt que neutre, point de bouclage audible malgré le fondu, etc.),
  il faudra le remplacer par un autre choix du même catalogue ou d'ailleurs, écouté par
  l'utilisateur avant adoption définitive.

## Historique

1. "Short Loops Background Music Pack" (CC0, OpenGameArt.org) — `calm.ogg`/`urgent.ogg`, jugée
   trop "contemplative". Retirée le 2026-08-23.
2. "Battle March" en WAV PCM 8 bits (OpenGameArt.org) — bon style, mais ne jouait pas sur
   téléphone (format probablement mal supporté par certains décodeurs mobiles). Retirée le
   2026-08-23.
3. "Battle March - Epic Orchestral Music Loop" (PlayOnLoop, MP3, CC-BY 3.0) — `epic.mp3`, gardée
   en piste pour le mood "urgent" (`TRACKS.urgent` dans `audio-context.tsx`) mais retirée du mood
   "calm" (par défaut, seul réellement utilisé aujourd'hui) le 2026-09-05 sur demande explicite
   de l'utilisateur pour quelque chose de plus neutre.
