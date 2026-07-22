# Preloved by The Nurture Moms

A **C2C preloved baby, kids & maternity marketplace** for India. Verified sellers list
secondhand items; buyers purchase them online. pnpm monorepo with a shared types/validation
package. **Money is stored as integer paise everywhere — never floats.**

```
apps/web          Next.js 16 storefront + admin (App Router, Tailwind v4)
apps/api          NestJS 11 API (Prisma + PostgreSQL, JWT auth)
packages/shared   Zod schemas + inferred types shared by both
```

## What it does

- **Sellers** register (one-time ₹100), hold an active **membership plan** (₹99–₹999), and
  list items with **photo uploads** (Supabase Storage, camera + client-side compression).
- **Admin** reviews and approves/rejects every listing.
- **Buyers** browse approved listings, wishlist, and pay **online only** (Cash on Delivery is
  retired). Orders are confirmed only after payment is verified.
- **Payments are gateway-agnostic** — a `PaymentProvider` interface with a Razorpay adapter
  selected by `PAYMENT_PROVIDER`; add an adapter to swap gateways.
- Plus: seller verification badges, seller reviews, and in-app notifications.

## Prerequisites

- Node 22+, pnpm 10+
- A PostgreSQL database (Supabase Postgres works well) and a Supabase project for image storage.

## First-time setup

```bash
pnpm install
pnpm --filter @nutrimom/shared build          # build shared package once

# Configure env — copy the blocks from .env.example into:
#   apps/api/.env         (DB, JWT, Supabase, Razorpay, PAYMENT_PROVIDER)
#   apps/web/.env.local   (NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SITE_URL)

# Create a public Supabase Storage bucket named `listing-images` (8 MB limit,
# image/jpeg|png|webp) for listing photos.

# Sync the schema + seed sample data (categories, sellers, listings, admin)
cd apps/api
pnpm exec prisma db push       # or: prisma migrate dev --name init
pnpm exec prisma db seed
cd ../..
```

Seeded admin: `admin@nutrimom.local` / `admin12345` (override via `ADMIN_EMAIL` /
`ADMIN_PASSWORD`). Seeded sellers: `<name>@nurture.local` / `password123` (granted
registration + a membership so they can list immediately).

## Run

```bash
pnpm dev            # both apps in parallel — web :4000, api :4001
```

## Payments (Razorpay)

Online payment is the only method. Set `PAYMENT_PROVIDER=razorpay` and real **TEST** keys
(`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`) in `apps/api/.env`. The
server computes the authoritative amount, verifies the payment signature, and settles the order
+ stock idempotently. Point a webhook at `POST /payments/webhook` (it settles both order and
seller-billing payments). The same flow powers seller registration and membership purchases.

## Verify

```bash
pnpm -r typecheck                 # all packages
pnpm --filter api test            # money-path unit tests (signature + settlement)
pnpm build                        # production build of both apps
```

## Deploy

- **API + Postgres:** Render (`render.yaml` blueprint; autodeploys `master`).
- **Web:** Vercel.

## Design

Token-driven visual system. Brand palette + logo live in `apps/web/src/app/globals.css`
(`:root` palette tokens) and `apps/web/public/logo.svg`.
