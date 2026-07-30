# Admin & Marketplace Backlog — Planning Doc (2026-07-30)

> Source: 13 mixed bugs/features requested for the admin panel + customer app. Grounded against
> the actual codebase (not assumed) — each item below states the confirmed root cause / current gap
> before proposing the fix. Four architecture decisions were confirmed with the operator and are
> baked into the requirements; everything else is a proposed default, flagged as an open question
> where it's genuinely still negotiable.

**Decisions confirmed (2026-07-30):**
1. **Seller verification** merges into one pipeline: a seller is "verified" only when **both**
   the ₹100 registration is paid **and** an admin has manually approved them. Neither alone is enough.
2. **Admin-created listings** are attributed to a built-in **"Marketplace" system seller account**,
   not to a real seller chosen per-listing.
3. **Cancellation policy** is admin-configurable across three axes: **cutoff time window**,
   **reason codes**, and **refund/fee percentage**. Per-category/per-seller overrides are explicitly
   out of scope for v1.
4. **Order IDs** become sequential and human-readable, format **`NM-YYYYMMDD-NNN`** (date + daily
   sequence), e.g. `NM-20260730-014`.

---

## Problem statement

The admin panel currently can't do several things an operator running a live marketplace needs day
to day: see a full order, tell sellers apart from customers, manage a blog, or see contact-form
submissions. Two separate bugs make notifications functionally dead on both sides of the app. And
the seller "verification" concept is actually two disconnected mechanisms today, which is confusing
and doesn't reflect one real seller status. This doc scopes the fix for all of it.

## Non-goals (v1)

- **Per-category / per-seller cancellation overrides** — one global policy only (decision #3).
- **Shiprocket / real courier integration** — separate, already tracked in `CLAUDE.md` roadmap #4.
- **Rich WYSIWYG blog editor** — markdown textarea is enough for v1 (see Open Questions).
- **Auto-renewing memberships (UPI AutoPay/e-NACH)** — already deferred in the roadmap, unaffected here.
- **Admin bulk actions** (bulk-approve listings, bulk-email sellers, etc.) — not requested, would
  expand scope well beyond this backlog.

---

## Phase 1 — Bug fixes (ship first, smallest blast radius) ✅ DONE (2026-07-30)

> Shipped: `GET /admin/orders/:id` + `AdminOrderDetail` (buyer contact, gateway/refund ids,
> per-seller shipment status) + `apps/web/src/app/admin/orders/[id]/page.tsx`, linked from every
> row in the admin orders list. `NotificationsService.markOneRead` + `PATCH /notifications/:id/read`,
> wired to the shared `account/notifications` page (optimistic mark-read on open). `Notification.orderId`
> column added (migration `20260730073258_add_notification_order_id`) and populated at every
> order-related notification call site (`ITEM_SOLD`, `ORDER_CANCELLED`, `PAYMENT_REFUNDED`,
> `ORDER_PLACED`); the notifications page now links to `/orders/:id` for buyers or `/admin/orders/:id`
> for admins whenever `listingId` is absent. Verified live: admin order detail renders full data,
> mark-as-read fires and persists (200, unread dot + sidebar badge clear immediately), no console
> errors. 19/19 API tests pass, typecheck and lint clean. **Not verified live:** a brand-new
> notification's `orderId` link end-to-end (would have required pushing a real order through
> Razorpay checkout or mutating existing demo order data) — covered instead by unit tests asserting
> the exact call args and a live check that the API now serializes `orderId` on every notification.

### 1.1 Admin order details not showing
**Root cause (confirmed):** there is no admin order-detail route at all — only
`apps/web/src/app/admin/orders/page.tsx` (a thin list: id-suffix, buyer name, total, payment
method, status dropdown). The API (`GET /admin/orders` → `OrdersService.adminList`) already
returns the full `Order` DTO (items, shipping address, razorpay ids, refund info) — nothing is
missing server-side, the detail screen was simply never built.

**Fix:**
- Add `GET /admin/orders/:id` (single-order fetch, refresh-safe direct navigation).
- New `apps/web/src/app/admin/orders/[id]/page.tsx`: line items w/ thumbnails, full shipping
  address, buyer contact, payment method + gateway ids, refund status, per-seller shipment status
  (reuse `Shipment`).
- Link every row in the list to the detail page.

**Acceptance:**
- [ ] Clicking an order row shows full detail; direct URL nav works after refresh.

### 1.2 Admin notifications never mark as read
**Root cause (confirmed):** the backend has **no per-notification mark-read endpoint at all** —
only bulk `POST /notifications/read-all`. The frontend (`apps/web/src/app/account/notifications/page.tsx:91-100`,
shared by admin and customer) wraps each notification in a bare `<Link>` with no `onClick`. Admins
have no dedicated bell UI anywhere — they use this same shared page.

**Fix:**
- API: `NotificationsService.markOneRead(userId, id)` + `PATCH /notifications/:id/read`
  (ownership-checked).
- Web: call it on click, optimistically update, invalidate the `["notifications"]` query.
- *(P1, not blocking)* add a bell + unread-count badge to `admin-header.tsx` so admins don't have
  to visit `/account/notifications` to notice anything.

**Acceptance:**
- [ ] Opening one notification marks it read in DB + UI immediately; persists across refresh.

### 1.3 Customer notifications don't open when tapped
**Root cause (confirmed):** when `Notification.listingId` is `null`, the card renders as an inert
`<div>` instead of a `<Link>` (`account/notifications/page.tsx:91-100`). This hits every
`PAYMENT_REFUNDED` notification (and any other order-only notification) because `Notification` has
**no `orderId` column** to link from, even though the order id is embedded in the message text.

**Fix:**
- Schema: add `Notification.orderId String?` (migration).
- Populate it wherever order-related notifications are created (`payments.service.ts` refund
  notify, `orders.service.ts` cancel/status notifies).
- Frontend: if `orderId` present, link to the customer's order (needs a customer order-detail
  target — reuse/extend `/account/orders` if no per-order customer page exists yet; confirm during
  implementation and build a minimal one if missing).

**Acceptance:**
- [ ] Every notification type currently produced navigates somewhere on tap — none render as a dead `<div>`.

---

## Phase 2 — Seller identity foundation (everything below depends on this) ✅ DONE (2026-07-30)

> Shipped: `SellerBillingStatus.sellerVerified` (registrationPaid && isSellerVerified) + tightened
> `assertCanList` (was membership-only) + backfill migration `20260730081719_backfill_seller_verification`
> (idempotent, grandfathered 10 existing paying sellers so none were locked out — confirmed by the
> operator). Admin `Users` page split into Sellers/Customers tabs with plan/expiry chips, verify
> button now disabled + labeled "Awaiting payment" until registration is paid. `AuthUser.registrationPaidAt`
> added; `account-shell.tsx` hides My-listings/Sales for anyone who hasn't registered (gated on
> registration, not active membership, so lapsed sellers keep their history); the auth store is
> refreshed on registration payment so the nav unlocks without a re-login. `/account/membership` and
> `/sell` now distinguish three states (not registered / awaiting approval / needs a plan) instead of
> two. Non-sellers get an explainer + CTA on `/account/membership` instead of the raw purchase form.
> Verified live end-to-end (including the awaiting-approval state, simulated via direct DB write
> since it requires a real payment + admin action to reach naturally) with a throwaway test account,
> since cleaned up. Typecheck, lint, and 19/19 API tests pass.

### 2.1 Single seller verification pipeline
**Root cause (confirmed):** two disconnected mechanisms both call themselves "verification":
`User.isSellerVerified` (admin toggles a cosmetic badge, `PATCH /admin/users/:id/verify` — **no
gating effect anywhere**) vs. `User.registrationPaidAt` + active `SellerMembership` (the actual
paid gate checked by `ListingsService.assertCanList`). A user can be badge-verified with no
payment, or paid with no badge — they've never been connected.

**Fix (per decision #1 — both required):**
- Define one derived status: `sellerVerified = registrationPaidAt !== null && isSellerVerified === true`.
- `assertCanList()` (`listings.service.ts`) now requires `sellerVerified` **and** active
  membership — this tightens current behavior (today only membership is checked), so:
  - **Migration/backfill required:** one-time pass that sets `isSellerVerified = true` for every
    user who already has `registrationPaidAt` set (grandfathers existing paying sellers so no one
    is silently locked out at deploy time — flagged as an open question below in case you'd rather
    review them manually instead).
- Admin "Verify" button (`admin/users` / new sellers view, 2.2) should be disabled/labeled
  "awaiting payment" until `registrationPaidAt` is set, since approving an unpaid user is now a
  no-op for gating purposes.
- Fold into `SellerBillingStatus.canList` (`packages/shared`) so every consumer (`/sell` gate, nav
  gating in 2.3, membership tab in 2.4) reads one flag instead of re-deriving it.
- Update copy: `/account/membership`'s "A one-time fee... verifies your seller account" line, and
  any badge tooltips, so "verified" consistently means the merged status.

**Acceptance:**
- [ ] `POST /seller/listings` succeeds only when both payment and admin approval are true.
- [ ] Existing actively-selling sellers are not locked out by the deploy (backfill applied).
- [ ] Exactly one "verified" concept is visible anywhere in the admin or customer UI.

### 2.2 Dedicated seller section in admin, with subscription details
**Root cause (confirmed):** `admin/users/page.tsx` renders one flat list of every user
(customers and sellers mixed); `AdminUser` carries no membership data even though
`SellerMembership` already exists and is queryable via the `User.memberships` relation.

**Fix:**
- Split into "Customers" / "Sellers" (tabs on the existing page, or a new `admin/sellers/page.tsx`
  + nav entry — implementation detail, either works).
- Extend `AdminUser` (shared) + the admin user/seller query to include: `registrationPaidAt`,
  merged verified status (2.1), and latest `SellerMembership` (plan, startsAt, expiresAt,
  active/expired computed from `expiresAt > now()`).
- Sellers table: name, email, verified state (with approve action per 2.1), registration date,
  current plan, expiry, active/expired chip, listing count.

**Acceptance:**
- [ ] Admin can see, for any seller, which plan they're on (Monthly/Quarterly/Half-Yearly/Yearly) and whether it's active or expired, without leaving the admin panel.

### 2.3 Hide "Sales" / "My listings" tabs from non-sellers
**Root cause (confirmed):** `account-shell.tsx:24-32` renders "My listings" and "Sales" nav
items unconditionally for every logged-in user — there's no seller role (`Role` enum is only
`CUSTOMER`/`ADMIN`) and no filtering logic exists today.

**Fix:**
- Gate both nav items on `registrationPaidAt !== null` (i.e., "has ever completed seller
  registration") — **not** on currently-active membership, so a seller whose plan lapsed still
  sees their sales/listing history instead of losing access to their own data.
- `registrationPaidAt` isn't in the client `AuthUser` type/store today — add it (or a derived
  `hasRegisteredAsSeller` boolean) so the nav can read it without an extra fetch.

**Acceptance:**
- [ ] A customer who never registered as a seller sees neither tab.
- [ ] A seller with a lapsed membership still sees both, with existing in-page renew prompts.

### 2.4 Customer-facing "Membership" tab clarity
**Root cause (confirmed):** `/account/membership` is 100% seller-monetization UI (registration fee
+ plan purchase) and is shown identically to every logged-in user regardless of seller status —
there's no buyer-oriented explanation anywhere.

**Fix:**
- Same route, conditional content (not a URL split): if `registrationPaidAt === null`, show an
  explainer — what membership is, the four plans, a "Become a seller" CTA that leads into the
  existing registration flow. If already registered, show today's real management UI unchanged.

**Acceptance:**
- [ ] A plain customer sees an explanation + CTA, never a bare purchase form with no context.
- [ ] A registered seller's experience is unchanged from today.

---

## Phase 3 — Order lifecycle ✅ DONE (2026-07-30)

> Shipped: `Order.orderNumber` (`NM-YYYYMMDD-NNN`) generated via an atomic `DailyOrderSequence`
> upsert (`INSERT ... ON CONFLICT DO UPDATE ... RETURNING`) inside the same transaction as order
> creation — no naive count()+1 race. Migration backfilled all 19 existing orders (verified
> per-day sequential, e.g. `NM-20260728-001..010`) and seeded the counter table so new orders
> continue correctly. Every id.slice(-N) display usage replaced across admin list/detail, customer
> order list/detail, checkout Razorpay description, and the shipping label ref (which now reuses
> orderNumber instead of computing its own ad hoc "NM-" string). New `CancellationPolicy` model
> (single global row) + `SettingsService`/`SettingsController` (`GET /cancellation-policy` for any
> signed-in user, `PATCH /admin/cancellation-policy` for admins) + `admin/settings` page to edit
> cutoff hours / reason codes / refund %. `OrdersService.cancel()` now enforces the cutoff window
> and validates the reason against the configured codes; `updateStatus()`'s admin CANCELLED path
> requires the same. `refundCancelledOrder` scales the gateway refund by the configured percentage
> (skips the gateway call entirely at 0%). A new shared `CancelOrderDialog` component (reason
> picker sourced live from the policy) replaced the buyer's `window.confirm` and is reused by the
> admin status dropdown. `Order.cancellationReason` persists what was picked and shows on the
> admin order detail. Verified live end-to-end: edited the policy (cutoff/refund%/reasons) and
> confirmed persistence after reload; cancelled a real PAID test order from the admin UI with an
> 80% refund policy active — reason dialog showed the live-edited reason list, the real Razorpay
> test-gateway refund succeeded, and the order detail correctly showed `Cancelled`, the chosen
> reason, and the refund id. 22/22 API tests pass (3 new: invalid reason, cutoff rejection, partial
> refund math), typecheck and lint clean.

### 3.1 Sequential order IDs
**Root cause (confirmed):** `Order.id` is a random `cuid()`; there's no order-number column, no
sequence anywhere. The only "human-readable" form is an ad hoc `id.slice(-8).toUpperCase()`
repeated in 2-3 places (admin list, notification text).

**Fix (per decision #4 — `NM-YYYYMMDD-NNN`):**
- Keep `Order.id` as the cuid primary key (don't touch existing FKs/data).
- Add `Order.orderNumber String @unique`, generated at order-creation time.
- **Concurrency:** generate via an atomic counter (a small `DailyOrderSequence(date, count)` table
  incremented inside the same DB transaction as order creation, or `SELECT ... FOR UPDATE`) — a
  naive `count()+1` will produce duplicate numbers under concurrent checkouts and must be avoided.
- Replace every display usage (`admin/orders/page.tsx`, notification message text, customer order
  views) with `order.orderNumber`.
- Backfill existing orders in the migration, ordered by `createdAt`.

**Acceptance:**
- [ ] Every new order gets a unique `NM-YYYYMMDD-NNN` number; no collisions under concurrent checkout.
- [ ] All existing orders backfilled; every place an order id is shown uses the new number.

### 3.2 Admin-configurable cancellation rules
**Root cause (confirmed):** cancellation is fully hardcoded — `CANCELLABLE_STATUSES` allows
`PENDING`/`PAID` only, blocked once any `Shipment` row exists, no cutoff window, no reason capture,
always-full refund. No settings table, no admin UI for any of it.

**Fix (per decision #3 — cutoff window + reason codes + refund/fee %, global only):**
- New `CancellationPolicy` model (single global row): `cutoffHours Int`, `reasonCodes String[]`
  (or enum), `refundPercentage Int` (0-100).
- Admin settings page (`admin/settings` or similar) to edit these.
- `OrdersService.cancel()` reads the policy: reject if `now() - order.createdAt > cutoffHours`, in
  addition to the existing pre-shipment check.
- Cancel endpoint (both buyer and admin paths) requires a `reason` validated against
  `reasonCodes`.
- `refundCancelledOrder` applies `refundPercentage` instead of always refunding 100%.

**Acceptance:**
- [ ] Admin edits cutoff window / reason codes / refund % from the admin panel; changes take effect immediately.
- [ ] Cancelling requires a reason and is rejected outside the configured window.
- [ ] Refund amount reflects the configured percentage.

---

## Phase 4 — Content & catalog admin tools (greenfield, independent of each other) ✅ DONE (2026-07-30)

> Shipped: a built-in `User.isSystemSeller` "Marketplace" account (seeded with an ~100-year
> membership so `assertCanList` always passes) backs `POST /admin/listings`
> (`ListingsService.adminCreate`, auto-approved) and `PATCH /admin/listings/:id/category`
> (`adminUpdateCategory`) — new `admin/listings/new/page.tsx` form and a category-reassign control
> on the existing listing detail page. `BlogPost` model + `apps/api/src/blog/*` (public paginated
> `GET /blog` + `GET /blog/:slug`, admin CRUD + publish/unpublish preserving the original
> `publishedAt` across republish cycles) + `admin/blog/*` pages with a shared `BlogPostForm`
> (markdown textarea, Preview/Edit toggle via a new `MarkdownContent` component, cover image via
> `ImageUploader` with a new `max` prop capped at 1) + real `/blog` and `/blog/[slug]` Server
> Component pages replacing the static placeholder. `ContactMessage` model + `apps/api/src/contact/*`
> (public rate-limited `POST /contact`, admin list + status PATCH) + `contact-form.tsx` wired to
> actually POST instead of a fake-delay mock + `admin/messages/page.tsx` (click-to-expand
> auto-marks NEW→READ, explicit "Mark responded" action, mailto reply link). Admin nav gained Blog
> and Messages tabs. Hit and fixed one significant bug along the way: `MarkdownContent` originally
> used plain `dompurify`, whose default export needs `window`/jsdom and crashed Next's SSR when the
> component rendered inside the Server Component `/blog/[slug]/page.tsx` ("switched to client
> rendering because the server rendering errored"); fixed by switching to `isomorphic-dompurify` and
> dropping `"use client"`/`useMemo` so the component works unchanged in both Server and Client
> contexts. Verified live end-to-end for all three: admin-created listing appeared
> `APPROVED`/`seller: Marketplace`, category reassignment reflected immediately in the UI; a draft
> blog post was confirmed hidden from the public list, then published and confirmed visible on both
> `/blog` and `/blog/[slug]` with correctly rendered sanitized markdown and clean SSR (checked via a
> fresh tab + raw HTML fetch, no console errors); a real contact submission was confirmed via the
> network tab to hit `POST /contact` (not a mock), appeared in the admin inbox as NEW, flipped to
> READ on expand, and to RESPONDED on the explicit action. All test data cleaned up afterward.
> Typecheck, lint (0 errors — the 8 pre-existing `no-unsafe-argument` warnings are in unrelated spec
> files), and 22/22 API tests pass.

### 4.1 Admin-created listings + "add items in category" (merged)
Treating these as one feature: an admin creating a listing directly *is* "adding an item into a
category" (category is a required field on listing creation either way). If you actually meant
something else by "add items in category" — e.g. bulk-reassigning *existing* listings between
categories from the category screen — flag it and it's a small addition on top of this.

**Fix (per decision #2 — Marketplace system account):**
- Seed one built-in "Marketplace" seller `User` (flag e.g. `isSystemSeller Boolean @default(false)`)
  with an always-active membership so `assertCanList` passes without a real payment/verification flow.
- `POST /admin/listings` (admin-only), reusing `ListingsService.create()` bound to the Marketplace
  account id.
- New `admin/listings/new/page.tsx` (mirrors seller `/sell` form: title, description, price,
  images via existing uploader, category select).
- Also allow changing an existing listing's category from `admin/listings/[id]/page.tsx` (covers
  the "reassign category" reading if that's what was meant).

**Acceptance:**
- [ ] Admin creates a listing that appears in the marketplace under the Marketplace account.
- [ ] Admin can change an existing listing's category.

### 4.2 Blog CMS
**Root cause (confirmed):** completely new — `apps/web/src/app/blog/page.tsx` is a static "coming
soon" placeholder; no `Blog`/`Post` model anywhere in the schema, no API module, no admin UI.

**Fix:**
- `BlogPost` model: `id, title, slug (unique), excerpt, bodyMarkdown, coverImageUrl, published,
  publishedAt, authorName, createdAt, updatedAt`.
- API `apps/api/src/blog/*`: public `GET /blog` (published, paginated), `GET /blog/:slug`; admin
  `GET/POST/PATCH/DELETE /admin/blog` + publish/unpublish toggle.
- Reuse existing `StorageService`/image-uploader for cover images.
- Admin UI `admin/blog/page.tsx` (list + markdown editor form) + new nav tab.
- Replace the placeholder public blog page with a real list + `apps/web/src/app/blog/[slug]/page.tsx`.

**Acceptance:**
- [ ] Admin can create/edit/publish/unpublish/delete posts with a cover image.
- [ ] `/blog` lists published posts; `/blog/:slug` renders one.

### 4.3 "Send us a message" → admin inbox
**Root cause (confirmed):** `contact-form.tsx`'s submit handler is explicitly a front-end mock —
600ms fake delay, no network call at all (there's a comment saying it's not wired up yet). No
`Contact` model, no backend endpoint, no admin page.

**Fix:**
- `ContactMessage` model: `id, name, email, phone?, subject, message, status (NEW/READ/RESPONDED), createdAt`.
- API `apps/api/src/contact/*`: public `POST /contact` (rate-limited like other public writes),
  admin `GET /admin/contact-messages`, `PATCH /admin/contact-messages/:id/status`.
- Wire `contact-form.tsx` to actually POST.
- Admin UI `admin/messages/page.tsx` + new nav tab.
- *(P1, not blocking)* email-notify admin via the existing `mail` module on new submission.

**Acceptance:**
- [ ] Submitting the form persists a row; admin sees and can mark it read/responded.

---

## Suggested build order

```
Phase 1 (bug fixes)        → 1.1, 1.2, 1.3          — ✅ DONE (2026-07-30)
Phase 2 (seller identity)  → 2.1, 2.2, 2.3, 2.4       — ✅ DONE (2026-07-30)
Phase 3 (order lifecycle)  → 3.1, 3.2                — ✅ DONE (2026-07-30)
Phase 4 (content/catalog)  → 4.1, 4.2, 4.3           — ✅ DONE (2026-07-30)
```

Phase 2 is the one phase where sequencing within it matters (2.1 before 2.2/2.3/2.4); everything
else can be parallelized across sessions/PRs.

**All 13 backlog items shipped as of 2026-07-30.** See CLAUDE.md for the running project summary.

---

## Open questions (non-blocking — can resolve during implementation)

- **2.1 backfill approach:** auto-approve (`isSellerVerified = true`) every user who already has
  `registrationPaidAt` set, so no currently-selling seller is locked out at deploy time? Proposed
  default: yes, auto-grandfather. *(Owner: you — confirm before the 2.1 migration ships.)*
- **4.1 approval flow:** should admin-created listings skip the normal PENDING→APPROVED moderation
  queue (auto-approved since admin made them), or still go through it? Proposed default:
  auto-approved. *(Owner: you.)*
- **4.2 editor:** plain markdown textarea (fast to build, fits the stack) vs. a rich WYSIWYG editor
  (more work, nicer authoring experience)? Proposed default: markdown for v1. *(Owner: you.)*
- **4.3 email notification:** send the admin an email on new contact submission (needs the
  existing `mail` module wired in), or DB-only for v1 with admin checking the panel? Proposed
  default: DB-only for v1, email as a fast-follow. *(Owner: you.)*
- **1.3 customer order-detail target:** needs confirming whether a per-order customer detail page
  already exists to link to, or needs to be built fresh. *(Owner: engineering, resolve during
  implementation.)*
