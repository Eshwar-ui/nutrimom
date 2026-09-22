# The Nurture Moms — Mobile App PRD

> **Status:** Approved for build · **Created:** 2026-09-22 · **Updated:** 2026-09-23
> **Owner:** Kalyan (Asan Innovators)
> **Sources:** this repo at `master` (f8b3768) · `origin/feat/sitemap-restructure` (28aab38) ·
> `The_Nurture_Moms_Complete_Website_Plan.pdf` (founders' master brief, 17 sections).

## Decision log

Settled 2026-09-23. These are closed — they are recorded here so they are not relitigated
in review, not reopened for discussion.

| # | Decision | Consequence |
|---|---|---|
| **D1** | **Flutter** (single codebase, iOS + Android) | The TS contract in `packages/shared` must be mirrored in Dart and guarded by a drift test — see R0.2. |
| **D2** | **Buyer + Seller** roles. No admin app. | Admin stays on responsive web. |
| **D3** | **All four pillars** in v1 (Move · Nourish · Connect · Pass it on) | Service screens are read-only + WhatsApp CTA. No in-app booking or scheduling. |
| **D4** | **Physical goods on Razorpay; seller membership routed to the web account page** | Avoids the store-billing classification risk on the ₹100 registration and ₹99–999 plans. **Confirm at a pre-submission review before P4 submission.** |
| **D5** | **`BusinessProfile.supportPhone` is the WhatsApp destination** for YOGA / FOOD / SOLIDS / CONNECTION | No new constant; the admin already fills it at `/admin/settings`. Blank → enquiry form fallback. |
| **D6** | **"Join the community" → WhatsApp group invite, with Instagram broadcast as the secondary** | Neither URL exists in the repo today → new admin-editable fields (**B7**). |
| **D7** | **Firebase** for push, analytics and crash (FCM + Analytics + Crashlytics, one SDK) | Closes the vendor question for M0.4 and every metric in §7. |
| **D8** | **Publish the "starting from" ranges in the app** (brief §10) | Prices are provisional and *will* move → pillar content must be API-served, not hardcoded (**B4**). |
| **D9** | **Riverpod** for state management | Decided at kickoff. Not revisited. |

---

## 0. What already exists (the thing we are wrapping)

This is not a greenfield product. The mobile app is a **second client on a complete, live
backend** (Render API + Postgres, Vercel web, Supabase Storage).

### 0.1 API surface — 17 NestJS modules, ~70 endpoints

| Module | Endpoints | Mobile module |
|---|---|---|
| `auth` | `POST /auth/register\|login\|refresh\|logout-all\|forgot-password\|reset-password` | M1 |
| `users` | `GET/PATCH /users/me`, `POST /users/me/request-seller-verification` | M1, M6 |
| `categories` | `GET /categories` (+ admin CRUD) | M2 |
| `listings` (public) | `GET /listings`, `GET /listings/:id`, `GET /listings/:id/contact`, `GET /sellers/:id` | M2 |
| `listings` (seller) | `GET/POST /seller/listings`, `GET /seller/listings/stats`, `PATCH/DELETE /seller/listings/:id` | M6 |
| `wishlist` | `GET /wishlist`, `GET /wishlist/ids`, `POST /wishlist/toggle` | M3 |
| `orders` | `POST /orders`, `GET /orders`, `GET /orders/:id`, `PATCH /orders/:id/cancel`, `PATCH /orders/:id/confirm-delivery` | M4, M5 |
| `payments` | `POST /payments/order`, `POST /payments/verify`, `POST /payments/webhook` | M4 |
| `seller-billing` | `GET /seller/billing/status`, `POST /seller/billing/registration\|membership\|verify` | M6 |
| `payouts` | `GET /seller/payouts`, `GET /seller/payouts/summary` | M7 |
| `shipping` | `GET /seller/sales`, `POST /seller/sales/:orderId/label\|ship` | M7 |
| `reviews` | `POST /orders/:orderId/reviews`, `GET /sellers/:id/reviews` | M5 |
| `notifications` | `GET /notifications`, `PATCH /notifications/:id/read`, `POST /notifications/read-all` | M8 |
| `blog` | `GET /blog`, `GET /blog/:slug` | M10 |
| `contact` | `POST /contact` (rate-limited) | M9, M11 |
| `settings` | `GET /cancellation-policy`, `GET /business-profile` (both public) | M4, M11 |
| `uploads`/`storage` | `POST /seller/uploads` → Supabase public URL | M6 |

### 0.2 Business rules the app must not re-invent

Enforced **server-side**; the app only ever reflects them.

- **Money is integer paise** everywhere; `splitPayout()` in `packages/shared` is the single
  definition of the commission split (default 1000 bps = 10%, snapshotted per payout).
- **Online payments only.** COD is retired (enum kept for 4 historical rows). Orders process
  only after `POST /payments/verify` or a webhook settle.
- **Seller gate** (`ListingsService.assertCanList`): ₹100 registration **and** admin approval
  **and** an active membership window — three distinct states, already in `SellerBillingStatus`.
- **Reservation hold:** creating an order flips the listing `APPROVED → RESERVED` for 2 days; a
  sweeper releases expired holds every 10 min. A second buyer racing the item gets a 400.
- **Cancellation policy is admin-configurable** (cutoff hours, reason codes, refund %) and
  published at `GET /cancellation-policy`. Read it; never hardcode it.
- **Shipping is manual by design.** `ManualLabelProvider` renders a printable branded label;
  there is no courier account. (`ShiprocketProvider` exists, unverified.)
- **Payouts are recorded, not transferred.** Admin marks PAID with a UTR, out of band.

### 0.3 What `feat/sitemap-restructure` adds (eshwar-ui, 2026-09-22, 5 commits, +5,440 LOC)

The site stops being "a preloved marketplace" and becomes a **four-pillar motherhood
platform**, with the marketplace intact as one pillar:

| Pillar | Route | Content |
|---|---|---|
| **Move** | `/yoga` | Prenatal, Postnatal, Garbhasanskar, live group batches, recorded, 1:1 |
| **Nourish** | `/nutrition`, `/nutrition/starting-solids` | Pregnancy, postpartum, starting solids, baby/toddler, 1:1 |
| **Connect** | `/community` | 7 community areas, free tier; "Nurture Moms Plus" deferred |
| **Pass it on** | `/preloved` | Buy / sell / donate hub over the live marketplace |

Plus `lib/site-nav.ts` as the single IA definition (4 pillars, 6-entry **stage selector**, nav +
footer trees, sitemap routes); `/blog` → `/journal` with real 308s; `lib/booking.ts` WhatsApp
deep links carrying `YOGA` / `FOOD` / `SOLIDS` / `CONNECTION`; a rebuilt home page (hero →
stage selector → pillar grid → latest listings); and the repo's **first real test harness**.

### 0.4 What the founders' brief adds on top of that branch

The branch implements the brief's Phases 0–2. These parts of the brief are **not yet in code**
and the app is their first consumer:

- **§10 pricing is a set of ranges, not single values.** The branch shipped one "from ₹X" per
  row; the brief specifies ranges — Yoga trial ₹299–399, group ₹199–299/class, monthly
  ₹799–1,499, Garbhasanskar ₹499–799, 1:1 yoga ₹699–1,199, nutrition consult ₹699–1,199,
  starting solids ₹799, Mom+Baby bundle ₹1,299–1,799, community free. Per **D8** the app
  publishes the ranges, which makes **B4** (API-served pillar content) a launch requirement
  rather than a nicety.
- **§12 conversion funnel** maps Instagram content type → service → CTA: pregnancy content →
  Yoga/Garbhasanskar (`YOGA`), baby-food reels → Starting Solids (`SOLIDS`), nutrition content →
  Nutrition (`FOOD`), mom-life content → Community (`CONNECTION`), preloved content →
  marketplace. The app must carry the same keyword attribution so mobile and web enquiries are
  counted the same way.
- **§11 Journal taxonomy** — 10 categories (Pregnancy, Yoga, Postpartum, Nutrition, Starting
  Solids, Baby, Toddler, Motherhood, Mompreneur, Preloved), 6 lead-magnet PDFs, 8 SEO landing
  pages. Categories need `BlogPost.category` (already flagged on the branch as a migration).
- **§13 design system** — Deep Teal `#006B6B`, Sage `#A8BFA0`, cream/warm ivory, muted
  terracotta, soft gold; Playfair Display + DM Sans; warm, real Indian mother-and-child imagery,
  not clinical stock. **"Mobile first: most social traffic arrives from Instagram"** — the brief's
  own words, and the strongest single argument for this app. Also: **Telugu** bilingual copy is
  anticipated, with a web-safe Unicode Telugu font to be tested on iOS *and* Android.
- **§4 trust + safety copy** — yoga is wellness/fitness support and **does not replace medical
  care**; high-risk pregnancy or specific conditions → consult a clinician first. This is both a
  founder requirement and what keeps a pregnancy-adjacent app out of trouble at store review.
- **§9 founder constraint** — Sudha's credentials only if verified and current; **invent nothing
  about Nandini beyond "Co-founder."** Applies verbatim to the app's About screen.
- **§16 measurement** — the founders' own list (pillar click-through, solids conversion,
  community joins, WhatsApp keyword conversions, repeat visitors) is folded into §7 below.

---

## 1. Problem Statement

The Nurture Moms sells to Indian mothers who discover it on Instagram reels and WhatsApp, on a
phone, one-handed, often while holding a baby — the brief says so itself ("most social traffic
will arrive from Instagram; make every service page easy to scan on a phone"). Today every one
of those journeys ends on a mobile web page: a seller who wants to list an outgrown stroller has
to photograph it in the camera app, find the browser, log in again, and upload from the gallery
— and the marketplace has **zero orders** on the dev database and a supply side that has never
been stress-tested.

The cost of not solving it: **supply stays thin** (C2C marketplaces die on listing friction, not
on demand), **retention has no mechanism** (there is no push capability anywhere in the stack),
and the four service pillars stay dependent on the founders posting manually on Instagram.

## 2. Goals

1. **Cut time-to-list to under 3 minutes** — camera to submitted listing, measured in-app
   against a web baseline captured before launch.
2. **Make the app the primary seller surface**: ≥60% of new listings created on mobile within
   90 days.
3. **Re-engagement channel exists and works**: push delivered for all 9 `NotificationType`
   events, ≥35% open rate on order/listing events.
4. **Service pillars convert on mobile**: ≥8% of sessions that view a pillar screen end in a
   WhatsApp enquiry carrying the correct funnel keyword.
5. **No regression in money correctness**: gross = commission + net to the paisa on every
   app-placed order, zero duplicate gateway orders.

## 3. Non-Goals

| Not doing | Why |
|---|---|
| **An admin app** | Low-frequency desk work; responsive admin web covers it. |
| **Paid service booking / scheduling** | Brief §10: every price is a proposed planning range, "confirm final pricing before publishing." Building slots + checkout against unsettled prices is waste. WhatsApp + enquiry is the v1 funnel. |
| **"Nurture Moms Plus" paid tier** | Brief §7: *do not launch a paid tier until the benefits and delivery schedule are clear.* |
| **In-app buyer↔seller chat** | `GET /listings/:id/contact` already hands over a WhatsApp number. Chat means moderation, abuse reporting and message retention — separate initiative. |
| **Live courier tracking** | Shipping is manual by choice; there is no courier account to track. |
| **Offline-first writes** | Read caching yes; a write queue against live reservation holds is a correctness trap. |
| **Telugu localisation in v1** | Architected for (`intl`, no hardcoded strings in widgets), translated later — the brief itself calls it conditional ("if Telugu copy is added"). |
| **COD, tablet layouts, SEO parity** | COD retired; tablet is phone-scaled in v1; SEO belongs to the web app. |

## 4. User Stories

### Buyer — a mother shopping on a phone
- As a mother browsing **without an account**, I want to see listings, prices and the four
  pillars before signing up, so I can decide whether this is for me. *(Also an App Store review
  requirement — forced registration on a browsable catalog gets rejected.)*
- As a buyer, I want to **filter by category, city, condition, price and sort**, so I find a ₹800
  stroller near me instead of scrolling everything.
- As a buyer, I want to **add items to a bag and pay by UPI in one flow**, so checkout survives a
  baby waking up halfway through.
- As a buyer, I want to be **told immediately if the item got reserved by someone else**, not
  after entering my address.
- As a buyer, I want to **cancel within the published window and see the exact refund**, so I
  never have to ask support what the policy is.
- As a buyer, I want to **confirm delivery myself**, so the seller gets paid without waiting on
  an admin.
- As a buyer, I want a **push when my order ships**.

### Seller — the supply side we are here for
- As a mother with outgrown baby gear, I want to **shoot photos in the app and list in one
  pass**, so listing costs minutes, not an evening.
- As a new seller, I want to **know exactly which of the three gates I'm behind** and clear the
  next one, so I never hit a bare "you can't list" wall.
- As a seller, I want a **push when an item sells**, so I ship the same day.
- As a seller, I want to **generate the label and share it to print or save as PDF**, because I
  have no printer connected to my phone.
- As a seller, I want to see **what's on hold, what's owed and what's paid**, with the commission
  shown, so the payout is never a surprise.
- As a seller, I want a **warning before my membership lapses**, not a refusal after.

### Mother using the services
- As a pregnant mother, I want to **see what yoga and nutrition support exists and roughly what
  it costs**, so I can decide before talking to anyone.
- As someone at a specific stage, I want to **tap "my baby is starting solids"** and land on the
  one screen that answers it.
- As an interested mother, I want to **message them on WhatsApp in one tap, pre-filled**.
- As a cautious mother, I want to **see plainly that yoga is wellness support, not medical
  care**, and when to talk to my doctor first.
- As a mother who wants to read first, I want **the Journal in the app**.

## 5. Requirements

### P0 — Must-have

#### M0 · Foundation & contracts
- **R0.1** Flutter 3.x · **Riverpod** (D9) · `go_router` · `dio` with auth/retry/error interceptors.
- **R0.2 Dart contract mirror of `packages/shared`,** guarded by a **drift test that fails CI**
  when the API's enums or money rules change. *Highest-risk item in the build — it is where a
  paise rounding difference or a stale enum silently ships.*
  - [ ] Every value of `NotificationType`, `OrderStatus`, `ListingStatus`, `Condition`,
        `DeliveryOption`, `ShipmentStatus`, `PayoutStatus`, `MembershipPlan`,
        `SellerPaymentStatus`, `ContactMessageStatus` present in Dart
  - [ ] `splitPayout` Dart port matches the TS spec case-for-case; gross == commission + net exactly
  - [ ] Money held and displayed from **integer paise**; no `double` in the money path
- **R0.3 Theme** from brief §13: Deep Teal `#006B6B`, Sage `#A8BFA0`, cream ivory, muted
  terracotta, soft gold; Playfair Display (display) + DM Sans (body).
- **R0.4 Firebase** (D7): Crashlytics + Analytics + FCM, one SDK.
- **R0.5 API versioning + force-upgrade gate** *(backend — B2)*. The API has **no version prefix
  today**. A web client redeploys; an installed app does not. `/v1` (or a version header) plus
  `GET /app-config` with `minSupportedVersion` and a blocking upgrade screen, **before** the
  first store release.

#### M1 · Auth & account
- **R1.1** Register / login / forgot / reset against the existing endpoints and Zod rules.
- **R1.2** Tokens in **platform secure storage** (Keychain / Keystore), never `SharedPreferences`.
  Access TTL is 15 min; a single-flight refresh interceptor retries the failed request once and
  signs out on refresh failure.
- **R1.3** `tokenVersion` respected: after a web password reset or `logout-all`, the app lands on
  login with a clear message, not a silent 401 loop.
- **R1.4** Profile edit (name, WhatsApp, city, bio) via `PATCH /users/me`.

#### M2 · Discovery (buyer)
- **R2.1** Home: hero ("Motherhood is a journey. You don't have to do it alone."), **stage
  selector** (6 entries), four-pillar grid, latest approved listings — same IA as `site-nav.ts`.
- **R2.2** Browse on the full `listingQuerySchema`: category, condition, city, delivery,
  min/max price, search, sort, paging (max 60/page).
- **R2.3** Listing detail: gallery, condition, usage, seller card, wishlist, add-to-bag, and
  `GET /listings/:id/contact` behind auth.
- **R2.4** Seller profile with rating and reviews.
- **R2.5** Guest browsing throughout; auth demanded only at wishlist / bag / checkout.

#### M3 · Wishlist
- **R3.1** Optimistic toggle on `POST /wishlist/toggle`, reconciled with `GET /wishlist/ids`.
- **R3.2** A 404 from a removed listing **removes the row and explains** — the API already
  returns *"That item is no longer available"* for exactly this case.

#### M4 · Bag, checkout & payment
- **R4.1** Local persisted bag (no server cart endpoint exists; mirrors `cart-store.ts`).
- **R4.2** Address form on `shippingAddressSchema` incl. the 6-digit PIN regex, prefilled from
  profile, Indian autofill hints.
- **R4.3** `POST /orders` → `POST /payments/order` → **Razorpay Flutter SDK** →
  `POST /payments/verify`. Retry reuses the same gateway order (already guaranteed server-side).
  `payment.failed` keeps the sheet open with the reason surfaced.
- **R4.4** The race is handled: a 400 because another buyer reserved the item is a specific,
  non-alarming message with the item removed from the bag.

#### M5 · Orders (buyer)
- **R5.1** List + detail on `orderNumber` (`NM-YYYYMMDD-NNN`), status timeline, per-seller shipments.
- **R5.2** Cancel: reason picker built from the **live** `GET /cancellation-policy`, showing the
  cutoff and the refund percentage that will actually be applied.
- **R5.3** `PATCH /orders/:id/confirm-delivery`.
- **R5.4** Review (1–5 + comment) after delivery.

#### M6 · Sell (seller)
- **R6.1** Billing status screen rendering the three gate states distinctly.
- **R6.2** **Registration and membership purchase open the web account page** (D4) via an
  authenticated deep link, not an in-app payment sheet. The app explains why in one line and
  returns to a refreshed billing status. *Physical-goods checkout (M4) stays in-app on Razorpay.*
- **R6.3** **Camera-first listing composer**: multi-shot camera + gallery multi-pick, reorder,
  client-side compression before `POST /seller/uploads` (8 MB cap, mime-locked), up to 10 images,
  per-image progress and retry.
- **R6.4** Listing form on `listingInputSchema`, surfacing the API's friendly messages.
- **R6.5** My listings with status chips; edit — and the app must say **before** the edit that
  editing a live listing returns it to PENDING and pulls it from browse.

#### M7 · Sales & fulfilment (seller)
- **R7.1** `GET /seller/sales` grouped by order, with the buyer's address.
- **R7.2** Generate label → **share sheet** (print / save PDF / send to a print shop). A phone has
  no printer; sharing is the primary action, not a fallback.
- **R7.3** Mark shipped, guarded in the right order (404 order → 403 not yours → 400 no label).
- **R7.4** Payouts: on-hold / owed / paid, with gross, commission and net per order.

#### M8 · Notifications & push
- **R8.1** In-app centre over `GET /notifications`, tap-to-open deep-linking on
  `listingId` / `orderId` / `relatedUserId`, mark-read and read-all.
- **R8.2** **Push via FCM** for all 9 types *(backend — B1)*. Permission asked contextually
  (after the first order or first listing), never on first launch.

#### M9 · Service pillars
- **R9.1** `/yoga`, `/nutrition`, `/nutrition/starting-solids`, `/community` as native screens:
  offerings, **"starting from" ranges** (D8), credential strip, and the brief §4 **safety copy**
  — yoga is wellness support, not medical care; high-risk pregnancy → clinician first.
- **R9.2** **WhatsApp CTA** on `whatsappLink()` carrying `YOGA` / `FOOD` / `SOLIDS` /
  `CONNECTION`, from `BusinessProfile.supportPhone` (D5). Blank → enquiry form, because a
  `wa.me/` link with no number looks broken at the exact moment someone decided to buy.
- **R9.3** **"Join the community" opens the WhatsApp group invite**, with Instagram broadcast as
  the secondary action (D6) — both admin-editable *(backend — B7)*.
- **R9.4** **Pillar content served from the API** *(backend — B4)*. On the web a price change is
  a deploy; in an app it is a store review, and the brief states the prices are provisional.
- **R9.5** Enquiry form posting to `POST /contact` with service attribution *(backend — B3)*.

#### M10 · Journal
- **R10.1** List + reader over `GET /blog`, markdown rendered natively, covers, share.
- **R10.2** Deep links accept `/journal/:slug`, the retired `/blog/:slug`, and the
  `BlogPostSlug` history — matching the web's redirect behaviour.

#### M11 · Legal, support & settings
- **R11.1** Terms / Privacy / Refunds / Policies from the API-backed profile and live
  cancellation policy, under the same publish gate as the web.
- **R11.2** **Account deletion request** — store-mandatory, and no endpoint exists *(B5)*.
- **R11.3** About screen: Sudha & Nandini as Co-founders. **Nothing invented about Nandini
  beyond "Co-founder"; Sudha's credentials only as confirmed** (brief §9, §17).
- **R11.4** Contact support, app version, sign out, logout-all.

### P1 — Fast follows
Saved searches + price-drop push · share a listing as a WhatsApp link + image card · OCR prefill
from a product box · seller dashboard charts over `GET /seller/listings/stats` · biometric unlock
· lead-magnet downloads with email capture (brief §11's six PDFs) · Journal category filter once
`BlogPost.category` lands · in-app membership-expiry reminder deep-link.

### P2 — Design for, don't build
Paid service booking with slots (keep the services data shapes bookable-ready) · "Nurture Moms
Plus" · real courier integration (keep shipment status API-driven, never client-inferred) ·
buyer↔seller chat · Telugu localisation · offline write queue.

## 6. Backend work this requires

On the critical path, scheduled inside the phase that needs it — not discovered in week 8.

| # | Change | Why | Size | Phase |
|---|---|---|---|---|
| **B1** | `DeviceToken` model + `POST/DELETE /notifications/devices` + FCM dispatch in `NotificationsService` | No push exists anywhere. All notifications already funnel through one service — one insertion point, not nine. | M | P2 |
| **B2** | `/v1` prefix (or version header) + `GET /app-config` with `minSupportedVersion` | An installed app cannot be redeployed. Must land before the first public build. | S | P0 |
| **B3** | `ContactMessage.service` / `source` column + admin filter | Already planned on the branch; the app makes it necessary — otherwise a yoga enquiry and a general one are indistinguishable. | S | P3 |
| **B4** | `ServiceOffering` content (admin-editable) + `GET /services` | Per D8 the app publishes provisional price *ranges*; hardcoding them means a store review per price change. | M | P3 |
| **B5** | Account deletion request flow | Apple and Google both require it for account-based apps. | S | P4 |
| **B6** | Razorpay **live** keys + `RAZORPAY_WEBHOOK_SECRET` | Both still placeholders. Store review exercises a real payment, and the webhook is the safety net for an app backgrounded mid-payment — more important on mobile than on web. | S (ops) | P4 |
| **B7** | `BusinessProfile.communityWhatsappUrl` + `instagramUrl` + `youtubeUrl` | D6 needs a destination; brief §2 specifies the social links in the footer. None exist in the repo. | S | P3 |

## 7. Success Metrics

Merged with the founders' own list (brief §16), so one set of numbers serves both.

**Leading (first 30 days)**
| Metric | Target | Stretch | Source |
|---|---|---|---|
| Install → first browse | ≥85% | 92% | Firebase Analytics funnel |
| Median time-to-list | <3 min | <2 min | In-app timer: composer open → 201 |
| Listings created on mobile | ≥40% of new | 60% | Client header on `POST /seller/listings` |
| Checkout completion (bag → PAID) | ≥55% | 70% | Order status funnel |
| Push opt-in | ≥60% | 75% | FCM permission result |
| Home → Yoga / Nutrition click-through *(brief §16)* | ≥18% | 25% | Screen-view funnel |
| Starting Solids screen → enquiry *(brief §16)* | ≥10% | 18% | `SOLIDS` keyword attribution |
| Community screen → join *(brief §16)* | ≥12% | 20% | WhatsApp invite tap |
| Pillar view → WhatsApp enquiry | ≥8% | 15% | Keyword attribution |
| Crash-free sessions | ≥99.5% | 99.8% | Crashlytics |

**Lagging (90 days)**
Mobile share of new listings ≥60% · D30 retention of app sellers ≥35% vs web-only · membership
renewal ≥50% among sellers who got an expiry push · store rating ≥4.3 with ≥50 ratings ·
repeat-visitor rate *(brief §16)* · **zero** money-correctness incidents.

**Measurement caveat, stated honestly:** none of this is instrumented today — there is no
analytics in the repo at all, on web or anywhere else. The **web baseline must be captured
before the app launches**, or every comparison above is unfalsifiable.

## 8. Open Questions

**Resolved 2026-09-23** — see the Decision log: store billing (D4), WhatsApp number (D5),
community destination (D6), analytics/crash vendor (D7), pricing publication (D8), state
management (D9).

**Still open — blocking, but not until the phase shown**
- **Q1 · Sudha's yoga credentials** — the credential strip ("200-Hour Yoga Certification ·
  Prenatal & Postnatal Training · Garbhasanskar") must be confirmed before it is published
  in-app. Brief §9 and §17 both insist. *(founders — blocks M9/P3)*
- **Q2 · Community + social URLs** — the actual WhatsApp group invite link, Instagram and
  YouTube URLs for B7. *(founders — blocks R9.3/P3)*
- **Q3 · Pre-submission store review on D4** — confirm the membership-to-web routing is accepted
  before P4 submission, not after a rejection. *(Kalyan — blocks P4)*

**Non-blocking**
- Q4 · Do the six lead-magnet PDFs exist yet, and should the app gate them behind email capture?
- Q5 · Is Telugu copy actually planned, and for which surfaces first? *(brief §13 flags a past
  rendering problem — it needs testing on both platforms if it happens.)*
- Q6 · Should `isFeatured` listings surface differently in-app than on web?
- Q7 · Journal categories — ship the filter with `BlogPost.category`, or wait for content volume?

## 9. Phasing & Timeline

2 Flutter engineers + ~0.4 backend engineer. Assumes `feat/sitemap-restructure` merges to
`master` first.

| Phase | Scope | Exit criterion | Est. |
|---|---|---|---|
| **P0 · Foundation** | M0 in full, B2, auth (M1), CI + internal distribution | A signed build on a real device that logs in, refreshes a token, and reports a crash | 2 wks |

**P0 status (2026-09-23):** `apps/mobile` scaffolded and running. Done: app shell (Riverpod + go_router), the brief's theme with **bundled** Playfair/DM Sans, the Dart contract mirror with 27 passing tests **and** `pnpm check:mobile-contract` (proven to fail on injected drift), Dio client with single-flight refresh, Keychain token store, and M1 auth end to end — verified on an iPhone 16 Pro simulator against the live API: wrong password shows the server's own message, sign-in lands on home, a cold launch restores the session from the Keychain, `/users/me` renders the seller-gate chips, sign-out returns to the signed-out home. Outstanding for P0: **B2** (version prefix + force-upgrade gate, needs the API change), Firebase (D7 — needs the project), and CI + internal distribution.
| **P1 · Buy** | M2, M3, M4, M5 | A real order placed from the app end-to-end on the test gateway, payout ledger correct to the paisa | 4 wks |
| **P2 · Sell** | M6, M7, B1 mid-phase | Seller lists from camera → sells → labels → ships; buyer confirms; payout goes PAYABLE | 3 wks |
| **P3 · Pillars & content** | M9, M10, M8 push wiring, B3 + B4 + B7 | WhatsApp enquiry arrives keyword-attributed; a price edited in admin appears in the app with no release | 2 wks |
| **P4 · Store readiness** | M11, B5, B6, Q3, store listings, privacy manifests + data-safety forms, beta, analytics baseline | Approved on both stores | 2 wks |

**~13 weeks to first public release.** The two external dependencies — the pre-submission review
(Q3) and Razorpay live keys (B6) — can stall P4 indefinitely if left until P4.

### Risks
- **The Dart contract mirror** (R0.2) is the main technical risk. It is guarded by a test, not by care.
- **Store review** is the main schedule risk, and it is a decision (D4/Q3), not a build.
- **The marketplace must keep working throughout.** Checkout, payouts, shipping and seller billing
  are live code paths with real money in them. The app is a new client on them; any change that
  alters their behaviour gets its own review.
- **Backend items B1–B7 are small individually and fatal if batched at the end.**

### Progress (2026-09-23, after merging eshwar's latest)

The service pillars (M9), the Journal (M10) and About moved forward from P3,
built against the web's newest design language:

- **M9 done, app-side:** Yoga, Nutrition, Starting Solids, Community and the
  Preloved hub; the home stage selector, pillar cards (dedicated pillar art),
  "Affordable support" proof points and the "Find your village" band. Pricing
  uses the web's paper-note design and its new `{price, from, unit}` shape.
  Booking goes to WhatsApp with the brief's keyword, or to the enquiry form
  when `BusinessProfile.supportPhone` is blank, which it is today. Content
  lives in `pillar_content.dart`, the swap point for **B4**.
- **M10 done:** Journal with the ten categories (API filter), post reader with
  markdown, and `/blog/:slug` → `/journal/:slug` as on the web.
- **About:** both founders as Co-founder only; no credentials (Q1 still open).
- **Still open from the brief:** real testimonials (none exist), the six
  lead-magnet PDFs (Q4), Instagram/YouTube links (B7), analytics (Firebase,
  D7, needs the project), and a native FAQ (the app opens the web page).

## 10. Launch checklist (from brief §17, mapped to the app)

- [ ] Home clearly presents Yoga, Nutrition, Community and Preloved as the four pillars
- [ ] Sudha & Nandini identified as Co-founders; nothing invented about Nandini
- [ ] Yoga screen carries services, **safety wording**, and pricing
- [ ] Nutrition covers pregnancy, postpartum, baby/toddler and consultation pathways
- [ ] Starting Solids has its own screen and one direct CTA
- [ ] Community shows the free structure (paid tier absent, per brief §7)
- [ ] Preloved marketplace fully functional in-app
- [ ] Real testimonials, not placeholders
- [ ] Booking, payment and WhatsApp flows all work on a real device, both platforms
- [ ] Privacy, Terms, Refund/Cancellation and Contact reachable from the app
- [ ] Every pillar screen has one primary CTA
- [ ] All images have semantic labels; text scales with system font size
- [ ] Telugu rendering tested on iOS **and** Android before any bilingual copy ships
- [ ] Analytics installed and the web baseline captured **before** launch

---

### Appendix · Module → API coverage

```
M0  Foundation        GET /health, GET /app-config*                            (*new B2)
M1  Auth & account    /auth/*, GET|PATCH /users/me
M2  Discovery         GET /listings, /listings/:id, /listings/:id/contact,
                      GET /categories, GET /sellers/:id, GET /sellers/:id/reviews
M3  Wishlist          GET /wishlist, /wishlist/ids, POST /wishlist/toggle
M4  Bag & checkout    POST /orders, POST /payments/order, POST /payments/verify,
                      GET /cancellation-policy
M5  Orders            GET /orders, /orders/:id, PATCH :id/cancel, :id/confirm-delivery,
                      POST /orders/:orderId/reviews
M6  Sell              GET /seller/billing/status, POST /seller/uploads,
                      GET|POST /seller/listings, PATCH|DELETE /seller/listings/:id,
                      GET /seller/listings/stats,
                      POST /users/me/request-seller-verification
                      (registration/membership → web, per D4)
M7  Sales & payouts   GET /seller/sales, POST /seller/sales/:orderId/label|ship,
                      GET /seller/payouts, GET /seller/payouts/summary
M8  Notifications     GET /notifications, PATCH /:id/read, POST /read-all,
                      POST|DELETE /notifications/devices*                      (*new B1)
M9  Pillars           GET /business-profile, POST /contact, GET /services*     (*new B4)
M10 Journal           GET /blog, GET /blog/:slug
M11 Legal & settings  GET /business-profile, GET /cancellation-policy,
                      POST /users/me/delete-request*                           (*new B5)
```

---

## 11. Navigation shell — bottom tab bar (spec, 2026-09-23)

The app currently has no shell: every screen is pushed from Home, so Shop, Account
and (soon) Sell are all reachable only by going back to the front door. That does
not survive P2, where a seller moves between listing, sales and payouts many times
a session.

### 11.1 The bar: 5 tabs

| # | Tab | Icon (filled when active) | Holds |
|---|---|---|---|
| 1 | **Home** | house | Hero, categories, latest listings, and later the four-pillar grid + stage selector |
| 2 | **Shop** | magnifier | Browse, search, filters, listing detail, seller profile |
| 3 | **Sell** | camera | The camera-first composer, my listings, and the seller gate when it applies |
| 4 | **Saved** | heart | Wishlist |
| 5 | **Account** | person | Profile, orders, sales, payouts, notifications, settings, legal |

**Sell gets a tab because of Goal 2.** The PRD's whole argument for building an app
at all is that supply dies on listing friction. A "Sell" entry buried two taps deep
contradicts the thing we are optimising for.

### 11.2 The bag is an app-bar action, not a tab

A cart tab is right for supermarket-style baskets. This is C2C: a bag usually holds
one item and is emptied minutes later, so a sixth of the bar would sit empty almost
always. The bag lives as an icon with a count badge in the Home and Shop app bars,
exactly as the web header carries it.

### 11.3 The Sell tab is a state machine, not a screen

`SellerBillingStatus` already distinguishes three gates, and the tab renders the one
that applies rather than a generic wall:

| State | Tab shows |
|---|---|
| Not registered | What selling involves, and the ₹100 registration, which **opens the web account page** (decision D4) |
| Registered, awaiting admin approval | A waiting state that says what is being waited on, with no dead CTA |
| Verified, no active membership | Plan cards, purchased on the web (D4) |
| `canList: true` | The composer, plus My listings |

The web's `account-shell.tsx` hides My-listings and Sales from anyone who has not
registered. The tab bar does **not** copy that: hiding a tab makes the bar jump
between four and five items as status changes, which reads as a bug. The tab stays,
its contents change.

### 11.4 Mechanism: `StatefulShellRoute.indexedStack`

Each tab needs its own navigator so a scroll position and a half-filled filter sheet
survive a trip to another tab and back. `StatefulShellRoute.indexedStack` is the
go_router construct for that; a single navigator with an index would reset every tab
on each switch.

Route moves:

```
/                 → branch 0   (home)
/listings         → branch 1   (+ /listings/:id, /sellers/:id)
/sell             → branch 2   (+ /sell/new, /account/listings)
/wishlist         → branch 3
/account          → branch 4   (+ /account/orders, /sales, /payouts, /notifications)
```

Auth screens (`/login`, `/register`, `/forgot-password`) and `/checkout` stay
**outside** the shell, pushed over it as full-screen routes. A checkout that keeps a
tab bar invites a mid-payment tab switch.

### 11.5 Badges

| Tab | Badge | Source |
|---|---|---|
| Account | unread count | `GET /notifications` (and FCM once **B1** lands) |
| Sell | dot | A sale needing fulfilment, from `GET /seller/sales` |
| Bag (app-bar) | item count | Local bag store |

Counts, not dots, where the number is actionable; a dot where "something changed" is
the whole message. No decorative dots anywhere else.

### 11.6 Deep links land in the right tab

A push about an order opens the Account branch at that order, not a detached screen
with no way back. Mapping: `listingId` → Shop, `orderId` → Account/orders,
`relatedUserId` → Account. Each opens inside its branch so Back returns to that
tab's root rather than exiting the app.

### 11.7 Appearance

`NavigationBar` themed from `NmTokens`: `surface` ground, hairline `border` top,
`primary` for the active icon and label, `mutedForeground` for the rest. Labels
always visible (`NavigationDestinationLabelBehavior.alwaysShow`) — icon-only bars
cost recognition for users who are not fluent in app iconography, which is a real
part of this audience. Height respects the gesture bar inset.

### 11.8 Work involved

| Step | Size |
|---|---|
| `AppShell` with `StatefulShellRoute.indexedStack` + 5 branches | S |
| Move existing routes under branches; lift auth and checkout out of the shell | S |
| Bag app-bar action + badge | S |
| Sell tab state machine over `GET /seller/billing/status` | M (P2) |
| Badge wiring | S (Account now, Sell in P2) |
| Deep-link → branch routing | S (with **B1**, P2) |

Do the shell before P2 starts. Retrofitting a tab shell under a built-out Sell
surface means re-parenting every route it owns.
