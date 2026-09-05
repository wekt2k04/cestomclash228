# Script vidéo — CestomClash228 (60 secondes, screencast)

Voix off pour la vidéo publicitaire du concours CréaAfrica (format imposé : screencast animé,
sans apparition physique). Ton : confiant, dynamique, orienté produit — pas d'angle associatif
(cohérent avec `docs/CONCOURS.md` : le jury note "pas de côté bénévolat"). Contenu basé
uniquement sur des faits réels du projet (650 membres réels, tagline officielle, mécaniques
Bounty/Notation/Ghost Mode telles que décrites dans `docs/VISION.md`/`docs/BUSINESS_PLAN.md`) —
aucun chiffre inventé.

Les 5 visuels référencés (`Asset 0` à `Asset 4`) sont dans `pitch/video-assets/` — voir
`pitch/video-assets/README.md` pour leur usage et leurs limites. Chaque moment du script a
maintenant son propre visuel dédié (retour utilisateur 2026-09-05 : "que chaque partie de la
vidéo soit compréhensible et révélatrice" de son propre moment) — le HOOK montre le PROBLÈME
(**Asset 0**, une personne débordée), les moments suivants montrent le PRODUIT qui le résout.

| Timing & action visuelle (Canva) | Texte exact de la voix off |
|---|---|
| **[0s–10s] — HOOK.** Ouverture sur **Asset 0 (Hook — le problème)** : une silhouette débordée, entourée de bulles de chat qui se chevauchent, chaotiques, inutiles ("URGENT quelqu'un a un logement pour demain 🙏", "c'est déjà répondu plus haut je crois"). Les bulles s'accumulent vite (rythme qui accélère les 3 premières secondes) puis se figent — le "?" au-dessus de la silhouette et le sous-titre portent le sens même sans le son. | *"Premier jour au Maroc. Logement, carte de séjour, inscription — tout à apprendre seul, noyé dans un groupe WhatsApp qui déborde... et qui n'aide jamais à temps."* |
| **[10s–30s] — PRODUIT.** Coupure nette (pas un fondu) : le chaos de bulles explose et se dissout, l'écran bascule vers l'identité CestomClash228 (logo qui se dessine en 360°, voir `apps/web/src/app/globals.css` `.mc-logo-spin`). Zoom sur **Asset 1 (Social-Map)** : les 6 villes s'allument une à une avec un léger effet de pulsation lumineuse ; une bulle d'aide "?" apparaît brièvement. | *"CestomClash228 remplace le bruit par une carte vivante — six villes, une communauté. Chaque astuce, chaque piège administratif : épinglé, là où il sert, visible par tous les Togolais du Maroc. Fini le fil qui défile sans fin ; place à l'exploration qui a un sens."* |
| **[30s–45s] — FEATURES.** Transition vers **Asset 3 (Bounty)** : le compte à rebours défile visuellement, les étoiles de notation s'allument une par une de gauche à droite, en rythme avec "sa réputation grandit". Enchaînement rapide (0,5s, cut sur le mot "prêt") vers **Asset 4 (Ghost Mode)** : le toggle bascule visuellement de "Public" à "Fantôme". | *"Besoin d'aide avant un examen ? Poste une Bounty. Qui répond est noté — sa réputation grandit à chaque aide. Pas prêt à te montrer ? Le Ghost Mode te protège, le temps qu'il faut."* |
| **[45s–60s] — CTA & VISION.** Zoom arrière progressif sur l'ensemble de l'interface. Le logo CESTOMCLASH228 se centre, un compteur anime le chiffre jusqu'à **650** (synchronisé sur "six cent cinquante"). La tagline apparaît en overlay, lettre par lettre, calée sur les 3 mots courts de la voix off. Dernier plan : logo + mention CréaAfrica 2026. | *"Déjà six cent cinquante étudiants togolais dans le réseau — une communauté qui répond, même à zéro heure du matin. Explore. Partage. Level-up. Votez CestomClash228 pour CréaAfrica 2026."* |

## Notes de production

- **"Sponsorisé"/Asset 2 volontairement absent du script** : le mécanisme réel (Sponsoring
  vérifié) n'a pas d'équivalent visible directement sur la carte dans le produit actuel (aucune
  fonction de projection lat/lng pour un badge sur la carte, voir `docs/PLAN_EXTENSION.md` §
  Décisions ouvertes, point 4). L'asset existe (`02-pin-dore.html`) comme visuel de vision pour
  le Business Plan/PPT, mais l'inclure dans une vidéo de 60s présentée comme le produit actuel
  risquerait de sur-promettre. À ajouter si tu préfères prendre ce risque assumé.
- **Ghost Mode mentionné mais pas construit** — cohérent avec le reste du pitch qui le présente
  déjà comme roadmap (slide Business case, PPT).
- Minutage vérifié à un débit oral moyen (~150 mots/minute, français) — chaque bloc de texte
  tient dans son créneau avec une marge pour les silences/respirations, pas collé seconde par
  seconde.
