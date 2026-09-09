# Crédits audio

## Piste active (mood "calm") : `ambient.mp3`

Musique générée par **l'utilisateur avec Suno** (IA de génération musicale), extraite le
2026-09-09 de sa propre vidéo "5 minute classroom timer with relaxing lofi music.mp4" (piste
audio uniquement, la vidéo elle-même — minuteur visuel — n'est pas utilisée). Remplace "A Picture
of Beauty" (PlayOnLoop) suite à un remplacement demandé par l'utilisateur.

**Note de traçabilité importante** : un premier fichier proposé pour ce remplacement
("Justin Bieber - Intentions (Official Instrumental) ft. Quavo", puis renommé "perso.mp4" —
même fichier, taille identique à l'octet) a été refusé : instrumental officiel d'un titre
commercial sous droits (Def Jam/Universal), impropre à un usage public malgré le renommage. Le
fichier Suno ci-dessus est un fichier distinct (taille différente), présenté par l'utilisateur
comme sa propre création — traité comme tel, contrairement au premier.

- **Licence** : contenu généré par IA via Suno, à la discrétion de l'utilisateur selon les
  conditions d'utilisation de son compte Suno (les droits accordés varient selon le palier
  gratuit/payant — non vérifiable depuis cet environnement, à la charge de l'utilisateur de
  confirmer que son palier Suno couvre l'usage public commercial visé).
- Format vérifié : extraction ffmpeg directe de la piste audio AAC de la vidéo source, réencodée
  en MPEG Layer III (MP3), 128 kbps, 44.1 kHz stéréo, 4,8 Mo, 5 min 16 s. Signal réel confirmé par
  `ffmpeg -af volumedetect` (mean -16.1 dB, max -1.6 dB — pas de silence).
- Bouclée via le même moteur Web Audio API à fondu enchaîné que les pistes précédentes (pas un
  `<audio loop>` simple) — voir `src/lib/audio-context.tsx`, `LoopEngine`.
- Le lien de crédit dans l'en-tête de l'application (`Header.tsx`, "♪ Musique (crédit)") pointait
  vers Playonloop.com pour la piste précédente — **à mettre à jour ou retirer** puisque la piste
  active n'est plus sous licence CC-BY nécessitant une attribution formelle à un tiers.

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
