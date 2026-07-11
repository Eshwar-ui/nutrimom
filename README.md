# Nutrimom — E-commerce (Next.js + NestJS)

Maternal-nutrition storefront: catalog, cart, Razorpay checkout, user accounts,
and an admin dashboard. pnpm monorepo with a shared types/validation package.

```
apps/web      Next.js 16 storefront + admin (App Router, Tailwind v4)
apps/api      NestJS 11 API (Prisma + PostgreSQL, JWT auth, Razorpay)
packages/shared   Zod schemas + inferred types shared by both
```

## Prerequisites

- Node 22+, pnpm 10+
- Docker Desktop **running** (for local Postgres) — or point `DATABASE_URL`
  at any Postgres instance.

## First-time setup

```bash
pnpm install
pnpm --filter @nutrimom/shared build      # build shared package once

# 1. Start Postgres (needs Docker Desktop running)
docker compose up -d

# 2. Configure env — copy the blocks from .env.example
#    into apps/api/.env and apps/web/.env.local (already created with dev defaults).
#    Add your Razorpay TEST keys to apps/api/.env and apps/web/.env.local.

# 3. Create the schema + seed sample data (categories, products, admin user)
cd apps/api
pnpm prisma migrate dev --name init
pnpm prisma db seed
cd ../..
```

Seeded admin login: `admin@nutrimom.local` / `admin12345` (override via
`ADMIN_EMAIL` / `ADMIN_PASSWORD` in `apps/api/.env`).

## Run

```bash
pnpm dev            # both apps in parallel
# web → http://localhost:3000
# api → http://localhost:3001
```

Or individually: `pnpm --filter web dev`, `pnpm --filter api start:dev`.

## Razorpay

Use **test keys** from the Razorpay dashboard in `apps/api/.env`
(`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`) and
`NEXT_PUBLIC_RAZORPAY_KEY_ID` in `apps/web/.env.local`. The server computes the
authoritative amount, verifies the payment signature, and settles the order +
stock in one idempotent transaction. Point a webhook at `POST /payments/webhook`
for reconciliation.

## Verify

```bash
pnpm -r typecheck                 # all packages
pnpm --filter api test            # money-path unit tests (signature + settlement)
pnpm build                        # production build of both apps
```

End-to-end: browse → product → add to cart → checkout → Razorpay test payment →
order confirmation. Sign in as the seeded admin to manage products and orders.

## Design

The visual system is token-driven. Brand palette + logo live in:
- `apps/web/src/app/globals.css` — palette tokens (blush / sage / cream + coral /
  gold / forest-green). Change the `:root` values to re-theme everything.
- `apps/web/public/logo.svg` — brand mark (also the favicon via `src/app/icon.svg`).
