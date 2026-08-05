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

### 4. Shipping / Fulfilment 🟡 FOUNDATION DONE (2026-07-15)

> Vendor-agnostic `ShippingProvider` interface (mirrors payments) + built-in `ManualLabelProvider`
> that renders a printable, marketplace-branded address label (no vendor; browser → PDF). `Shipment`
> model is **per (order, seller)** since an order can span sellers. API `apps/api/src/shipping/*`:
> `GET /seller/sales`, `POST /seller/sales/:orderId/label`, `POST /seller/sales/:orderId/ship`;
> selected by env `SHIPPING_PROVIDER` (only `manual` today). Marking all sellers shipped advances the
> order to SHIPPED; re-generating a label never downgrades a shipped shipment. Verified live.
> Seller fulfilment UI is live at `/account/sales` (generate/print label, mark shipped, payout
> summary per order). **Remaining:** a `ShiprocketProvider` adapter for real scannable AWBs
> (needs their Shiprocket keys). Original spec:

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
DB columns `razorpayOrderId`/`razorpayPaymentId` are the generic gateway ids.

**Test keys wired (2026-07-28).** Real `rzp_test_*` key id/secret are in `apps/api/.env` +
`apps/web/.env.local`; checkout now reaches the live Razorpay test gateway. Verified live end-to-end:
`POST /payments/order` returns a real `order_*` id and reuses it on retry (no duplicate gateway
orders), forged signature / mismatched gateway order / missing fields all 400 with the order left
PENDING, unauthenticated 401, webhook rejects a bad HMAC, 19/19 tests pass. Also added: a
`payment.failed` handler on all three checkout call sites (the modal stays open for a retry; the
reason is toasted) and a ≥100-paise floor in `RazorpayProvider.createOrder`.
**Still needed to go live:** `RAZORPAY_WEBHOOK_SECRET` is still a placeholder — generate it in
Dashboard → Settings → Webhooks when registering the `/payments/webhook` URL, or every delivery is
rejected (verify-on-return still settles orders, so this only costs you the async safety net).
Swap the test key pair for live keys before taking real money.

**#2 — Test coverage. ✅ ADDRESSED.** Was: the only suite was
[payments.service.spec.ts](apps/api/src/payments/payments.service.spec.ts) (Razorpay), aimed at a
then-dead path. Now the online money path is covered end to end across
[payments.service.spec.ts](apps/api/src/payments/payments.service.spec.ts) (signature tampering,
settle → listing SOLD → notify, idempotent re-settle, refund-on-lost-hold, refund-on-already-cancelled,
captured-amount mismatch, webhook HMAC), [orders.service.spec.ts](apps/api/src/orders/orders.service.spec.ts)
(admin transition legality, claim/release, buyer cancel + policy cutoff/reason/refund-%),
and [seller-billing.service.spec.ts](apps/api/src/seller-billing/seller-billing.service.spec.ts)
(membership stacking, advisory lock, idempotent settle, admin registration alert).
Still thin: reviews and wishlist.

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

**#4 — README. ✅ DONE (2026-07-15).** [README.md](README.md) rewritten to describe the real
product (preloved C2C marketplace, online-only payments, seller membership, Supabase storage).

**#5 — Orphaned infra. ✅ DONE (2026-07-15).** `.firebaserc` deleted. Live deploy is Render (API+PG)
+ Vercel (web). Also fixed: `start:prod`/Render `node dist/main` — `tsconfig.build.json` now excludes
`prisma/` so build output lands at `dist/main.js` (was nesting at `dist/src/main.js`).

**#6 — Marketplace built complete before first sale.** Seller verification, reservation holds,
notifications, wishlist, seller reviews are all wired but unvalidated. ~~Reservation holds set
`reservedUntil` (2 days) with no sweeper job that ever releases an expired hold~~ ✅ **FIXED** —
[reservation-sweeper.service.ts](apps/api/src/listings/reservation-sweeper.service.ts) releases
expired holds back to APPROVED at boot and every 10 min (plain unref'd interval, no scheduler dep).

**#7 — Decoration before essentials.** ✅ **RESOLVED (2026-08-05)** — photo upload, payments and
real legal copy all landed; the legal pages now publish themselves off an admin-filled
`BusinessProfile`. Original finding: ~850 LOC of animation/decor (playful-background, section-wave,
confetti, fly-to-cart, home-sections) shipped while legal pages are unindexable placeholder drafts
and photo upload is missing. Not deleting — re-sequence: photo upload + real legal copy + payment
first, polish after.

---

## Admin & Marketplace Backlog — Planning (2026-07-30)

> 13 mixed bugs/features requested for the admin panel + customer app, planned in
> [BACKLOG-PLAN.md](BACKLOG-PLAN.md) after grounding each item against the actual code (confirmed
> root causes, not assumptions). Four architecture decisions were made: (1) seller verification
> merges `isSellerVerified` + `registrationPaidAt` into one pipeline requiring **both** payment and
> admin approval; (2) admin-created listings belong to a built-in **"Marketplace" system seller**;
> (3) order cancellation becomes admin-configurable on **cutoff window + reason codes + refund %**
> (no per-category/seller overrides); (4) order IDs become sequential, format **`NM-YYYYMMDD-NNN`**.
> Phased: **P1** bug fixes ✅ **DONE (2026-07-30)** — `GET /admin/orders/:id` +
> `admin/orders/[id]/page.tsx` (full order detail, was missing entirely); `PATCH /notifications/:id/read`
> wired to the shared notifications page (was structurally impossible — no per-id endpoint existed);
> `Notification.orderId` added + populated at every order-related notification so refund/order-placed
> notifications are clickable instead of dead `<div>`s.
> **P2** seller-identity foundation ✅ **DONE (2026-07-30)** — merged verification
> (`SellerBillingStatus.sellerVerified` = paid + admin-approved; `assertCanList` now checks both, not
> just membership), a grandfather-backfill migration so no already-paying seller got locked out;
> admin `Users` split into Sellers/Customers tabs with plan/expiry chips; `account-shell.tsx` hides
> My-listings/Sales for anyone who hasn't registered; `/account/membership` and `/sell` now show
> three distinct states (not registered / awaiting admin approval / needs a plan), with a
> non-seller-facing explainer replacing the raw purchase form. **P3** order lifecycle ✅
> **DONE (2026-07-30)** — sequential `Order.orderNumber` (`NM-YYYYMMDD-NNN`) via an atomic
> per-day counter (backfilled + every display usage swapped over, including the shipping label
> ref); a new admin-editable `CancellationPolicy` (cutoff window, reason codes, refund %) at
> `/admin/settings`, enforced in `OrdersService.cancel`/`updateStatus` and applied to refund
> amounts, with a shared reason-picker dialog replacing the old bare confirm. **P4** greenfield
> content tools ✅ **DONE (2026-07-30)** — admin-created listings attributed to a seeded
> "Marketplace" `isSystemSeller` account (`POST /admin/listings`, auto-approved) plus per-listing
> category reassignment; a markdown Blog CMS (`BlogPost` model, public `/blog` + `/blog/:slug`, full
> admin CRUD + publish/unpublish preserving first-publish date across republish cycles,
> `MarkdownContent` render component — hit and fixed an SSR crash from plain `dompurify` needing
> `window`/jsdom by switching to `isomorphic-dompurify`); the "Send us a message" contact form now
> actually persists (`ContactMessage` model, public rate-limited `POST /contact`, was previously a
> pure front-end mock) and surfaces in `admin/messages` with NEW→READ→RESPONDED tracking. **All 13
> backlog items now shipped** — see [BACKLOG-PLAN.md](BACKLOG-PLAN.md) for full detail; nothing from
> this backlog remains open.

**Post-backlog follow-up fixes (2026-07-30):** three more gaps reported after the backlog closed.
(1) Admins had no signal when a customer paid the ₹100 seller-registration fee — `SellerBillingService.settle()`
now calls `NotificationsService.notifyAdmins('SELLER_REGISTERED', ...)` on the REGISTRATION payment
path (mirroring how `PaymentsService.settle()` already does for `ORDER_PLACED`); a new
`Notification.relatedUserId` column lets the notification deep-link to the seller's admin profile
when there's no order/listing to link to instead. (2) `admin/users` was a flat list with no
drill-down — added `GET /admin/users/:id` + `admin/users/[id]/page.tsx` showing contact info
(email/WhatsApp/city/role), seller status (verified/registered/membership), and recent
listings/orders-as-buyer/sales-as-seller, mirroring the order-detail pattern from Phase 1. (3) Several
shared Zod schemas (`shippingAddressSchema`, `registerSchema`, `blogPostInputSchema`,
`contactMessageInputSchema`, `listingInputSchema`, etc.) relied on Zod's raw default messages
("String must contain at least 1 character(s)") instead of friendly copy — every `.min()`/`.max()`
on a user-typed field now carries a specific message, and `shippingAddressSchema.postalCode` was
tightened from a loose `min(3).max(12)` (accepted non-numeric junk) to a real 6-digit regex. Verified
live: a real `SELLER_REGISTERED` notification fired and linked correctly (via a script that exercises
the actual `SellerBillingService.settle()` transaction, since triggering it through the UI needs a
real Razorpay payment), the new admin user-detail page rendered full profile + activity for a real
seller, and the checkout/blog forms now show the friendly messages instead of raw Zod text. 24/24
API tests pass (2 new), typecheck and lint clean.

---

## Gap-closing pass (2026-08-05)

> Audited the repo against these notes, then closed every gap that didn't need the operator's
> own credentials. **Test keys stay in place** — Razorpay live keys are a deliberate deferral,
> not an oversight. 52/52 API tests pass (28 new), typecheck + lint clean, both apps build.

**1. Seller payouts — the big one. ✅ NEW.** There was **no payout system at all**: buyers paid the
marketplace, and nothing anywhere recorded what was owed to each seller. `/account/sales` even
showed a "Payout total" that was just the item sum, with no commission and no way to pay it.
Now: a `SellerPayout` ledger row per **(order, seller)**, created inside the same transaction that
marks an order PAID — so a settled sale can't exist without its debt. Lifecycle
`PENDING → PAYABLE → PAID`, plus `CANCELLED`; delivery moves it to PAYABLE, order cancellation
cancels it (never touching an already-PAID row — that logs for manual recovery). Commission is a
new admin-editable `PayoutPolicy` in **basis points** (default 1000 = 10%), **snapshotted onto
each payout at sale time** so changing the rate never moves money already earned. `splitPayout()`
in shared is the single definition of the split; gross always equals commission + net exactly.
API `apps/api/src/payouts/*` — `GET /seller/payouts`, `/seller/payouts/summary`,
`GET /admin/payouts?status=`, `POST /admin/payouts/:id/pay` (requires a UTR/transfer reference;
only a PAYABLE row can be paid, and never twice). Web: `/admin/payouts` queue with an outstanding
total, `/admin/settings` commission field with a worked example, and `/account/sales` now shows
real net + gross + fee + status, with an on-hold/owed/paid summary. Migration backfills all 16
historical orders. **Nothing here moves money** — India needs Razorpay Route or a bank transfer to
pay a third party, so the transfer is done out of band and recorded with its reference. Verified
live end to end against the real DB (13 checks: lifecycle, guards, role isolation, and that a
rate change leaves earned payouts untouched).

**2. Membership expiry warnings. ✅ NEW.** `expiresAt` was only read at gate-check time, so a
paying seller's window lapsed in silence and the first sign was being refused a listing.
`MembershipExpiryService` (mirrors `ReservationSweeperService`: boot + every 6h, unref'd interval,
no scheduler dep) warns 7 days out and once on expiry, via new `MEMBERSHIP_EXPIRING` /
`MEMBERSHIP_EXPIRED` notification types that deep-link to `/account/membership`. Notices are
stamped on the membership row so a seller is told once per window. **The trap it avoids:**
memberships stack as separate rows, so an old row can look "expiring" while a later purchase
already extended the seller — only the user's latest-expiring row speaks for them.

**3. Buyer delivery confirmation. ✅ NEW.** `DELIVERED` was admin-only, which doesn't survive any
volume — and since delivery releases the seller's payout, sellers were waiting on admin data
entry to get paid. `PATCH /orders/:id/confirm-delivery` lets the buyer confirm their own SHIPPED
order, running the same side effects as the admin path (shipments cascade, payout leaves hold,
seller notified).

**4. Legal pages are now publishable. ✅ NEW** (this was the last item blocked "pending the
operator's details"). New `BusinessProfile` global row (legal entity, trade name, registered
address, support email/phone, grievance officer + email, optional GSTIN/CIN), editable at
`/admin/settings` with a live "N fields still needed" gate. The legal pages read it server-side:
until **every** required field is filled they keep `noindex` + the draft banner; once complete the
banner drops, the pages become indexable, and a statutory "Operator & grievance contact" block
renders on each. Copy that named missing details is now driven by the profile — Terms §1 names the
real entity, Privacy names the real grievance officer, and `[CITY, STATE]` in governing law became
the standard "courts having jurisdiction over the operator's registered office". The refunds page
reads the **live** `CancellationPolicy` (window + refund %) so it can't drift from what
`OrdersService.cancel` actually enforces; `GET /cancellation-policy` became public for this (it's
published policy — nothing sensitive). `[X] business days` became a truthful description of the
real flow: refunds are initiated automatically on cancellation, gateway settlement 5–7 working
days. **One number is an assumption, not a system rule:** `CONDITION_DISPUTE_HOURS = 48` in
[refunds/page.tsx](apps/web/src/app/refunds/page.tsx) — confirm or change it. Verified live in the
browser both ways: incomplete profile → noindex + banner, complete → indexable, banner gone,
operator block rendered, zero placeholders left.

**5. Shiprocket adapter. ✅ CODE-COMPLETE, UNVERIFIED.** `ShiprocketProvider` behind
`SHIPPING_PROVIDER=shiprocket` (+ `SHIPROCKET_EMAIL` / `_PASSWORD` / `_PICKUP_LOCATION`, validated
at boot so a misconfig fails on startup rather than in front of a seller mid-fulfilment). Three
calls per label: create order → assign AWB → generate label, with a cached bearer token and one
re-auth on 401. **Not tested against the live Shiprocket API** — that needs their account. `manual`
remains the default, so nothing changes until it's switched on.

**6. Error tracking. ✅ NEW, vendor-free.** A global `AllExceptionsFilter` + `ErrorReporter`:
expected 4xx pass through untouched, everything else is reported and the client gets a generic
message instead of a stack or ORM text. Sink is `ERROR_WEBHOOK_URL` (optional) — works today with
Slack/Discord/Better Stack/any JSON endpoint, so **no vendor decision was forced**. Unset = log
only. Adding Sentry later means one adapter implementing `capture`.

**7. Refresh-token revocation. ✅ NEW.** `User.tokenVersion`, carried in the JWT as `tv` and
checked on refresh. Bumped by password reset (so resetting actually signs out sessions opened with
the old password — it previously didn't) and by a new `POST /auth/logout-all`. Access tokens are
deliberately **not** checked against it: that would add a DB read per request, and their 15-minute
TTL is what bounds the window.

**8. Coverage + polish.** New suites for payouts, membership expiry, reviews and wishlist (24→52
tests). The two listing-grid `<img>` tags became `next/image`; the remaining two are documented
deliberate exceptions (a local SVG logo, and a cart-snapshot URL that may not match the remote
allowlist — `next/image` throws on unknown hosts).

**Still open, and why:** Razorpay **live** keys (deferred by choice — test keys work end to end);
Shiprocket live verification (needs their account); and the `CONDITION_DISPUTE_HOURS` figure above.

---

## Build order recommendation (to sequence roadmap + issues)

1. ~~**Image upload** (#3)~~ ✅ **DONE** — Supabase Storage, camera + compression.
2. ~~**Online payments + remove COD** (#1)~~ ✅ **DONE** — provider-agnostic, online-only.
3. ~~**Seller registration fee + membership gating** (roadmap #1)~~ ✅ **DONE** — see below.
4. **Shipping label flow** (roadmap #4) — 🟡 **DONE except live courier** (vendor-agnostic
   `ShippingProvider` + manual printable label + `Shipment` model + seller endpoints +
   `/account/sales`, verified live; `ShiprocketProvider` written but unverified — needs their keys).
5. ~~**Latest Listings homepage section** (roadmap #3)~~ ✅ **DONE** — home page fetches newest approved.
6. ~~**Seller payouts**~~ ✅ **DONE (2026-08-05)** — `SellerPayout` ledger + commission policy +
   admin payout queue. Recording only; the transfer itself is out of band (see gap-closing pass).
7. **Cleanup:** ~~rewrite README (#4)~~ ✅ · ~~delete `.firebaserc` (#5)~~ ✅ · ~~fix `node dist/main` (start:prod)~~ ✅
   (tsconfig.build excludes `prisma` → output is `dist/main.js`) · ~~reservation sweeper (#6)~~ ✅ ·
   ~~real legal copy (#7)~~ ✅ (admin-editable `BusinessProfile` gates publishing; operator just
   fills it in at `/admin/settings`).
