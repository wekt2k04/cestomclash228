# MindClash 228

PWA géolocalisée d'entraide et de survie gamifiée pour la diaspora étudiante togolaise au
Maroc, portée par CESTOM. Concours CréaAfrica 2026.

**Statut actuel :** noyau MVP écrit et buildé (backend vérifié en conditions réelles, frontend
pas encore vérifié à l'œil dans un navigateur) — voir `docs/RESUME_FONCTIONNEL.md` pour ce que
ça fait concrètement, et `.claude/HANDOFF/NEXT_SESSION.md` pour l'état exact et la suite.

## Documentation

- [`docs/RESUME_FONCTIONNEL.md`](docs/RESUME_FONCTIONNEL.md) — ce que le produit fait
  aujourd'hui, en langage métier.
- [`docs/VISION.md`](docs/VISION.md) — le produit, le problème, le périmètre du premier
  incrément.
- [`docs/STACK.md`](docs/STACK.md) — choix techniques.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — structure et décisions de conception.
- [`docs/LEAN_CANVAS.md`](docs/LEAN_CANVAS.md) — canevas stratégique complet fourni par le
  porteur de projet.
- [`pitch/`](pitch/) — deck de pitch (`.pptx`), régénérable.

## Lancer le projet

```
docker compose -f infra/docker-compose.yml up -d   # PostgreSQL + PostGIS
cd apps/api && npm run start:dev                    # API NestJS — http://localhost:3001
cd apps/web && npm run dev                           # Frontend Next.js — http://localhost:3000
```

`apps/api/.env` et `apps/web/.env.local` sont déjà configurés pour le développement local (voir
les fichiers `.env.example` correspondants). RAM machine de dev serrée : éviter de laisser les
trois tourner en continu sans raison (voir `.claude/HANDOFF/NEXT_SESSION.md`).
