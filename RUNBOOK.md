# Nutrimom — Runbook

Operational guide for running, verifying, and troubleshooting the app locally.
Windows-first (PowerShell / Git Bash), but commands are the same on macOS/Linux.

- **web** (Next.js) → http://localhost:4000
- **api** (NestJS) → http://localhost:4001
- **db** (Postgres in Docker) → localhost:5432

---

## 0. Prerequisites (one-time)

| Tool | Version | Check |
|------|---------|-------|
| Node | 22+ | `node --version` |
| pnpm | 10+ | `pnpm --version` |
| Docker Desktop | any, **must be running** | `docker info` |

> On Windows, "Docker running" means the **Linux engine** is up, not just the
> CLI. `docker info` must return without a `dockerDesktopLinuxEngine ... cannot
> find the file` error. If it errors, open Docker Desktop and wait for the whale
> icon to go steady (see Troubleshooting).

---

## 1. First-time setup (run once)

```bash
# from the repo root: D:\Asan Projects\nutrimom
pnpm install                              # installs all workspaces
pnpm --filter @nutrimom/shared build      # build shared types package
```

### 1a. Environment files

Already created with working dev defaults:
- `apps/api/.env`
- `apps/web/.env.local`

Only thing you must edit for real payments: add your **Razorpay TEST keys**
(see §5). Everything else works out of the box.

### 1b. Database: start, migrate, seed

```bash
docker compose up -d                      # start Postgres (needs Docker running)

cd apps/api
pnpm prisma migrate deploy                # apply committed migrations (prisma/migrations)
pnpm prisma db seed                       # categories + products + admin user
cd ../..
```

**Migrations.** Schema changes go through Prisma Migrate now — never `db push`:

```bash
cd apps/api
pnpm prisma migrate dev --name <change-name>   # writes SQL to prisma/migrations + applies
```

The baseline migration `0_init` captures the schema as of 2026-07-22. A database
that was created **before** migrations existed (via `db push`) already has all the
tables, so `migrate deploy` fails once with **P3005** ("database schema is not
empty"). Fix is a one-time baseline resolve against that database:

```bash
cd apps/api && DATABASE_URL="<that db url>" DIRECT_URL="<that db url>" pnpm prisma migrate resolve --applied 0_init
```

Only resolve if the database actually matches `0_init`. Check first with
`pnpm prisma migrate diff --from-url "<that db url>" --to-schema-datamodel prisma/schema.prisma`
— if it reports differences (e.g. the DB predates the Shipment/SellerPayment
tables), run `DATABASE_URL=... pnpm prisma db push` once to sync it, **then**
resolve. Never resolve a migration the database doesn't really contain.

This applies to the Render production DB on the first deploy after this change —
run the resolve with the Render connection string, then redeploy. Empty/new
databases need nothing: `migrate deploy` applies `0_init` cleanly.

Seeded admin account:
- **Email:** `admin@nutrimom.local`
- **Password:** `admin12345`
- (override via `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `apps/api/.env`, then re-seed)

---

## 2. Daily run

```bash
docker compose up -d      # if the DB container isn't already running
pnpm dev                  # starts web + api together
```

Run one side only:
```bash
pnpm --filter web dev
pnpm --filter api start:dev
```

Stop:
- `Ctrl-C` stops the dev servers.
- `docker compose down` stops Postgres (data is kept in a volume).
- `docker compose down -v` stops Postgres **and deletes the data**.

---

## 3. Smoke test (is it working?)

1. Open http://localhost:4000 — landing page shows featured products.
2. **Shop** → open a product → **Add to cart** → cart badge increments.
3. Click **Sign in** → **Create an account** → you're logged in.
4. Cart → **Proceed to checkout** → fill address → **Pay** → Razorpay opens.
5. Complete a **test** payment → redirected to the order confirmation.
6. Sign in as the admin → **Admin** in the header → Dashboard shows the order;
   Products lets you create/edit; Orders lets you change status.

Health check: http://localhost:4001/health → `{"status":"ok","service":"nutrimom-api"}`

---

## 4. Verification commands

```bash
pnpm -r typecheck                 # typecheck all packages
pnpm --filter api test            # money-path unit tests (5 tests)
pnpm build                        # production build of both apps
```

---

## 5. Razorpay (test mode)

1. Get **test** keys from the Razorpay dashboard (Settings → API Keys).
2. Put them in:
   - `apps/api/.env` → `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
   - `apps/web/.env.local` → `NEXT_PUBLIC_RAZORPAY_KEY_ID` (same key id)
3. Restart `pnpm dev` so the new env is picked up.
4. At checkout, use Razorpay's test card, e.g. `4111 1111 1111 1111`, any future
   expiry, any CVV, and the OTP `123456` on the test page.

**How the money flow is protected**
- The **amount is computed on the server** from DB prices — the browser only
  sends `{productId, quantity}`.
- On success the server **verifies the payment signature** before doing anything.
- Marking the order PAID + decrementing stock happens in **one transaction**,
  guarded so a repeated call (verify + webhook) can't double-decrement.

**Webhook (optional, for reconciliation):** point a Razorpay webhook for
`payment.captured` at `POST http://<your-host>/payments/webhook` with the same
`RAZORPAY_WEBHOOK_SECRET`. For local testing, expose port 4001 with a tunnel
(e.g. `ngrok http 4001`) and use that URL.

---

## 5a. Password reset emails (Resend)

1. Create a free account at [resend.com](https://resend.com) and grab an API key.
2. Put it in `apps/api/.env` → `RESEND_API_KEY`. The default `MAIL_FROM_EMAIL`
   (`onboarding@resend.dev`) works out of the box for testing — swap it for an
   address on a domain you've verified in Resend once you're ready to go live.
3. `WEB_URL` (`apps/api/.env`) must match wherever the web app actually runs —
   it's what gets embedded in the reset link. Already set to
   `http://localhost:4000` for local dev.
4. Test it: `/forgot-password` on the web app → check the inbox for the
   address you registered with → the emailed link opens `/reset-password`.
   Reset tokens expire after 30 minutes and can only be used once.

Without a real `RESEND_API_KEY`, requests to `/auth/forgot-password` still
return success (this is deliberate — the endpoint never reveals whether an
email is registered) but no email actually sends; check the API log for a
"Failed to send password-reset email" warning.

---

## 6. Common tasks

**Reset the database (fresh start):**
```bash
cd apps/api
pnpm prisma migrate reset      # drops, re-migrates, re-seeds
cd ../..
```

**Change the schema:** edit `apps/api/prisma/schema.prisma`, then:
```bash
cd apps/api && pnpm prisma migrate dev --name <change> && cd ../..
```

**Edit shared types/validation:** change `packages/shared/src/index.ts`, then
`pnpm --filter @nutrimom/shared build` (the `pnpm dev` script also rebuilds it on
start). Both apps pick up the new types.

**Inspect the DB visually:**
```bash
cd apps/api && pnpm prisma studio      # opens http://localhost:5555
```

---

## 7. Troubleshooting

**`docker compose up` → `dockerDesktopLinuxEngine ... cannot find the file`**
Docker Desktop's Linux backend isn't running. Open Docker Desktop, wait for the
status to read "Engine running", accept any first-run prompts, and ensure WSL2
integration is enabled (Settings → General → *Use WSL 2 based engine*). Re-run
`docker info` until it succeeds, then `docker compose up -d`.

**API exits at boot with "Invalid environment variables"**
A required var in `apps/api/.env` is missing/blank. The error lists which one.
The Razorpay vars are required even in dev (dummy values are fine until you test
payments).

**API can't connect to the database**
Is the container up? `docker compose ps`. Does `DATABASE_URL` in `apps/api/.env`
match `docker-compose.yml` (`nutrimom:nutrimom@localhost:5432/nutrimom`)? Is port
5432 free? (`netstat -ano | findstr 5432`).

**Web calls fail with CORS / network error**
`NEXT_PUBLIC_API_URL` in `apps/web/.env.local` must be `http://localhost:4001`,
and `CORS_ORIGIN` in `apps/api/.env` must be `http://localhost:4000`. Restart
after changing env.

**"Prisma Client is not generated" / type errors from `@prisma/client`**
```bash
cd apps/api && pnpm prisma generate && cd ../..
```

**Port already in use (4000 / 4001 / 5432)**
Stop the other process, or change the port (`PORT` in `apps/api/.env`, `-p` flag
for `next dev`, and the compose `ports` mapping for Postgres).

**Logged out unexpectedly / 401 loops**
Access tokens live 15 min and auto-refresh. If both tokens are stale you're
logged out by design — sign in again. Clearing site data resets auth state
(tokens are in `localStorage` under `nutrimom-auth`).

**Products don't appear**
The DB isn't seeded, or the API is down. Run `pnpm prisma db seed` and confirm
`http://localhost:4001/products` returns data.

---

## 8. Ports & credentials quick reference

| What | Value |
|------|-------|
| Web | http://localhost:4000 |
| API | http://localhost:4001 |
| API health | http://localhost:4001/health |
| Postgres | `postgresql://nutrimom:nutrimom@localhost:5432/nutrimom` |
| Prisma Studio | http://localhost:5555 (`pnpm prisma studio`) |
| Admin login | `admin@nutrimom.local` / `admin12345` |
