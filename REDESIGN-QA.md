# Redesign QA (2026-11-16)

Phase 10 record for [REDESIGN-PLAN.md](REDESIGN-PLAN.md). Checked against the dev stack
(web :1122, API :1133, Supabase dev database) in the in-app browser. No screenshots are
stored; results below are from DOM and HTTP checks plus spot screenshots.

## Passed

- **Public pages (17):** `/`, `/yoga`, `/nutrition`, `/nutrition/starting-solids`, `/community`,
  `/preloved`, `/preloved/donate`, `/offers`, `/listings` (and a filtered URL), `/about`, `/faq`,
  `/contact` (with `?service=`), `/resources`, `/journal`, `/login` — all HTTP 200, one `<h1>`,
  no image without `alt`, canonical on every indexable page.
- **Indexing:** faceted `/listings?…` is `noindex, follow`; `/login` is `noindex, nofollow`.
- **Mobile (375px):** no horizontal overflow on `/`, `/yoga`, `/nutrition`, `/preloved`,
  `/preloved/donate`, `/offers`, `/listings`, `/about`, `/contact`, `/faq`.
- **Console:** no errors on the home page.
- **Content API after migration:** 14 seeded packages (₹99–₹1,499), FAQs and site content return;
  `/yoga` renders the Monthly Combo as the Best Value card with Book Now and Enquire.
- **Locations:** `GET /listings/locations` returns the six seeded cities with counts.
- **Unit tests:** `pnpm --filter web test` — 14 pass (`next` validation, intent allowlist, link
  building, intent stripping). API and shared suites cover `resolvePackagePrice`, offer expiry,
  FAQ/testimonial gating, location filters and donation transitions.

## Not verified

- **Book Now → WhatsApp.** No WhatsApp number is set in the dev database, so the button falls back
  to `/contact?service=…&package=…`. Set the number at `/admin/settings`, then re-check the
  prefilled message.
- **Offer display** (strikethrough, "Special Offer" label, expiry) and `/offers` cards — no
  offers exist yet.
- **Testimonials, founders and gallery** on `/about` — no admin content yet, so the hidden-until-filled
  behaviour is what was seen, not the populated layout.
- **Admin content screens**, a real enquiry submission and the donation form end to end.
- **Lighthouse mobile** and a broken-link crawl (Phase 9).
- **Backup restore drill** (Phase 10): needs a scratch database; not run against Supabase.

## Known limitations

- PIN codes are format-checked only; no PIN-to-city lookup or distance search.
- Sessions are booked by hand over WhatsApp; the quoted price is recorded, not charged.
- A genuine "previous price" can't be proven by software; the admin form only warns.
- Donations are matched by hand and are not listed publicly.

## Open

- **Migration drift:** `20260808094732_route_payouts` is recorded in the dev database but missing
  from the repo. The database still holds its leftovers — `SellerPayout.transferId`,
  `User.razorpayAccountId` and the `PAYOUT_PAID` notification value — none of which the schema uses.
- Client content (photos, founders, testimonials, partner offers, session durations, policy text).
