# STACK — MindClash 228

Décisions actées le 2026-08-22 (voir `.claude/HANDOFF/LOG.md` pour l'historique).

## Application

| Couche | Choix | Pourquoi |
|---|---|---|
| Frontend | Next.js (React), PWA | Vercel (hébergeur cible) est fait par la même équipe — meilleur support edge/SSR/PWA. |
| Cartographie | MapLibre GL JS + tuiles gratuites (OSM/MapTiler free tier) | Open-source, zéro coût d'API — cohérent avec le "scale-to-zero" du canevas. |
| Backend | NestJS (Node.js/TypeScript) | Structure en modules/guards adaptée à la complexité du RBAC spatial et de la modération. TypeScript partagé avec le frontend. |
| Base de données | PostgreSQL + PostGIS | Requêtes géospatiales (clustering, scope RBAC par zone). |
| Auth | Email + mot de passe (hashé, rate-limité) + Google OAuth | Friction d'inscription minimale, plateforme robuste dès le départ (décision utilisateur du 2026-08-22 — pas de compromis sécurité même pour la démo). |
| Cache / temps réel | Redis (Upstash) | **Différé** — pas nécessaire tant que Ghost Mode (seul mécanisme qui en dépend dans le canevas) n'est pas construit. |
| Stockage vidéo | Cloudflare R2 | **Différé** — Reality-Vlogs hors du noyau MVP (pas d'egress fees quand on l'active). |

## Prérequis

- **Node.js ≥ 20.9** (Next.js 16 l'exige). Constaté le 2026-08-22 : le Node par défaut de la
  machine de dev était en v18.20.0 (trop ancien, `create-next-app` échoue sur le typegen) — géré
  via `nvm` (nvm-windows, déjà installé), basculé sur une version plus récente déjà présente
  localement. Si une session future retombe sur v18, relancer `nvm use` avec une version ≥ 20.

## Environnement actuel

- **100 % local** : PostgreSQL+PostGIS via Docker Compose. Aucun compte cloud créé pour
  l'instant (Vercel/Supabase/Upstash/R2/Railway) — décision du 2026-08-22, à provisionner
  quand le noyau sera stable.
- **Dépôt** : `git init` local uniquement, pas de remote GitHub pour l'instant.

## Cible de déploiement (post-MVP, quand on active le cloud)

Vercel (frontend) · Railway/Render (backend serverless, ~10-20$/mois) · Supabase (Postgres
managé) · Upstash (Redis managé) · Cloudflare R2 (vidéo). Tiers gratuits suffisants pour les
1000-2000 premiers utilisateurs actifs quotidiens.
