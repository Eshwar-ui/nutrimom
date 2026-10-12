# Deploy

Two hosts, both **auto-deploy on push to `master`** via their own GitHub apps.
A GitHub Actions workflow (`.github/workflows/ci.yml`) lint/typechecks/builds
every push as a visible gate.

| Part | Host | Config |
|------|------|--------|
| web (Next.js) | Vercel | `apps/web/vercel.json` |
| api (NestJS) | Render | `render.yaml` |
| db (Postgres) | Render managed PG | `render.yaml` |

These are **one-time connect steps** — after them, pushing to `master` deploys.
Nothing here can be done from the CLI without your account tokens, so do it in
each dashboard.

## 1. API + database → Render

1. https://dashboard.render.com → **New → Blueprint** → pick the `nutrimom` repo.
   Render reads `render.yaml` and creates `nutrimom-api` + `nutrimom-db`.
2. On first apply, set the `sync: false` env vars (Render prompts for them):
   - `CORS_ORIGIN` → your Vercel URL (set after step 2, e.g. `https://nutrimom.vercel.app`)
   - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` → your Razorpay keys
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD` → optional, for the seeded admin login
3. First deploy runs `prisma migrate deploy` automatically. To load sample
   data once, open the service **Shell** and run: `pnpm --filter api exec prisma db seed`.
4. Note the service URL, e.g. `https://nutrimom-api.onrender.com`.

## 2. web → Vercel

1. https://vercel.com → **Add New → Project** → import the `nutrimom` repo.
2. Set **Root Directory** to `apps/web` (it picks up `vercel.json`).
3. Add environment variables:
   - `NEXT_PUBLIC_API_URL` → the Render API URL from step 1.4
   - `NEXT_PUBLIC_SITE_URL` → your Vercel URL (no trailing slash)
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID` → your Razorpay **public** key id
4. Deploy. Then go back and set Render's `CORS_ORIGIN` to this Vercel URL.

## Notes

- Render free web services **cold-start** (sleep after inactivity) and free
  Postgres **expires after 90 days** — fine for staging, upgrade for real use.
- No secrets live in GitHub — both platforms hold their own env vars. The CI
  Action only builds; it never deploys, so it needs no tokens.
- Razorpay keys are required: the API **refuses to boot** without them
  (validated in `apps/api/src/config/env.validation.ts`).
