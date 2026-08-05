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
days. The condition-dispute window is admin-editable too — `CancellationPolicy.conditionDisputeHours`
(default 48), edited alongside the cutoff and refund % at `/admin/settings`. **It is the only field
on that model not enforced anywhere in code**, because there is no dispute-raising endpoint yet — it
is the published promise only, and both the schema comment and the admin field say so. Wire it into
that flow when it exists. Verified live in the browser both ways: incomplete profile → noindex +
banner, complete → indexable, banner gone, operator block rendered, zero placeholders left; and
editing the window to 72h changed the published page.

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

**Still open, and why:** Razorpay **live** keys (deferred by choice — test keys work end to end),
and Shiprocket live verification (needs their account). Everything else in this pass is closed.

---

## Blog QA pass (2026-08-06)

> Tested the blog end to end as admin. **The CRUD/API layer was already correct** — 24 live checks
> passed first time (anon 401, seller 403, validation, duplicate slug 400, draft privacy, publish
> cycle, republish preserving the original date, pagination bounds, delete idempotency). Everything
> wrong was on the *published output* side. Six defects found and fixed; 77/77 API tests pass
> (9 new), typecheck + lint clean, both apps build.

**1. 16 `<h1>` tags per post, title printed twice. ✅ FIXED.** The page renders `post.title` as its
`<h1>`, then `MarkdownContent` turned every `#` in the body into another one — the live post had
1 page h1 + 1 duplicate + 14 section h1s, and exactly one h2. `MarkdownContent` now takes
`headingOffset` (walks the lexed tokens and demotes headings; **not** marked's `walkTokens` option,
which only runs for `marked.parse()`, not `marked.parser()`) and `dropTitle` (drops a leading
heading matching the title, compared ignoring case/punctuation). Post page passes both; the admin
Preview passes the same so it shows what a reader gets. Now 1 h1 / 14 h2. Added h4–h6 prose styles
since everything shifted down a level.

**2. Blog absent from the sitemap. ✅ FIXED.** `sitemap.xml` had `/listings`, categories and every
listing but **zero** blog URLs — the one feature built for search traffic wasn't submitted.
`getBlogPostsForSitemap()` paginates (the API caps pageSize at 60; one oversized page would 400 and
silently produce no URLs — the same trap listings already documents).

**3. No social tags. ✅ FIXED.** Posts now emit `og:*` (type=article, cover as `og:image`,
`publishedTime`, author), a Twitter card, and a canonical pointing at the *current* slug. Required
adding `metadataBase` to the root layout — without it a relative OG image can't resolve absolutely.

**4. Renaming a slug killed the live URL. 🟡 FIXED, with a caveat.** A rename 404'd every existing
link with nothing recording where the post went. New `BlogPostSlug` table (unique slug → postId,
cascade delete); `update()` records the old slug in the same transaction, and the public lookup
falls back to it. Live-beats-retired is enforced both ways: taking a slug deletes any history row
for it, so a redirect can never shadow the post now sitting there. Verified live (13 checks incl.
rename-back, another post claiming a retired slug, drafts not leaking through old slugs).
**Caveat:** the old URL redirects via an instant client-side meta refresh, **not a 308** — the root
`loading.tsx` makes every page stream, so the HTTP status is committed before the redirect decision.
Moving the call into `generateMetadata` did not change it (metadata streams too in Next 16). Links
work and the destination carries the canonical. A true 308 needs a `proxy.ts` doing a slug lookup on
every blog request — deliberately not paid for.

**5. Raw Zod text + mislabelled failures. ✅ FIXED.** The `.max()` limits still returned
`"String must contain at most 160 character(s)"` (the friendly-message pass covered `.min()` only).
Also `blog.service` reported *every* create/update failure as `"That slug is already in use"` —
now only a real P2002 does; anything else propagates instead of sending the admin renaming a post to
fix an unrelated fault.

**6. Publish took up to 60s to go live. ✅ FIXED.** Public blog reads use `revalidate: 60`, so a
publish lagged and — worse — an **unpublish or delete left the post readable** for that window.
New `POST /api/revalidate-blog` route handler purges `/blog`, `/blog/[slug]` and `/sitemap.xml`,
called from the admin client after every mutation. Gated on the caller's own admin token (verified
against `GET /admin/blog`) rather than a shared secret, since the trigger runs in the browser where
a secret would be readable. Verified: unpublishing dropped the post from list *and* detail page
immediately; re-publishing restored both plus the sitemap entry.

**Found, not fixed (pre-existing, not blog-specific):** `notFound()` returns **HTTP 200** app-wide —
`/blog/never-existed` and `/listings/does-not-exist` both do it (same streaming cause as #4).
Readers get the correct "We couldn't find that page" screen, but crawlers see soft 404s. Also two
leftover **"Flow Test"** listings still carry `https://example.com/test-image.jpg`, which 404s
through `next/image` on every page that renders them.

**UX gaps noted, not fixed:** no auto-slug from the title (the admin must hand-type a
regex-constrained slug — the first real post's slug is literally `test-1` and its author `test`);
admin list has no view-live link, no dates and no pagination; toggling Preview collapses the page
and strands the scroll position in blank space.

---

## Admin-surface QA pass (2026-08-06)

> Swept all 10 admin areas — 96 live checks (authz boundary, CRUD, validation
> bounds, state guards, data integrity) plus a browser pass over every page. **95/96
> passed.** Three defects fixed; 87/87 API tests pass (10 new), typecheck + lint clean,
> both apps build.

**1. Admin listing creation was 403ing outright. ✅ FIXED.** `POST /admin/listings` →
`adminCreate()` → `create(marketplaceId)` → `assertCanList()`, so admin-created listings were
subject to the *seller* monetization gate applied to the platform's own **Marketplace** account.
That account is listed as an ordinary seller in admin → Users → Sellers with a working **Unverify**
button; someone had clicked it, so `isSellerVerified` was `false` and every admin listing failed
with *"Your seller account must be verified — registered and approved by an admin"* — told to an
admin. Now: `assertCanList` exempts `isSystemSeller` (the platform is not a seller it vets, and the
path must not depend on a togglable flag); `verifySeller` 400s on a system seller; the admin Users
row shows a **SYSTEM** badge with no toggle; the flag was repaired in the DB. Also gave
`listingInputSchema.images` real messages — an empty photo list returned raw Zod text.

**2. A live listing could never be taken down. ✅ FIXED.** `moderate()` matched
`where: { id, status: 'PENDING' }`, so an APPROVED listing returned 400 *"no longer awaiting
review"*, and there is no admin DELETE route — **once live, nothing could remove a listing.** That
contradicts the marketplace policy in §7 (*reject policy-violating listings · remove fraudulent
sellers*), and admin-created listings are auto-APPROVED so they could never be withdrawn at all.
Moderation now spans PENDING/APPROVED/REJECTED — takedown and reinstate — while **RESERVED and SOLD
stay excluded** (the original rationale still holds: the item is spoken for, and moving it would
pull an in-flight purchase out from under its buyer). The seller notification distinguishes a
takedown from a review verdict rather than telling someone their published listing "wasn't
approved". Web: a **Take down** control on live rows, **Reinstate** on rejected ones, a new
**Rejected** filter tab so they're reachable, and the reason dialog takes a `mode` for takedown copy.

**3. Payout not-found returned 400. ✅ FIXED.** `markPaid` threw `BadRequestException('Payout not
found')` — now `NotFoundException`, matching every other admin route.

**Verified live:** admin create 201 → APPROVED → in public browse; takedown 200 → out of browse +
404 on the detail page; reinstate → back in browse; takedown without a reason 400; seller 403;
SOLD listing still refused (*"has sold and can no longer be moderated"*); payout bogus id 404.

**⚠️ Data note:** an earlier crashed run of the battery left the live `CancellationPolicy` in a test
state (36h / 55% / reason codes reading "QA reason") and the retry snapshotted those as "original".
It was restored to the **schema defaults** (24h / 100% / 48h + the five standard reason codes), not
to whatever preceded it — if the operator had customised that policy, it must be re-entered at
`/admin/settings`. Payout policy and business profile round-tripped unchanged.

**Coverage gaps, not closed:** the 96-check battery is ad-hoc and does not run in CI; no unit tests
exist for categories, contact messages, or settings validation. The two most business-critical admin
actions — completing a valid order transition and marking a payout PAID — are irreversible on live
data, so they were exercised only through rejection paths and remain proven only by mocked unit
tests. A seeded test database is the prerequisite for testing those for real.

---

## Seller-surface QA pass (2026-08-06)

> 57 live checks across the seller API (auth boundary, listing lifecycle, ownership
> isolation, billing gate, fulfilment guards, payouts) plus a browser pass over every
> `/account/*` page. **57/57 passed** — no security or isolation defect. Two behavioural
> bugs found and fixed; 91/91 API tests pass (5 new), typecheck + lint clean, both apps build.

**Ownership isolation is sound.** Seller B gets 403 editing or deleting seller A's listing
(price verifiably unchanged after the attempt); listing sets, payout ledgers and sales lists have
zero cross-seller overlap; sellers get 403 on admin moderation and the admin payout queue. The
listing gate holds end to end: a fresh account is refused listing creation, reports `canList:false`,
and is refused a membership before registration. Editing a *live* listing correctly returns it to
PENDING and pulls it from public browse until re-approved.

**1. An admin status override stranded the seller's fulfilment state. ✅ FIXED.** The seller flow
(generate label → mark shipped) and `PATCH /admin/orders/:id/status` are two paths to the same
outcome and diverged: `updateMany` only touches rows that already exist, so an order advanced by an
admin before its seller ever opened fulfilment ended up **SHIPPED with no Shipment row at all**
(found live: `NM-20260713-002`). The seller's Sales page then read "Awaiting label" and offered to
label a parcel the marketplace already considered gone. New `OrdersService.cascadeShipments()`
brings every seller in the order up to the order's status, **creating the row when missing**
(`labelUrl` stays null — no label was ever made, and the row should record what actually happened)
and **never downgrading** a seller who is further along. Wired into the admin SHIPPED and DELIVERED
transitions and the buyer's confirm-delivery path. Verified live: admin PAID→SHIPPED on a throwaway
order now produces a `SHIPPED` shipment row where nothing existed before.

**2. `markShipped` reported a missing order as a missing label. ✅ FIXED.** It looked up the
`Shipment` and never the `Order`, so a non-existent order, an order the seller has no part in, and a
genuinely label-less one all returned **400 "Generate the shipping label first"**. Now mirrors
`generateLabel`'s order of checks — 404 *Order not found*, 403 *You have no items in this order*,
then the 400. Verified live both ways.

**Not fixed — two orders still carry the old inconsistency:** `NM-20260713-002` (SHIPPED) and
`NM-20260728-008` (DELIVERED) each miss a Shipment row for one seller. The code fix prevents new
occurrences but does not backfill; those sellers still see "Awaiting label". A one-shot backfill
(create the missing rows at the order's status) is safe but was left as the operator's call.

**Not fixed — 4 listings stuck SOLD.** `Stretchy Wrap Carrier`, `Cloth Books`, `Bedtime Story
Collection`, `Peek-a-Boo Flap Books` are SOLD while their only orders are PENDING with
`razorpayOrderId: null` — pre-payment-era COD orders, all stamped `updatedAt 2026-07-30T14:39:20`
(the backfill migration). **Legacy data, not a live bug**: the current cancel path was verified to
restore listings to APPROVED. But the consequence is live — those sellers cannot edit or relist
them (`"Sold listings cannot be edited"`), and the dashboard reads "Sold 1 / Revenue ₹0".

**Minor, not fixed:** `/account/membership` tells an already-verified seller "An admin will verify
your account before you can start listing" (unconditional copy); `/sell` shows skeletons for ~6s
while the billing gate resolves.

---

## Dev-database cleanup (2026-08-06)

> The operator asked for the dev data to be reduced to a test-only state. Scope was agreed
> up front, applied with a one-off script, then verified. **Hard delete, no backup taken —
> the removed rows are not recoverable.** Re-running `pnpm seed` restores the seeded personas
> and their listings, but not the orders or the deleted accounts.

**Removed:** 16 test-domain accounts (`@test.local` — the `flow-*`, `stack-*`, `vis-*`, `mem-*`
leftovers from earlier automated runs — plus `test@gmail.com`) and the 10 listings they owned;
**all 19 orders** with their 16 payouts, 1 review and order items; 29 notifications whose
`listingId`/`orderId` pointed at deleted rows (those columns are plain fields, not foreign keys,
so they would have survived as dead links).

**Kept:** `admin@gmail.com`, the **Marketplace system seller** (mandatory — admin listing
creation goes through it), the six seeded personas and their listings, and six real Gmail
accounts. Final state: **14 users, 49 listings (47 APPROVED / 2 PENDING), 0 orders**.

**Two deliberate side effects.** 7 listings were reset SOLD/RESERVED → APPROVED, because the
orders that sold or held them no longer exist — this also cleared the 4 legacy stuck-SOLD
listings noted in the seller QA pass, so those sellers can edit and relist again. And the two
`https://example.com/test-image.jpg` listings went with the flow-test accounts, ending the
`_next/image` 404s.

**Delete order matters** if this is ever repeated: `SellerPayout` holds `Restrict` FKs on both
order and seller, and `OrderItem` restricts listing deletion — so payouts first, then orders
(which cascades order items), then listings, then users.

Verified after: admin and seeded sellers still sign in, a deleted account 401s, public browse
returns 47, admin orders/payouts read empty, and **admin listing creation still returns 201**
(that path depends on the Marketplace account surviving).

---

## Buyer-surface QA pass (2026-08-06)

> 64 live checks across discovery, wishlist, checkout, order isolation, payment,
> reviews, cancellation and account, plus a full browser journey (shop → detail →
> bag → cart → checkout → Razorpay test modal). **60/64 passed**; three of the four
> "failures" were wrong expectations in the harness, not defects. One real bug found
> and fixed; 93/93 API tests pass (2 new), typecheck + lint clean, both apps build.

**The money path holds.** Creating an order flips the listing APPROVED → RESERVED and out of
public browse, and **a second buyer racing for the same item gets 400** rather than both reaching
payment. Cancelling releases the hold back to APPROVED and into browse. `POST /payments/order`
returns a real `order_*` id and **reuses it on retry** (no duplicate gateway orders); a forged
signature is rejected and leaves the order PENDING; the webhook rejects a bad HMAC. Buyer
isolation is clean — B cannot read, cancel, confirm delivery on, or pay for A's order, and
notifications and wishlists never overlap.

**Wishlisting a stale listing id returned 500. ✅ FIXED.** `WishlistService.toggle()` called
`create()` with no guard, so a listing id that no longer exists hit the foreign key unhandled —
the buyer got a server error and it reported to the error webhook as a genuine fault. Reachable
in ordinary use, and more so now that admins can take a live listing down: a buyer with the shop
page open clicks the heart on a removed item. Now catches **P2003** and returns 404 *"That item is
no longer available"*. Caught rather than pre-checked so the same answer holds when the listing
disappears mid-request; an unrelated DB error still propagates rather than being disguised as a
missing listing.

**Not defects — harness expectations that were wrong:** `POST /contact` and
`/auth/forgot-password` return **200** by design (explicit `@HttpCode`), and duplicate
registration returns **409**, which is more correct than the 400 the harness assumed.

**Checkout address polish. ✅ FIXED (2026-08-06).** Placeholders were bare examples
(`Bengaluru`, `Karnataka`, `560001`) that read as an address already filled in — the worst form to
be ambiguous on, since a buyer who skips it ships to the wrong place. All are now prefixed
`e.g.`, and every field carries the right `autoComplete` token (`address-line1`, `postal-code`,
`address-level1/2`, …) so browser autofill actually works, which is the real fix for an address
form. **Found while verifying:** the Full name prefill was *silently flaky* — `defaultValues` is
captured on the first render, which happens before the auth store hydrates, so arriving at
`/checkout` by a fresh page load left it blank while clicking through from the cart filled it. Now
set from a `useEffect` once the user resolves, guarded so it never overwrites what the buyer typed.

**"Used for: 0" was not a code bug.** `listing-detail.tsx` already guards on
`listing.usageDuration`, and the seller form already suggests `"8 months"` — one seeded test
listing simply has the literal string `"0"` in that free-text column. Data, not code; left alone.

---

## Public pages + end-to-end lifecycle (2026-08-06)

> Two passes. **Public surface:** 106 read-only checks over every unauthenticated page
> (98 passed; 5 of the 8 "failures" were crude assertions in the harness, not defects).
> **Lifecycle:** a 41-check end-to-end run across all three roles — **41/41**. All test
> data removed afterwards; 93/93 API tests, typecheck + lint clean, both apps build.

**Public surface is healthy.** Every page 200s with real content and a `<title>`; `robots.txt`
blocks `/admin`, `/account`, `/checkout`; the sitemap carries blog and listing URLs and excludes
the private ones; **every `<img>` on every public page has alt text** (57 on the home page alone);
one `<h1>` per page; no horizontal overflow at 375px. Anon hitting `/account/*` is redirected and
leaks nothing — the only match on a keyword sweep was the static nav label in the shell.

**1. `/policies` promised a payment method that does not exist. ✅ FIXED.** It read *"Pay online
through our secure gateway, or arrange cash on pickup where the seller offers it"* — but COD was
removed and `OrdersService.create` hard-codes `ONLINE`. A public page told buyers they could pay
cash. Rewritten to online-only.

**2. The `PaymentMethod` enum comments were inverted. ✅ FIXED.** They labelled `COD` as *"the
active method"* and `ONLINE` as *"kept for a future rollout"* — exactly backwards since the
online-payment migration, and the first thing anyone reads in the shared schema.

**Left alone deliberately:** `/orders/[id]` still branches on COD (a "pay when handed over" line
and a 3-step progress bar). After the data cleanup no order uses COD, so it is unreachable, but
the enum value must survive for schema compatibility and the branch renders correctly if a
historical row ever reappears.

**The legal pages are correctly unpublishable.** `/terms`, `/privacy`, `/refunds` all carry
`noindex, nofollow` because the `BusinessProfile` has **all 7 required fields blank**. The gate
works; it just means the site cannot legally publish until those are filled at `/admin/settings`.
(`/policies` is deliberately outside the gate — a plain-English hub, not a statutory document.)

**End-to-end lifecycle — 41/41, closing the two gaps flagged in the admin pass.** Completing a
real order transition and marking a payout PAID had only ever been covered by mocked unit tests.
Both now verified against the live stack: buyer orders (listing → RESERVED, no payout yet) →
payment settles (listing → SOLD, leaves browse, payout row created on hold, seller notified) →
seller labels then ships (ship-before-label refused; another seller refused 403; order → SHIPPED;
payout still held) → buyer confirms delivery (stranger refused; double-confirm refused; payout →
PAYABLE) → admin records the transfer (no-reference refused, seller-pays-self 403, paid with a
UTR, double-pay refused) → cancelling a delivered order refused. **Money math exact at every
step:** gross 100000 = fee 10000 + net 90000 at 1000 bps, and the seller's summary moved from
owed to paid. Settlement used the admin PAID transition rather than the Razorpay modal, which
needs a real card — the same settle path, so the only untested link remains the gateway callback
itself.

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
