# The Nurture Moms — Website Redesign Plan (client brief, 2026-11)

> Source: the founders' "Complete Website Redesign & Development Requirements" brief (sections §1–§15).
> Builds on [RESTRUCTURE-PLAN.md](RESTRUCTURE-PLAN.md), which already turned the site into the
> four-pillar platform. **This plan only covers what is still missing.** Many brief items already
> exist and are listed in "Already built" so they don't get rebuilt.
> Scope is the **web app + API**. The Flutter app is untouched. Every API change here is additive,
> so mobile keeps working, and no shared enum changes, so `check-mobile-contract` stays green.

---

## Decisions (2026-11-11)

| # | Question | Decision | Consequence |
|---|----------|----------|-------------|
| 1 | Yoga/Garbhasanskar booking | **Admin-editable prices and offers, no online payment** | "Book Now" opens WhatsApp or the enquiry form with the package and its price filled in. No scheduler and no service checkout. The quoted price is **saved on the enquiry**, so the admin sees exactly what the mother was shown (this covers §10's "price can't change unexpectedly" without a payment step). |
| 2 | Palette | **Adopt the brief's palette site-wide, plus its visual guidance** (rounded cards, clean spacing, consistent fonts and buttons) | Reverses the 2026-09-23 "keep current brand" decision. Values are the right-hand column of [palette-compare.html](palette-compare.html). Every pairing passes WCAG AA. |
| 3 | Marketplace location | **Searchable city list + locality + 6-digit PIN** | PIN is checked for format only. There is no PIN-to-city lookup and no "near me" search (see Limitations). |
| 4 | Donations | **Admin-matched.** A donation form feeds an admin queue; there are no donation listings. | The brief's "Buy or donate" filter doesn't apply, because donations never appear in the listing grid. |
| 5 | Admin editing | **Structured content** in the existing admin panel | Layout stays in code. Packages, offers, FAQs, testimonials, founders/About, home hero and social links become editable. **A section stays hidden until it has real content**, so placeholders never go live. |
| 6 | Navigation | **Brief's order: 8 links + a "Book a Session" button** | Short labels. Preloved keeps its dropdown. The hamburger menu takes over below `xl` (1280px). |
| 7 | Seller tools | **No change.** Edit and delete only. | No pause or "sold elsewhere" option. |
| 8 | Plan format | **Engineering plan only** | No cost or timeline section. §15 is answered separately by the developer. |

### Palette tokens (decision 2)

The brief gives exact codes only for sage and cream. The others were named without codes, so these
values are proposals. They are approved through decision 2.

| Token (`globals.css`) | Now | New | Source |
|---|---|---|---|
| `--background` | `#fdf6ee` | `#F7F3EA` cream | brief |
| `--foreground` | `#241c18` | `#333D29` dark olive | proposed |
| `--surface` | `#ffffff` | `#FFFDF8` | proposed |
| `--surface-2` | `#f6ece0` | `#EFE6D6` | proposed |
| `--primary` (buttons) | `#456f50` | `#55704D` deep sage | proposed — the brief's `#A8BFA0` with white text is 1.98:1 and can't be a button |
| `--primary-foreground` | `#fdf6ee` | `#F7F3EA` | — |
| `--sage` | `#a8c3a0` | `#A8BFA0` | brief |
| `--beige` | `#efdcc8` | `#E6D7BF` warm beige | proposed |
| `--accent` | `#ef8377` coral | `#D08A6C` soft terracotta | proposed |
| `--accent-foreground` | `#3a2318` | `#2B2119` | proposed |
| `--accent-text` (offer prices) | `#a94740` | `#A0512E` | proposed |
| `--muted-foreground` | `#75645a` | `#66684F` | proposed |
| `--border` | `#ecdecd` | `#E4DACA` | proposed |
| `--gold` | `#d8a84c` | `#C9A55A` | proposed |

Also to settle in Phase 1:
- `--ring`: move off coral to terracotta.
- `--blush`, `--lavender` and `--sky`: these pastels aren't in the brief. Mute them toward beige/sage or retire them; they drive `PASTEL_INK` and `PRICE_PAPERS` in `service-sections.tsx` and the home stickers.
- Dark mode (`[data-theme="dark"]`): needs a matching olive/sage set.
- Fonts stay **Fraunces + Outfit**. The brief only asks for consistency.

---

## Already built (do not rebuild)

| Brief | What exists | Where |
|---|---|---|
| §2 four services | `/yoga`, `/nutrition`, `/community`, `/preloved` + pillar cards | `pillar-cards.tsx`, `service-sections.tsx` |
| §3 filters | category, condition, delivery, min/max price, **city (contains match)**, sort newest/price↑/price↓ | `listings.service.ts:52-68`, `listingQuerySchema` in shared |
| §4 listing | real seller photo upload (Supabase), status badge, condition, delivery, description | `image-uploader.tsx`, `listing-detail.tsx` |
| §4 contact | "Chat with seller on WhatsApp", number fetched only after login | `listing-actions.tsx:57` |
| §5 login | `?next=` return path on every gated action; transparent token refresh; logout-all; token revocation; ownership checks (QA'd) | `login/page.tsx`, `lib/api.ts`, `lib/use-auth.ts` |
| §5 account | profile edit (`PATCH /users/me`), account deletion (local, uncommitted) | `account/page.tsx`, `app/account-deletion/` |
| §10 enquiry | `ContactMessage.service` attribution, `?service=` on booking CTAs, admin Messages chip | `contact-form.tsx`, `admin/messages` |
| §12 SEO | canonical URLs, OG/Twitter cards, sitemap, robots, JSON-LD, alt text audit, real 404s | `lib/seo.ts`, `lib/structured-data.ts` |
| §13 admin | listings, categories, users, orders, payouts, blog, messages, settings | `admin-shell.tsx` |

---

## Phase 1 — Brand tokens + content foundation

Everything after this reads from these models, so it goes first.

**1a. Re-theme.** Apply the token table above in `apps/web/src/app/globals.css`, light and dark. Then sweep
components for hard-coded hexes (`grep -rn "#[0-9a-fA-F]\{6\}" apps/web/src/components`), e.g.
`text-[#7a2447]` in `service-sections.tsx` and the WhatsApp green in `listing-actions.tsx` (the
WhatsApp brand green stays). Unify shapes too: one card radius, one button height/radius scale,
consistent section spacing. Regenerate `og-default.png` on the new ground.

**1b. Prisma models** (one migration):

```prisma
enum ServiceGroup { PRENATAL_YOGA GARBHASANSKAR COMBO ONE_TO_ONE_YOGA NUTRITION STARTING_SOLIDS }
enum SessionFormat { LIVE_GROUP ONE_TO_ONE RECORDED }

model ServicePackage {
  id               String        @id @default(cuid())
  group            ServiceGroup
  name             String                    // "Monthly Combo"
  summary          String
  includes         String[]                  // bullet list on the card
  sessionCount     Int?
  sessionMinutes   Int?
  validityDays     Int?
  format           SessionFormat
  pricePaise       Int                       // the regular price
  priceSince       DateTime      @default(now())  // when the regular price was last set
  offerPricePaise  Int?                      // must be < pricePaise
  offerLabel       String?                   // default "Special Offer"
  offerEndsAt      DateTime?                 // past → offer disappears by itself
  isIntroductory   Boolean       @default(false) // "Introductory Price", never a strikethrough
  isBestValue      Boolean       @default(false)
  isActive         Boolean       @default(true)
  sortOrder        Int           @default(0)
  @@index([group, isActive, sortOrder])
}

model PartnerOffer   { id, brandName, logoUrl?, description, benefit, couponCode?, url,
                       isAffiliate Boolean, expiresAt DateTime?, isActive, sortOrder, createdAt }
model Faq            { id, section FaqSection, question, answer /* markdown */, sortOrder, isPublished }
model Testimonial    { id, name, context /* "Prenatal yoga · Hyderabad" */, quote, photoUrl?,
                       consentConfirmed Boolean /* required to publish */, isPublished, sortOrder }
model SiteContent    { id = "global" singleton (like BusinessProfile): heroHeadline, heroSubline,
                       heroMessage, heroImageUrl, heroImageAlt, aboutMission, founders Json,
                       galleryImages Json, instagramUrl, youtubeUrl, whatsappCommunityUrl,
                       whatsappPrelovedUrl, sessionPolicy /* cancel/reschedule/refund markdown */ }
```

Pricing rules live in **one shared helper**, `resolvePackagePrice(pkg, now)` in `packages/shared` (same idea as
`splitPayout`). It returns `{ display, compareAt?, label, savingsPaise?, savingsPct? }` and is used by the
cards, the WhatsApp message and the enquiry snapshot, so the three can't disagree. Rules:
- An offer shows only while `offerEndsAt` is in the future, or unset with `offerPricePaise` present.
- `isIntroductory` and an offer can't both be on (Zod refine plus a check in the service).
- Savings % is computed, never typed in, so it is always accurate (§9).
- **"Never advertise a price that wasn't charged" (§9)** is a soft guard. The admin form warns when an offer is
  set less than 30 days after `priceSince`, because software can't prove what was charged.

Seed the brief's launch prices (§8 A–D) as the initial `ServicePackage` rows. Seed the current `/faq`
static answers as `Faq` rows. Answers that read live values (cancellation window, membership prices)
stay code-driven on the page, the same pattern as today.

**1c. API.** Public reads: `GET /services/packages?group=`, `GET /offers` (active and unexpired only),
`GET /faqs`, `GET /testimonials` (published and consented only), `GET /site-content`. Admin CRUD under `/admin/*`
with the existing `Roles('ADMIN')` guard. `POST /admin/uploads` targets a `site` folder in the existing
bucket (the seller endpoint is user-scoped).

**1d. Admin UI.** Add to `admin-shell.tsx`: **Services & prices**, **Offers**, **FAQs**, **Testimonials**,
**Site content** (hero, About/founders, gallery, socials, session policy). The price form shows a live
preview of the card through `resolvePackagePrice`.

**1e. Revalidation.** Extend `/api/revalidate` scopes with `services` (`/`, `/yoga`, `/nutrition`,
`/nutrition/starting-solids`, `/faq`), `offers` (`/offers`, `/`), `content` (`/`, `/about`, layout). Purge
on every admin save. This is the same mechanism the blog and legal pages already use.

## Phase 2 — Home page + navigation + wording (§1, §2, §7)

- **Hero** comes from `SiteContent`. The defaults are the brief's copy exactly: *"From pregnancy to toddlerhood,
  you're not alone."* / *"A nurturing space for every mother, every journey, and every stage."* /
  *"Move, nourish, connect and grow together…"*. Hero photo slot: an admin upload with alt text. The
  current image stays until the client supplies a genuine photo.
- **Four service sections, equal weight**: photo, short description, buttons as written in §2
  (*Explore Yoga & Garbhasanskar · Explore Nutrition · Join Our Community · Shop Preloved | Sell an Item |
  Donate an Item*). The marketplace sections below (latest listings, categories) get trimmed so preloved
  doesn't dominate. Latest Listings stays (roadmap #3). The "Testimonials" component in
  `home-sections.tsx` actually holds buying tips, so it moves to the buying explainer. Real testimonials
  render from `Testimonial` and the section is hidden while there are none.
- **Nav** (`site-nav.ts` `PRIMARY_NAV`), in the brief's order: Home · Yoga & Garbhasanskar · Nutrition · Mom Community ·
  Preloved (dropdown, now with Donate an item) · Resources (dropdown: Free Guides, Blog) · Offers ·
  About (dropdown: Our story, FAQs) · **[Book a Session]** → `/contact`. Hamburger below `xl`. Footer
  social links come from `SiteContent`; the `SOCIAL_LINKS` constants become fallbacks.
- **Wording sweep**: one pass over public pages to replace jargon with plain language (e.g. "marketplace-generated
  shipping label" → "we'll give you a printable address label"). Standardise button labels to §7's list.

## Phase 3 — Yoga & Garbhasanskar pricing and booking (§8, §9, §10)

- The `/yoga` pricing section renders from `ServicePackage`, grouped A–D. The **Monthly Combo ₹1,499 gets the
  Best Value treatment**: wider card, top of mobile order, primary border. Each card shows name, price,
  sessions, duration, validity, includes, **Book Now** and **Enquire**. Offer state follows §9: strikethrough regular price,
  terracotta offer price, "Special Offer" label, savings and expiry. Introductory price has its own label
  and no strikethrough.
- `/nutrition` and `/nutrition/starting-solids` move to the same component and data, so every service price
  is editable in one place.
- **Book Now** opens `whatsappLink()` with a prefilled message: *"Hi! I'd like to book the Monthly Combo (₹1,499 —
  8 Prenatal Yoga + 4 Garbhasanskar)."* plus the existing keyword. **Enquire** goes to
  `/contact?service=yoga&package=<id>`, which preselects the topic and shows the package.
- `ContactMessage` gains `packageId?`, `packageName?` and `quotedPricePaise?`, snapshotted at submit time. The admin
  Messages list shows "Monthly Combo · ₹1,499 quoted".
- Remove the "Starting prices… we'll confirm before you book" disclaimer, **and** add `offers` to the
  `Service` JSON-LD nodes. Both only once the client confirms the prices are final (open item 8).
- FAQ section "Sessions & booking" plus the `sessionPolicy` text shown under the pricing grid (§10:
  cancellation, rescheduling, refunds).

## Phase 4 — Discounts / Exclusive Offers page (§11)

- New `/offers` page. Each card shows logo, brand, description, verified benefit, coupon code with a
  **Copy code** button (clipboard plus a toast), **Shop Now** (`target=_blank`, `rel="sponsored noopener"` when
  affiliate), and expiry date. Expired offers are filtered out by the API, so they can never show by accident.
- Affiliate disclosure line on the page and an "Affiliate link" chip on affiliate cards.
- In the nav, sitemap and `pageMetadata`. Analytics events: `offer_copy`, `offer_click`.

## Phase 5 — Marketplace location and filters (§3, §4)

**Schema.** `Listing` gets `locality String?` and `pincode String?`, with indexes on `[status, city]` and
`[pincode]`. `User` gets `locality?` and `pincode?` as seller defaults. Existing listings keep `null`;
sellers are prompted to add them.

**Shared.**
- `INDIAN_CITIES`: a static list of about 300 cities with their state.
- City is chosen from that list, or typed under "Other" and then trimmed and title-cased.
- `pincode` must match `^[1-9][0-9]{5}$`. `locality` is limited to 60 characters, with helper text: "Area or neighbourhood only — never your house address".
- `listingQuerySchema` gains `locality` and `pincode`.

**API.**
- `city` becomes a **case-insensitive exact match**. Today "Delhi" `contains`-matches "New Delhi".
- `locality` uses a contains match and `pincode` an exact match.
- New `GET /listings/locations` returns the cities that have live listings, with counts, plus the localities for a given city. These feed the dropdown and the locality suggestions.
- Backfill: normalise existing `city` values. Dev only has six canonical cities; **check prod before running**.

**Web — `/listings`.**
- Searchable city combobox: type and select, cities with listings first.
- Locality and PIN inputs, plus the existing category, price, condition, delivery and sort.
- Every filter lives in the URL, so search, filters and sort combine.
- Active-filter chips with **Clear all**, and a filter drawer on mobile.
- Faceted URLs keep `noindex`.

**Seller form.** The same combobox, locality and PIN, prefilled from the user's defaults.

**Decision to confirm in review:** today, editing a live listing sends it back to PENDING. A
location-only edit should **not** re-trigger moderation, or sellers fixing a PIN lose their live listing for a day.

**Display.**
- Cards and detail show **"City · Locality"**. The PIN is never displayed.
- Condition labels in plain words without changing the enum: NEW → "New", LIKE_NEW → "Like new", GOOD → "Gently used", FAIR → "Well used".

## Phase 6 — Donations, admin-matched (§2, §4)

- New model `DonationOffer`: donor (logged-in user), contact snapshot, city/locality/PIN, category,
  item description, condition, photos (existing uploader), handover preference (pickup or drop-off),
  `status` NEW → CONTACTED → MATCHED → COMPLETED | DECLINED, and `adminNote`.
- `/preloved/donate`: explains how donating works, lists eligible items (needs the client's list), and holds the form.
  The form requires login and uses `?next=` to return.
- **Donate an Item** buttons on the home page and `/preloved` point here instead of `/contact`.
- `/admin/donations` queue with status changes and notes, plus an admin notification on each new donation
  (`notifyAdmins`, a new `DONATION_OFFERED` type). Mothers who want donated items are reached through the existing
  preloved WhatsApp group; there is no request form unless the client asks for one.

## Phase 7 — Login continuation + session handling (§5)

- **Resume the action, not just the page.** Gated actions pass `intent`, e.g.
  `/login?next=/listings/abc&intent=save`. The listing page runs `save` or `contact` once after login, then
  strips the parameter. This applies to wishlist, contact seller, donate and Book (where it needs login).
- **Probable open redirect to fix:** `login/page.tsx:36` does `router.push(next)` with an unvalidated
  `next`, so `?next=https://evil.example` may navigate off-site. Accept only same-origin relative paths
  (starting with `/` and not `//`), in both login and register.
- **Expired session:** when the refresh fails, `authedRequest` logs out and throws, which leaves the page in an error state.
  Redirect to `/login?next=<current>` with a "Your session expired" toast instead.

## Phase 8 — About, trust and policies (§6, §4, §10)

- `/about` renders founders (photo, intro, **verified qualifications**), mission, testimonials and the
  community/event gallery from `SiteContent` and `Testimonial`. Each block is hidden until it is filled. No fake
  testimonials, placeholder profiles or health claims.
- A **"How it works"** explainer on `/preloved` for buying, selling and donating. It covers fees (₹100 registration,
  plans, the 10% commission sellers pay), delivery (printable label), returns, refunds and cancellations (live
  `CancellationPolicy` values) and disputes (`conditionDisputeHours`, handled through Contact because there is
  still no dispute endpoint).
- Audit every WhatsApp, social and `mailto:`/`tel:` link.

## Phase 9 — SEO, speed, sharing (§12)

- Metadata and OG for `/offers`, `/preloved/donate` and the redone home page. Each service page gets its own OG
  image (WhatsApp previews prefer images under 300 KB).
- **Image weight:** the six new `public/images/yoga/*.png` files are 1.2–1.8 MB each. Convert them to WebP/AVIF at
  display size and make sure every image goes through `next/image`.
- Lighthouse mobile pass on home, `/yoga`, `/listings` and a listing page. Run a broken-link crawl over the sitemap.
- Unchanged: sitemap, canonical URLs, structured data and robots (already done; extend them for new pages only).

## Phase 10 — QA and handover (§14)

- **API unit tests:**
  - `resolvePackagePrice` (offer expiry, introductory/offer exclusion, savings maths)
  - offer expiry filtering
  - FAQ and testimonial publish/consent gating
  - location filter query building and validation
  - donation status transitions
  - `next` path validation
- **Browser pass** on mobile (375px) and desktop through the §14 checklist, with results written to
  `REDESIGN-QA.md` with screenshots and known limitations.
- **Backup restore drill:** take a `pg_dump`, restore it into a scratch database and record the steps.

---

## §13 — platform and ownership (facts for the client)

| Question | Answer |
|---|---|
| Platform | Custom code. Next.js 16 web app, NestJS 11 API, Prisma ORM. Not WordPress or Shopify. |
| Where it runs | Web on **Vercel**. API on **Render**. Database and image storage on **Supabase** (Postgres + Storage). |
| Code | GitHub `Eshwar-ui/nutrimom` (history also shows a `Velvo-media` org). The client should be an owner or admin of the repo. |
| Domain | `thenurturemoms.com`. **Registrar and owner: to confirm.** |
| Hosting accounts | **Owner of the Vercel, Render and Supabase accounts: to confirm.** Recommendation: the client owns each account with their own email and the developer is invited as a member. |
| Backups | Depends on the Supabase plan (check which plan is active). Add an independent scheduled `pg_dump` to client-owned storage, and test the restore (Phase 10). |
| Security updates | Enable Dependabot (or Renovate) on the repo. `pnpm audit` in CI. |
| Developer vs admin access | The app has its own role system. The client gets a **personal ADMIN account** in the app, separate from the dev `admin@gmail.com`. Infrastructure access stays per-person through the providers' team features. |

## Needed from the client (blocks the content, not the build)

1. Genuine photos: hero (Indian mother with baby or toddler), the four service sections, and community events. Are the
   upstream `public/images/yoga/*.png` files genuine or generated?
2. Founder photo, introduction and **verified** yoga and nutrition qualifications.
3. Testimonials with written permission.
4. **Session duration and validity** for every package. The brief gives prices and counts but not these.
5. Session cancellation, rescheduling and refund policy text.
6. The partner offers list with verified discounts, codes and expiry dates, and which links are affiliate.
7. Donation eligibility rules (accepted and refused items, e.g. car seats or cribs).
8. Are the §8 prices **final**? If so, the "starting prices" disclaimer goes and prices go into structured data.
9. Domain registrar and hosting account ownership (§13).

## Limitations to state in the handover

- **PIN:** format-checked only. No PIN-to-city verification and no distance search; both would need an India Post
  pincode dataset.
- **Sessions:** no online payment or slot booking. Booking is confirmed by hand on WhatsApp. The quoted price is
  recorded but not charged.
- **Genuine previous price** can't be proven by software. The admin gets a warning and a `priceSince` date only.
- **Donations** are matched by hand. They aren't listed or searchable.

## Risks

- **Live money paths.** Checkout, payouts, shipping and seller billing are untouched except for the location
  fields on `Listing`. Any change near them gets its own review.
- **Migration drift.** `20260808094732_route_payouts` is applied on dev but missing from the repo (see
  RESTRUCTURE-PLAN.md). Resolve it before deploying Phase 1's migration. The local, uncommitted
  `20260923110000_account_deletion` migration also has to land first.
- **Site-wide re-theme** changes every page at once. Ship it in one deploy and check contrast in both themes.
- **City backfill** rewrites live listing data. Run it on prod only after reviewing the distinct values (see
  memory: ask before changing live data).
