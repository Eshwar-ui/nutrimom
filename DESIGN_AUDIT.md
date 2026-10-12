# The Nurture Moms — Full Design Audit

**Audit date:** 11 July 2026  
**Scope:** All user-facing routes in `apps/web`, at desktop (1440 × 900) and mobile (390 × 844) where renderable.  
**Method:** Live browser inspection, responsive checks, DOM/accessibility review, design-token review, and source review of authenticated states.  
**Status:** Recommendations only. No UI changes have been implemented.

## Executive summary

The public storefront already has a distinctive, warm identity. The hero, typography, palette, illustrations, rounded shapes, and editorial product layouts feel more intentional than a typical marketplace prototype. The strongest pages are the home page, catalog, product detail, About page, and custom 404.

The experience becomes much less resolved when users move from inspiration to action. Mobile product discovery is delayed by a long wall of category chips and filters; the primary product actions are below the first mobile viewport; authentication and account pages look generic compared with the homepage; seller/admin workflows use dense forms and tables without enough hierarchy; loading frequently appears as blank space or plain text; and several trust claims shown prominently on the homepage are not backed by the current product behavior.

**Current visual maturity:**

- Brand and landing experience: **8/10**
- Catalog and product discovery: **6/10**
- Checkout and account experience: **5/10**
- Seller and admin tools: **4.5/10**
- Accessibility and state completeness: **4/10**

The priority is not a full redesign. Preserve the visual world and improve the system underneath it: hierarchy, responsive behavior, truthful trust communication, state design, form accessibility, and transactional clarity.

## Audit constraints and evidence

The repository does not contain a PRD, APP_FLOW, DESIGN_SYSTEM document, FRONTEND_GUIDELINES, or past design lessons. This audit therefore treats the README, live routes, shared components, and current behavior as the source of truth.

Observed live metrics:

| Template | Desktop height | Mobile height | Observation |
|---|---:|---:|---|
| Home | 5,927 px | 8,760 px | Rich but long; repeated promotional content increases cognitive load. |
| Catalog | 2,803 px | 4,460 px | On mobile, category/filter UI consumes the first screens before any product appears. |
| Product detail | 1,650 px | 2,551 px | Desktop composition is strong; mobile has no persistent purchase action. |

No measured route produced document-level horizontal overflow, and inspected images had alternative text. In the audited development session, client-side hydration was unreliable: opening search did not reveal the search field and login fell back to a native GET submission. This is a build/runtime verification blocker rather than a visual recommendation and should be investigated separately.

## Global current state vs target state

| Area | Current | Target |
|---|---|---|
| Brand | Warm cream, forest green, coral, Fraunces and Manrope; memorable illustrated world. | Preserve this identity and use it more selectively so transactional screens remain calm and trustworthy. |
| Header | Two-level sticky header with continuously moving promotion ticker, full nav, search, sell and sign-in actions. | One compact mobile header; pause motion by default for reduced-distraction contexts; keep only one primary utility CTA per state. |
| Typography | Strong display hierarchy on marketing pages; inconsistent page-title sizes between storefront, account and admin. | One responsive type scale and one reusable `PageHeader` pattern across all non-marketing routes. |
| Color | Palette is cohesive, but coral text on cream is only **2.39:1**; muted text is **4.48:1** and primary button text is approximately **4.49:1**. | Introduce accessible text-specific coral and stronger muted/primary values; reserve decorative coral for fills and highlights. |
| Borders | Very soft border token is only **1.23:1** against the page background. | Keep soft borders for decoration, add a stronger control border for inputs, tables and focus boundaries. |
| Components | Buttons/cards are consistent; form controls are partly duplicated and labels are usually not programmatically associated. | Shared `FormField`, `Select`, `Textarea`, `PageHeader`, `EmptyState`, `ErrorState`, `Skeleton`, and mobile action-bar components. |
| States | Listings has a good skeleton; many other routes return blank containers or plain “Loading…” text. | Every data screen gets layout-preserving skeletons, guided empty states and actionable error states. |
| Motion | Playful card/CTA motion and marquees; reduced-motion CSS exists. | Keep motion for feedback and transitions, remove ambient motion from high-focus checkout/admin contexts. |
| Dark mode | Dark tokens exist but there is no discoverable theme control and the mode was not verifiable. | Either complete and expose dark mode or remove it from the implied supported system until it is tested. |
| Content trust | “Free shipping,” “10% off,” “ID-checked,” held payments, buyer protection and seven-day returns are shown as facts. | Show only operational promises. Any unsupported promise requires product/legal implementation before remaining in the UI. |

## Page-by-page audit

### Storefront and discovery

| Route | How it is now | How it should be |
|---|---|---|
| `/` | Visually excellent hero, strong emotional message and rich storytelling. The page is very long, repeats trust/promotional messages, exposes duplicated marquee content to assistive technology, and includes unsupported commercial promises. | Keep the hero and visual world. Reduce the body to: category entry, fresh products, how it works, verified trust evidence, one seller CTA and newsletter. Hide decorative/repeated marquee copies from assistive technology. Replace claims with verified marketplace facts. |
| `/listings` | Strong desktop grid and clear controls. Seventeen category chips plus a large filter block dominate mobile; the user sees no product in the first viewport. Filters require an explicit Apply action and there is no compact active-filter summary. | Desktop: retain inline filters with clearer grouping. Mobile: horizontally scrollable top categories, search + sort in the page header, a single “Filters” drawer button with an active count, removable filter chips, and products visible within the first screen. |
| `/categories/[slug]` | Clean but sparse category page with little context and a small product set. | Use the catalog template with the category preselected, a short useful description, result count, filter/sort controls and related categories. Do not maintain a visually separate reduced-feature template. |
| `/listings/[id]` | Desktop composition is one of the best screens: clear gallery, price, facts, seller and actions. Seed images are unrelated generic photos, destroying trust. On mobile the CTA group is well below the fold and there is no sticky action bar. Four actions compete equally. | Use authentic item photography and clear image-quality rules. Mobile gets a persistent bottom bar with price + primary “Buy now/Add to bag”; move Save, Reserve and WhatsApp into secondary actions. Put safety, delivery and seller trust directly beside the primary action. |
| `/sellers/[id]` | Useful seller card, products and reviews, but the page relies heavily on text and generic cards. | Lead with a compact seller identity/trust panel, rating summary, location and response/contact behavior. Separate available listings from reviews with clear tabs or anchored sections. Keep the product card system identical to catalog. |
| `/wishlist` | Auth-gated client screen; blank before hydration and conventional empty state. | Preserve product grid behavior, add a designed skeleton and a helpful empty state that links to recently active categories. Show unavailable/sold status without letting stale cards look purchasable. |
| `/cart` | Simple two-column desktop layout and understandable empty state. Entire route renders blank until client persistence hydrates. Summary is not persistent on mobile. | Use cart-item skeletons during hydration, a clear unavailable-item state, and a sticky mobile checkout summary. Make removal an explicit but quiet destructive action with undo feedback. |

### Authentication, checkout and orders

| Route | How it is now | How it should be |
|---|---|---|
| `/login` | Centered generic card with large unused space; visually disconnected from the expressive homepage. Labels are visible but not associated with inputs. Metadata uses the site default. | Use a restrained split or framed layout with one small brand/trust panel, clear field associations, password visibility, recovery affordance, route metadata and a focused card that does not leave the page feeling empty. Password recovery requires product work. |
| `/register` | Same generic card pattern with name/email/password. Minimal guidance and no staged expectation-setting. | Match login visually, explain what the account enables, associate every label, expose password requirements before error, and keep legal consent copy close to submit. Any consent behavior is a functional requirement. |
| `/checkout` | Desktop address + summary grid is understandable. There is no checkout progress, delivery-method context, persistent mobile total, or strong error-recovery state. Blank while auth/cart hydrate. | Add a compact “Address → Payment → Confirmation” step indicator, skeletons, clear item availability, persistent mobile total/Pay action and payment-security reassurance. Errors must distinguish unavailable items, payment failure and payment received-but-unconfirmed. |
| `/orders/[id]` | Friendly success state, line items, address, print, review and cancellation actions. All states share almost the same composition and cancellation competes visually with safe actions. | Use a status timeline, separate receipt from fulfillment actions, place cancellation in a low-emphasis danger section, and show the next expected action/date. Paid cancellation/refund messaging requires backend alignment before design claims are added. |
| `/account/orders` | Compact order cards are readable. Loading is plain text. Empty-state CTA links to the nonexistent `/products` route. | Use order-card skeletons, correct CTA to `/listings`, surface thumbnails and the next status step, and group historical vs active orders when volume grows. |

### Seller and account area

| Route | How it is now | How it should be |
|---|---|---|
| `/account` | Four navigation cards, verification status, then a long profile form. Useful but all content carries similar card weight. | Create a clear account header with identity/status, a compact navigation rail or two-column menu, then seller verification and profile as separate hierarchy levels. On mobile, use list rows rather than four large cards. |
| `/account/listings` | Stats plus compact listing rows with edit/delete. Empty state is serviceable. | Add status filter chips, clearer moderation feedback, thumbnail consistency, and explicit unavailable/sold treatment. Keep destructive actions in an overflow menu on mobile. |
| `/account/listings/[id]/edit` | Reuses the sell form appropriately; loading is plain text and missing state is minimal. | Use the same staged form system as `/sell`, with a visible listing status, autosave/unsaved-change feedback if implemented, and a fully designed not-found/permission state. Autosave is functional scope. |
| `/sell` | One long card containing every field. Photo entry requires pasting URLs, which is unsuitable for the target audience. Validation collapses multiple issues into one banner. | Present 3 visual sections: Photos, Item details, Price & handover. Put photos first with thumbnails and quality guidance. Show inline errors per field and a mobile sticky Continue/Submit action. Actual uploads require functional implementation. |
| `/account/notifications` | Clear notification cards with unread treatment; plain loading state and a text-heavy empty card. | Use skeleton rows, group Recent/Earlier, preserve strong unread contrast, and make the empty state reassuring with one relevant action. |

### Admin area

| Route | How it is now | How it should be |
|---|---|---|
| `/admin` | Four stat cards and recent orders. No page title, timeframe, trends, task prioritization or loading skeletons. | Add “Admin overview,” last-updated state, priority queue first (pending listings/orders needing action), then metrics. Use explicit empty/loading states and avoid showing em-dashes as silent data states. |
| `/admin/listings` | Filter buttons and compact moderation rows. Approve/reject/feature use icon-only actions with little decision context. | Use a review queue with larger image, seller trust context, key item facts and explicit labeled Approve/Reject buttons. Confirmation/details panel should support confident moderation. |
| `/admin/categories` | Inline create/edit card and category rows. Functional but visually flat. | Keep inline editing, add clear edit mode/title, item counts, slug preview and strong success/error feedback. On mobile use full-width form and row action menu. |
| `/admin/users` | Dense user rows with verification action. | Separate verification queue from all users. Show identity, city, listing count, request age and decision state. Use labeled actions rather than relying on compact controls. |
| `/admin/orders` | Horizontal-scroll table with arbitrary status select in every row. Works on desktop but is poor on narrow screens and encourages accidental state changes. | Desktop can retain a table with sticky headers and filters. Mobile becomes order cards. Status updates move into an order detail/action panel with legal transitions and confirmation. Transition enforcement is functional scope. |

### Editorial, legal and system pages

| Route | How it is now | How it should be |
|---|---|---|
| `/about` | Strong illustration, narrative and value cards; consistent with homepage. | Keep the structure, reduce repeated marketing claims and include only evidence-backed trust statements. |
| `/contact` | Contact information cards only; includes placeholder legal/address content. | Replace placeholders, clearly separate support, safety/reporting and business contact. A contact form or ticket flow is functional scope. |
| `/policies` | Four friendly summary cards, easy to scan. | Add a table of contents/anchors and link each summary to the authoritative detailed policy. Ensure language matches actual platform operations. |
| `/privacy` | Readable narrow legal column but contains placeholders. | Replace placeholders, add last-updated date, contents navigation, readable line length and a clear privacy contact. |
| `/refunds` | Readable policy page, but its promises do not match the current refund implementation. | Align with actual payment/refund behavior before launch; add last-updated date and step-by-step request path. Backend/legal alignment is outside visual scope. |
| `/terms` | Good narrow typography but contains legal entity, CIN and support placeholders. | Replace all placeholders, add last-updated date and contents navigation. Do not publish/index until legally complete. |
| `/brand` | Useful internal logo showcase presented as a public page. | Treat as internal documentation: exclude from public navigation/indexing or convert it into an intentional public press/brand-assets page with downloads and usage rules. |
| `not-found` | Friendly branded message with clear recovery actions. | Keep it. Add a compact search affordance only if global search is made reliable. |
| `loading/error` | Only listings has a dedicated polished loading route; most client pages are blank or plain text. | Create a consistent route-level skeleton and error-state system for every data-dependent template. |

## Accessibility findings

1. **Critical — form labels are not associated with controls.** `Label` renders a plain `<label>` without `htmlFor`, while fields generally have no matching `id`. Screen readers identify several fields by placeholder rather than label.
2. **Critical — coral text fails contrast.** `#ef8377` on the cream background is approximately 2.39:1. It is used for links and validation errors, where normal text requires 4.5:1.
3. **High — nested interactive controls.** Multiple routes wrap the shared `<Button>` inside `<Link>`, producing a link containing a button in the accessibility tree. Use a single link styled with button variants.
4. **High — blank hydration states.** Cart, checkout, wishlist, sell, account and admin return visually blank containers while client state resolves. These provide no progress announcement or spatial stability.
5. **High — repeated marquee content.** Promotion text is duplicated many times in the accessibility tree. Decorative copies should be hidden and the motion should pause for reduced-motion users.
6. **Medium — icon-only admin actions need stronger visible context.** Accessible names exist in several places, but destructive/approval meaning should not depend on tooltip or icon recognition.
7. **Medium — borders are too subtle for controls.** The base border is 1.23:1 against the background; inputs need a stronger boundary, especially for low-vision users.
8. **Positive — inspected content images include alt text, focus-ring styles exist, touch targets are generally near 44 px, and reduced-motion CSS is present.**

## Phase 1 — Critical

### 1. Fix discovery and conversion on mobile

- Replace the mobile category wall with a one-line scrollable chip rail.
- Replace the full mobile filter form with a filter drawer and active-filter count.
- Keep product cards visible within the first catalog viewport.
- Add a sticky product-detail action bar containing price and one primary action.
- Reduce product-detail actions to one primary and a clearly ordered secondary set.

### 2. Make every transactional state visible

- Replace blank hydration containers with layout-preserving skeletons.
- Create shared empty and error states for cart, wishlist, checkout, orders, seller lists and admin screens.
- Fix the `/account/orders` empty-state link from `/products` to `/listings` (functional defect).
- Investigate the dev-session hydration failure before visual refinement continues.

### 3. Establish accessible form foundations

- Update `Label`/field APIs to generate `id`, `htmlFor`, `aria-describedby` and error IDs.
- Introduce shared `Select` and `Textarea` components using the same control tokens.
- Replace Link-wrapped Buttons with links styled using `buttonVariants`.
- Add an accessible text accent/danger token and stronger field-border token.

### 4. Restore marketplace trust

- Replace generic Picsum seed images with relevant baby/maternity product images.
- Remove or qualify unsupported shipping, discount, ID-check, held-payment, buyer-protection and return claims.
- Resolve all legal/contact placeholders before public launch.
- Align cancellation/refund UI copy with implemented payment behavior.

## Phase 2 — Refinement

### 1. Normalize the page system

- Introduce `PageHeader` with title, supporting text, action slot and responsive spacing.
- Standardize storefront/account H1 to 36/48 px responsive; admin H1 to 32/40 px.
- Standardize content spacing to 48 px mobile / 72 px desktop for top-level routes.
- Use one max-width family: reading `48rem`, forms `52rem`, transactional `72rem`, catalog `80rem`.

### 2. Recompose account, seller and admin navigation

- Account mobile navigation becomes compact list rows; desktop becomes a quiet sidebar or two-column menu.
- Admin desktop uses a stable sidebar; mobile uses a scrollable tab bar plus page title.
- Prioritize queues and required actions above passive metrics.
- Convert admin mobile tables into cards; preserve tables only at tablet/desktop sizes.

### 3. Clarify forms and checkout

- Group sell fields into Photos, Item details, and Price & handover.
- Add persistent section labels and inline field errors.
- Add a checkout step indicator and sticky mobile total.
- Visually distinguish payment error, inventory error and pending confirmation.

### 4. Reduce promotional density

- Keep either the ticker or the hero benefit strip, not both repeating the same claims.
- Reduce homepage trust sections to evidence-backed items with one visual treatment.
- Remove duplicated accessible marquee/carousel content.

## Phase 3 — Polish

- Add subtle route/content transitions only after loading and hydration are stable.
- Add button success states and undo toasts for reversible removals.
- Add image-loading placeholders and aspect-ratio-safe fallbacks.
- Complete and verify dark mode, or remove the dormant theme contract.
- Add last-updated timestamps and anchor navigation to long policy pages.
- Add consistent hover, focus, selected and disabled states to filter chips and admin controls.
- Verify keyboard journeys and screen-reader announcements for authentication, filters, cart and checkout.

## Required design-system updates

| Token/component | Change |
|---|---|
| `--text-accent` | Add a darker coral specifically for text/errors with at least 4.5:1 contrast on cream and white. |
| `--muted-foreground` | Darken slightly to safely exceed 4.5:1 on the primary background. |
| `--primary` | Adjust button green or foreground so normal-size button text safely exceeds 4.5:1. |
| `--border-control` | Add a stronger boundary token with 3:1 non-text contrast for form controls. |
| `FormField` | Own label association, description, error, required and disabled semantics. |
| `PageHeader` | Normalize title, subtitle, breadcrumbs and page actions. |
| `EmptyState` | Icon/illustration, title, helpful description and one primary recovery action. |
| `ErrorState` | Human message, retry/recovery action and optional support path. |
| `RouteSkeleton` | Page-header, card-list, form and table variants. |
| `StickyMobileActionBar` | Safe-area-aware price/action bar for product, cart and checkout. |
| `FilterDrawer` | Mobile filters with active count, reset and apply behavior. |
| `AdminDataList` | Responsive table-to-card pattern with labeled actions. |

## Recommended implementation order

1. Form/accessibility foundations and color-token fixes.
2. Hydration/loading/error states.
3. Mobile catalog and product action bar.
4. Product imagery and truthful trust content.
5. Checkout/cart/order hierarchy.
6. Account/seller navigation.
7. Admin responsive system.
8. Editorial/legal completion.
9. Motion, dark mode and final polish.

## Acceptance criteria

- A mobile shopper sees at least one product card in the first catalog viewport after the page header.
- Product price and primary purchase action remain reachable on mobile without scrolling to the end of the detail content.
- No route displays an unexplained blank area while client data hydrates.
- Every form control has a programmatically associated label and error description.
- Normal text and interactive boundaries meet WCAG AA contrast.
- No link contains a nested button.
- Every visible trust or policy promise corresponds to implemented behavior.
- Admin pages remain usable without horizontal page scrolling at 390 px.
- All public routes have deliberate metadata, loading, empty and error states.
- Product images depict the listed item category and do not use unrelated generic photography.

## Approval gate

This audit intentionally makes no UI changes. Approve or reorder Phase 1 before implementation. Each phase should be implemented and visually reviewed at mobile, tablet and desktop before moving to the next.
