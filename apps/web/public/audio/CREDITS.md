# Crédits audio

Téléchargé le 2026-08-23 depuis
[Short Loops Background Music Pack](https://opengameart.org/content/short-loops-background-music-pack)
sur OpenGameArt.org.

- **Licence : CC0 (domaine public)** — utilisation libre, aucune attribution requise.
- `calm.ogg` = "A Brand New Wisdom.ogg" (source) — ambiance contemplative, piste par défaut
  (exploration de la Social-Map).
- `urgent.ogg` = "Winter Dust.ogg" (source) — ambiance plus tendue, prévue pour un contexte de
  Bounty proche de l'expiration (voir `AudioMood` dans `src/lib/audio-context.tsx`).

Format Ogg Vorbis : lu nativement par Chrome/Firefox/Edge/Android. **Pas lu par Safari/iOS**
(WebKit ne supporte pas Ogg Vorbis) — limitation connue, non bloquante pour le MVP vu le public
cible (smartphones d'entrée de gamme, majoritairement Android — voir `docs/LEAN_CANVAS.md`),
mais à traiter avant un déploiement large (ajouter une version `.mp3` en `<source>` de repli).
