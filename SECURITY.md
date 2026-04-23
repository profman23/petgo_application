# Security & Environment Setup

## 🔒 Environment Files (NEVER commit)

This project uses separate environment files for each Neon database branch:

| File | Branch | Used by | Committed? |
|---|---|---|---|
| `.env.dev` | `development` | `npm run dev` | ❌ Never |
| `.env.staging` | `staging` | `npm run staging` | ❌ Never |
| `.env.production` | `production` | `npm run start` | ❌ Never |
| `.env.example` | — | Reference template | ✅ Yes (no secrets) |

All `.env.*` files are blocked by `.gitignore` except `.env.example`.

## 🚀 Running different environments

```bash
npm run dev         # uses .env.dev → development Neon branch (port 5000)
npm run staging     # uses .env.staging → staging Neon branch (port 5001)
npm run build       # build for production
npm run start       # production build → .env.production → production Neon branch
```

## 📦 Pushing schema changes to a Neon branch

```bash
npm run db:push:dev         # Push schema to development
npm run db:push:staging     # Push schema to staging
npm run db:push:production  # Push schema to production (requires 'yes' confirmation)
```

## ✅ First-time setup for a new environment

1. Create a Neon branch via console.neon.tech (Schema only, no auto-delete)
2. Copy the connection string
3. Create `.env.<env>` locally:
   ```bash
   cp .env.example .env.staging    # or .env.production
   # then edit and paste the real DATABASE_URL
   ```
4. Push schema: `npm run db:push:<env>`

## 🛡️ Rules

- **Never** paste `DATABASE_URL` or any secret into chat, commits, PRs, or issues.
- **Never** share `.env.*` files outside your local machine.
- If a secret leaks, **rotate immediately** in Neon console (Reset Password for the branch role).
- `.env.production` should exist only on the production server, not on your dev machine — ideally.

## 🔍 Verify nothing is tracked

```bash
git check-ignore -v .env.dev .env.staging .env.production
# Should print all three as ignored.

git ls-files | grep -E "^\.env"
# Should print only .env.example
```
