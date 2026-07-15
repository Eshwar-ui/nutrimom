# Nutrimom / Preloved by The Nurture Moms — Project Brief

> **What this actually is:** a **C2C preloved baby, kids & maternity marketplace** for India,
> where verified sellers list secondhand items and buyers purchase them.
> (The root README still calls it a "maternal-nutrition storefront" — that is stale; see Issue #4.)
> Stack: pnpm monorepo — `apps/web` (Next.js 16), `apps/api` (NestJS 11 + Prisma + Postgres),
> `packages/shared` (Zod schemas). Money is stored as **integer paise** everywhere.

---

## Planned Features (roadmap — not yet built)

### 1. Seller Monetization ✅ IMPLEMENTED (2026-07-15)

> Data model: `SellerPayment` (REGISTRATION|MEMBERSHIP, PENDING→PAID) + `SellerMembership`
> (plan, startsAt, expiresAt) + `User.registrationPaidAt`. Prices are server-authoritative in
> shared (`REGISTRATION_FEE_PAISE`, `MEMBERSHIP_PLANS`). Flow reuses the `PaymentProvider`
> abstraction from Phase 2. API: `apps/api/src/seller-billing/*` — `GET /seller/billing/status`,
> `POST /seller/billing/registration|membership|verify`; the gateway webhook (`/payments/webhook`)
> settles both orders and seller payments. **Gate:** `ListingsService.assertCanList` blocks
> `create` server-side when there is no active membership window (verified live: 403). Registration
> must precede membership (400 otherwise). Membership purchases stack onto the current expiry.
> Web: `/account/membership` (register + plan cards + buy), `/sell` is gated, billing helper in
> `lib/seller-billing.ts`. Seeded sellers get registration + a YEARLY window so the demo isn't gated.
> **Prepaid passes now; auto-renew (UPI AutoPay/e-NACH) is a later fast-follow.** Needs real Razorpay
> keys for live payment; all non-payment logic verified live.

Original spec (for reference):

**One-time seller registration fee**
- ₹100, one-time, required to verify a seller account and activate marketplace access.
- **Registration is mandatory *before* a seller can subscribe to a membership plan.**

**Seller membership plans** (a seller must hold an active plan before listing any product):

| Plan | Duration | Price |
|------|----------|-------|
| Monthly | 1 month | ₹99 |
| Quarterly | 3 months | ₹199 |
| Half-Yearly | 6 months | ₹499 |
| Yearly (Best Value) | 12 months | ₹999 |

- Gating rule: **no active membership → cannot create listings.** Enforce server-side in the
  listings create path, not just the UI.
- Membership lifecycle needed: start/expiry dates, active/expired state, renewal, and a check
  on every "create listing" / "publish listing" action.

### 2. Payment Policy — ONLINE ONLY (reverses current COD-only state)

- **Cash on Delivery (COD) is NOT available.** Every purchase goes through the online payment
  gateway (Razorpay, already built in `apps/api/src/payments/*` — currently dormant).
- Orders are processed **only after successful payment confirmation.**
- Registration fee + membership plans are **also** paid online (one-time + subscription).

### 3. Listings / Discovery

- Every newly **approved** product appears automatically in a **"Latest Listings"** section on
  the homepage.
- Admin reviews and approves/rejects all listings (approval flow already exists).

### 4. Shipping / Fulfilment (NEW — no code exists yet)

Order → seller ships, using a **marketplace-generated shipping label**:
1. Seller prepares the product for shipment.
2. A shipping label is generated after the order is confirmed.
3. Seller downloads and prints the label.
4. Seller pastes the label on the package.
5. Seller hands the package to the assigned courier / arranges pickup.
- Orders without the correct label may be delayed or cancelled.
- Needs: label generation (courier/aggregator integration or a printable PDF), an order state for
  "label generated / shipped", and seller-facing download UI.

### 5. Seller Responsibilities (policy — surface in Terms + seller onboarding)

Accurate descriptions & genuine photos · disclose defects/wear · ship within timeline ·
package safely · use only the marketplace-generated label · respectful buyer communication.
Violation → listing removal, suspension, or termination.

### 6. Buyer Guidelines (policy copy)

Read descriptions · review all images · contact seller for more info before ordering ·
pay securely online.

### 7. Marketplace Policy (rights reserved)

Review & approve all listings · reject policy-violating listings · suspend/remove fraudulent or
misleading sellers · update policies at any time.

---

## Audit Issues (from vanity-engineering review, 2026-07-15)

> ⚠️ **Read Issue #1 first — the roadmap above changes the audit's top recommendation.**

**#1 — Payment: online-only + provider-agnostic. ✅ DONE (2026-07-15).**
COD path removed (orders.service COD branch deleted; default is `ONLINE`; checkout is online-only).
Payments now go through a gateway-agnostic `PaymentProvider` interface
([payment-provider.interface.ts](apps/api/src/payments/payment-provider.interface.ts)) with a
`RazorpayProvider` adapter ([providers/razorpay.provider.ts](apps/api/src/payments/providers/razorpay.provider.ts)),
selected by env `PAYMENT_PROVIDER` (only `razorpay` today; add a case + adapter to swap to
Cashfree/PhonePe). Routes: `POST /payments/order`, `/payments/verify`, `/payments/webhook`.
Checkout wires create-order → gateway order → Razorpay checkout → verify → settle. The
`PaymentMethod` enum keeps `COD` so the 4 historical COD orders stay valid (retired, not selectable);
DB columns `razorpayOrderId`/`razorpayPaymentId` are the generic gateway ids. **To go live:** add real
`RAZORPAY_KEY_ID/SECRET/WEBHOOK_SECRET`. Verified live: online order creates PENDING/ONLINE, payment
route reaches the gateway (401 on placeholder keys, as expected), 6/6 money-path tests pass.

**#2 — Test coverage points at the (formerly) dead path.** The only real test suite is
[payments.service.spec.ts](apps/api/src/payments/payments.service.spec.ts) (Razorpay). Now that
online pay is core, this is correctly aimed — but the settlement/stock logic still needs tests for
the online flow end-to-end (order → pay → verify → listing SOLD → notify). The COD settlement in
`orders.service.ts` will be deleted, so don't invest tests there.

**#3 — Core gap: no image upload. ✅ DONE (2026-07-15) — Supabase Storage.**
Sellers now upload photos (camera/drag-drop, client-compressed) via `POST /seller/uploads`
→ NestJS `StorageService` → Supabase Storage (service-role key, public bucket) → public URL
stored in `Listing.images`. Files: api `src/storage/*`, `src/uploads/*`; web `components/image-uploader.tsx`,
`lib/compress-image.ts`, `authedUpload` in `lib/api.ts`. Requires env `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` + a public bucket named `listing-images`.
**Verified live (2026-07-15)** against the real Supabase project: bucket public/8MB/mime-locked,
upload 201 → public 200, 401 without token, 400 on non-image, orphan delete frees origin. DB is
Supabase Postgres (dev `apps/api/.env`). Note: `node dist/main` in `start:prod` is wrong — build
nests output at `dist/src/main.js` because `prisma/seed.ts` is compiled; Render's start command
likely needs `node dist/src/main` (pre-existing, separate from this feature).

**#4 — README describes the wrong product & the brand name is inconsistent.**
[README.md](README.md#L1) says "maternal-nutrition storefront"; it's a preloved marketplace.
Names in use: `nutrimom` (repo/README), `The Nurture Moms` (schema/UI), `nurturemom-ecommerce`
([.firebaserc](.firebaserc)). Pick one; rewrite README to match reality.

**#5 — Orphaned infra.** [.firebaserc](.firebaserc) points at `nurturemom-ecommerce` but there is
**no `firebase.json`** — nothing deploys to Firebase. Delete `.firebaserc`. Live deploy is
Render (API+PG) + Vercel (web).

**#6 — Marketplace built complete before first sale.** Seller verification, reservation holds,
notifications, wishlist, seller reviews are all wired but unvalidated. Note: **reservation holds set
`reservedUntil` (2 days) with no sweeper job that ever releases an expired hold** — latent
inventory bug ([listings.service.ts:244](apps/api/src/listings/listings.service.ts#L244)).

**#7 — Decoration before essentials.** ~850 LOC of animation/decor (playful-background, section-wave,
confetti, fly-to-cart, home-sections) shipped while legal pages are unindexable placeholder drafts
and photo upload is missing. Not deleting — re-sequence: photo upload + real legal copy + payment
first, polish after.

---

## Build order recommendation (to sequence roadmap + issues)

1. ~~**Image upload** (#3)~~ ✅ **DONE** — Supabase Storage, camera + compression.
2. ~~**Online payments + remove COD** (#1)~~ ✅ **DONE** — provider-agnostic, online-only.
3. ~~**Seller registration fee + membership gating** (roadmap #1)~~ ✅ **DONE** — see below.
4. **Shipping label flow** (roadmap #4). ⬅ NEXT
5. **Latest Listings homepage section** (roadmap #3) — small.
6. **Cleanup:** rewrite README (#4), delete `.firebaserc` (#5), add reservation sweeper or drop reservations (#6), fill real legal copy (#7).
