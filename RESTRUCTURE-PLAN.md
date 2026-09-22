# The Nurture Moms — Ecosystem Restructure Plan

> Source: `The_Nurture_Moms_Complete_Website_Plan.pdf` (founders' master brief).
> Branch: `feat/sitemap-restructure`.
>
> **The shift:** the site stops being a preloved marketplace and becomes a four-pillar
> motherhood platform — **Move** (Yoga), **Nourish** (Nutrition), **Connect** (Community),
> **Pass it on** (Preloved) — with the existing marketplace kept fully intact as one pillar
> rather than the whole identity.

---

## Decisions taken (2026-09-22)

These four were settled before any code, because each changes the shape of the work:

| # | Decision | Chosen | Why it matters |
|---|----------|--------|----------------|
| 1 | Preloved URLs | **Keep `/listings`, `/categories/*`, `/sell`; add a new `/preloved` hub page** | The marketplace is the only part of the site with indexed URLs and live orders. Moving them would cost every ranking and every shared link for a naming change. The hub page gives the pillar something to rank and carries the buy/sell/donate framing. |
| 2 | Booking | **WhatsApp deep-link + on-site enquiry form** (no scheduler, no service payments) | The brief's own §12 funnel is built on WhatsApp keywords (YOGA / FOOD / CONNECTION / SOLIDS), and §10 flags every price as an unconfirmed planning range. Building slots + checkout before prices exist would be building against a spec that isn't written. |
| 3 | Journal | **Rename to "The Nurture Journal" *and* move `/blog` → `/journal`**, with 308 redirects | Brief §11. See the redirect note below — this one is safe, unlike the in-post slug redirects. |
| 4 | Service page content | **Hardcoded in the page components**, like `/about` and `/policies` today | Ships fastest, designs best. Long-form content already has a home in the Blog CMS. Revisit if the founders need to edit pricing without a deploy. |

### Redirect note — why `/blog` → `/journal` is safe

`CLAUDE.md` (Blog QA pass, item 4) records that a *renamed post slug* can only redirect via a
client-side meta refresh, because the root `loading.tsx` makes every page stream and the HTTP
status commits before the slug lookup resolves. **That does not apply here.** `/blog/:slug` →
`/journal/:slug` is a static path rewrite with no database lookup, so it goes in
`next.config.ts`'s `redirects()` and is a real **308** issued before rendering begins.

---

## Target information architecture

```
/                       Home — four pillars, stage selector, latest listings
/yoga                   MOVE       — prenatal, postnatal, Garbhasanskar, 1:1, group, recorded
/nutrition              NOURISH    — pregnancy, postpartum, baby & toddler, consultations
/nutrition/starting-solids         — dedicated conversion page for baby-food traffic
/community              CONNECT    — mom support, events, expert sessions, membership
/preloved               PASS IT ON — marketplace hub
  /listings                        — shop all            (UNCHANGED)
  /categories/[slug]               — category browse     (UNCHANGED)
  /listings/[id]                   — item detail         (UNCHANGED)
  /sell                            — list an item        (UNCHANGED)
  /sellers/[id]                    — seller profile      (UNCHANGED)
/about                  Sudha & Nandini, story, mission
/journal                The Nurture Journal         (WAS /blog)
/journal/[slug]         Post                        (WAS /blog/[slug])
/contact                Contact + enquiry
/policies /terms /privacy /refunds                   (UNCHANGED)
```

Private surfaces (`/account/*`, `/admin/*`, `/cart`, `/checkout`, `/orders`, `/wishlist`,
auth pages, `/brand`) are unchanged and stay `noindex` + robots-disallowed.

### Navigation

**Primary:** Home · Yoga · Nutrition · Community · Preloved · About · **[ Book / Join ]**

The current header's "Shop" dropdown becomes the **Preloved** dropdown (hub + category
shortcuts + Sell an item). The cart, wishlist, notifications and account chip are unchanged —
they are marketplace machinery and stay exactly where buyers expect them.

**Footer:** The Nurture Journal · Free Resources · FAQs · Contact · Privacy · Terms ·
Refund/Cancellation · Instagram · YouTube · WhatsApp.

---

## Phase 0 — IA & routing foundation  ← this branch

The structural move. No new page design yet; every new route ships as a real page with
correct metadata so the sitemap, nav and redirects can be verified independently of copy.

- [ ] `lib/site-nav.ts` — one definition of the four pillars and the nav/footer trees,
      consumed by the header, the footer and `sitemap.ts`. (The header, footer and sitemap
      currently each hardcode their own link lists; that is how a nav and a sitemap drift.)
- [ ] `git mv app/blog app/journal`; update the in-page links, `structured-data.ts`'s
      `blogPostingJsonLd` URL and `sitemap.ts`.
- [ ] `next.config.ts` — permanent redirects `/blog` → `/journal`, `/blog/:slug` → `/journal/:slug`.
- [ ] `app/api/revalidate/route.ts` — `blog` scope purges `/journal` and `/journal/[slug]`.
- [ ] New routes: `/yoga`, `/nutrition`, `/nutrition/starting-solids`, `/community`, `/preloved`.
- [ ] `sitemap.ts` — add the five new URLs, move the blog URLs to `/journal`.
- [ ] `robots.ts` — unchanged, but re-verified against the new tree.
- [ ] Header + footer rebuilt on `site-nav.ts`, with the Book/Join CTA.
- [ ] `lib/seo.ts` — `SITE_TAGLINE` and `SITE_DESCRIPTION` still say "preloved marketplace";
      they become the ecosystem line. **This changes the meta description of every page that
      doesn't set its own.**

## Phase 1 — Brand & homepage

- [ ] Home restructured: hero ("Motherhood is a journey. You don't have to do it alone."),
      stage selector (6 cards), four-pillar grid, then the existing marketplace sections.
- [ ] Brand line "Move. Nourish. Connect. Pass it on." in hero, footer and OG copy.
- [ ] `/about` rewritten for Sudha & Nandini as Co-founders.
      **Constraint from the brief: invent nothing about Nandini beyond "Co-founder."**
- [ ] Palette + type check against the brief (Deep Teal `#006B6B`, Sage `#A8BFA0`, warm ivory,
      muted terracotta, soft gold; Playfair Display + DM Sans). Audit what the theme already
      has before adding tokens — much of this may already be in place.
- [ ] New `og-default.png` reflecting the ecosystem, not the marketplace.

## Phase 2 — Service pages

- [ ] `/yoga` — hero, credential strip, 6 offering cards, pricing ("starting from"), safety copy.
- [ ] `/nutrition` — hero, 5 services, free-resource cards, pricing.
- [ ] `/nutrition/starting-solids` — dedicated landing page, "session includes" list, single CTA.
- [ ] `/community` — hero, 7 community areas, free tier + "Nurture Moms Plus" as *future*.
      **The brief says do not launch a paid tier until benefits and delivery are defined.**
- [ ] `/preloved` — pillar hub: buy / sell / donate, links into the live marketplace.
- [ ] Reusable `ServiceCard` / `PricingTable` / `BookingCta` components so the four pages
      share one visual language and the marketplace's card grammar (brief §13).

## Phase 3 — Booking, enquiry & lead capture

- [ ] Business WhatsApp sourced from the `BusinessProfile` (`supportPhone`) rather than a
      new constant — the admin already fills that in at `/admin/settings`.
- [ ] `BookingCta` → `whatsappLink()` (already in `packages/shared`) with the per-service
      keyword: YOGA · FOOD · SOLIDS · CONNECTION.
- [ ] Enquiry form reusing the existing `ContactMessage` model + `POST /contact`.
      **Needs a migration:** a `service` / `source` column so admin → Messages can tell a
      yoga enquiry from a general one.
- [ ] Free-resource downloads (lead magnets) — email capture then file. Decide storage
      (Supabase bucket, same as listing images) before building.

## Phase 4 — Journal, SEO & measurement

- [ ] `BlogPost.category` + `/journal?category=` filter + category landing pages
      (Pregnancy · Yoga · Postpartum · Nutrition · Starting Solids · Baby · Toddler ·
      Motherhood · Mompreneur · Preloved). **Needs a migration.**
- [ ] Structured data for the new pages: `Service` nodes on yoga/nutrition/solids,
      `Organization` updated from marketplace-only to the ecosystem, breadcrumbs.
- [ ] SEO landing pages from brief §11 (prenatal yoga online, Garbhasanskar sessions, …).
- [ ] Analytics: pillar click-through, solids-page conversion, WhatsApp keyword attribution.
      Nothing is installed today — this is a from-zero item.

---

## Decided: brief §13 (palette & type) is not adopted — 2026-09-23

The brief specifies Deep Teal `#006B6B`, Sage `#A8BFA0`, Playfair Display and DM Sans. The
site runs forest green `#456f50`, coral `#ef8377`, Fraunces and Outfit. **The operator chose
to keep the existing brand**, so this is a deliberate divergence, not an outstanding gap —
do not re-flag it in future audits. Everything else in §13 (mobile-first, alt text, contrast,
reusing the marketplace card language) is followed.

## Open questions for the founders

1. **WhatsApp business number** — is `BusinessProfile.supportPhone` the number that should
   receive YOGA / FOOD / SOLIDS / CONNECTION enquiries, or is there a separate one?
2. **Community destination** — does "Join the Community" open a WhatsApp group invite, an
   Instagram broadcast channel, or an on-site sign-up? Nothing exists today.
3. **Sudha's credentials** — the brief's yoga credential strip ("200-Hour Yoga Certification ·
   Prenatal & Postnatal Training · Garbhasanskar") needs confirming before it is published.
4. **Pricing** — publish the ranges as "starting from", or hold every price until final?
5. **Instagram / YouTube URLs** — the footer is specified to carry them; neither is in the repo.
6. **Lead magnets** — do the six PDFs in brief §11 exist yet?

## Risks

- **Meta descriptions site-wide change** when `SITE_DESCRIPTION` is rewritten. Intended, but
  it is a bulk change to indexed pages and should land in one deploy, not dribble out.
- **`/blog` → `/journal`** costs a re-crawl. The 308s protect link equity; Search Console
  should be watched for a fortnight after deploy.
- **The marketplace must keep working throughout.** Checkout, payouts, shipping and seller
  billing are live code paths with real money in them. Nothing in Phases 0–2 touches them;
  any change that does gets its own review.
