# PetGo — Mobile Veterinary Clinic

Full-stack ride-hailing style app for mobile veterinary services.
React 18 + TypeScript + Express + PostgreSQL (Neon) + Drizzle ORM.

## Local development

```bash
npm install
npm run dev     # runs on http://localhost:5000 using .env.dev
```

Requires `.env.dev` with `DATABASE_URL` (see `.env.example`).

## Environments

| Env | Command | DB branch | Port |
|---|---|---|---|
| dev | `npm run dev` | `development` | 5000 |
| staging | `npm run staging` | `staging` | 5001 |
| production | `npm run start` (after `npm run build`) | `production` | from `PORT` env var |

## Database schema changes

```bash
npm run db:push:dev         # Push schema to development
npm run db:push:staging     # Push schema to staging
npm run db:push:production  # Push schema to production (requires 'yes')
```

## Deploying to Render

This repo includes `render.yaml` for one-click Render deployment.

### First-time setup

1. **Push this repo to GitHub** (private repo recommended).
2. **In Render dashboard:** New → Blueprint → Connect repo → Apply `render.yaml`.
3. Render will create two services: `petgo-staging` and `petgo-production`.
4. For **each service**, set the secret env vars in Render dashboard (Environment tab):
   - `DATABASE_URL` (Neon connection string for that branch)
   - `EMAIL_PASSWORD`, `MYFATOORAH_API_KEY`, `TAQNYAT_API_KEY`, `PERPLEXITY_API_KEY` (when ready)
5. Branches:
   - `staging` branch → deploys to `petgo-staging`
   - `main` branch → deploys to `petgo-production`

### Promoting staging → production

```bash
git checkout main
git merge staging
git push origin main        # triggers production deploy
```

## Security

See [SECURITY.md](SECURITY.md) for env file handling and secret rotation.

**Never commit `.env.dev`, `.env.staging`, or `.env.production`.**

## Project structure

```
client/         — React 18 frontend
server/         — Express backend
shared/         — Drizzle schema + shared types
migrations/     — Drizzle-generated SQL migrations
scripts/        — dev-ops helpers (db:push wrapper)
```

## Feature flags

External integrations (MyFatoorah, Taqnyat SMS, Perplexity AI, Email SMTP)
are disabled by default via env flags. Set `*_ENABLED=true` + provide the
API key to enable.
