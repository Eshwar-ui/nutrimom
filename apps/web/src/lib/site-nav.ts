/**
 * One definition of the site's information architecture.
 *
 * The header, the footer and `sitemap.ts` each used to hardcode their own link
 * list, which is exactly how a navigation and a sitemap drift apart — a page
 * gets added to the menu and never submitted, or stays in the sitemap after
 * being pulled from the nav. They all read this file now.
 *
 * Structure follows the founders' brief: four pillars — Move (Yoga), Nourish
 * (Nutrition), Connect (Community), Pass it on (Preloved) — with the existing
 * marketplace kept intact underneath the fourth.
 */

export const BRAND_LINE = "Move. Nourish. Connect. Pass it on.";
export const BRAND_PROMISE = "For every stage of motherhood.";
export const TRUST_LINE = "Mom-led · Practical · Affordable · Community-focused";

/**
 * WhatsApp keywords from the brief's conversion funnel (§12). Each service CTA
 * prefills the message with its own keyword so an enquiry arrives already
 * attributed to the content that produced it.
 */
export const WHATSAPP_KEYWORDS = {
  yoga: "YOGA",
  nutrition: "FOOD",
  solids: "SOLIDS",
  community: "CONNECTION",
} as const;

/**
 * The `?service=` slug each booking intent hands to the contact form, so the
 * on-site fallback carries the same attribution the WhatsApp keyword does.
 *
 * Kept as its own map rather than reusing the keyword: the keywords are copy
 * the founders type into WhatsApp, while these are `ENQUIRY_SERVICES` slugs in
 * shared and part of a URL contract. They diverge already — SOLIDS against
 * `starting-solids` — and tying them together would make renaming one rename
 * the other.
 */
export const ENQUIRY_SERVICE_SLUGS = {
  yoga: "yoga",
  nutrition: "nutrition",
  solids: "starting-solids",
  community: "community",
} as const;

export type PillarKey = "move" | "nourish" | "connect" | "pass-it-on";

export interface Pillar {
  key: PillarKey;
  /** The one-word pillar name — MOVE, NOURISH … */
  eyebrow: string;
  /** What it actually is, in the visitor's words. */
  title: string;
  href: string;
  blurb: string;
  cta: string;
}

/**
 * The four services. Titles, descriptions and button labels are the founders'
 * own wording from the 2026-11 redesign brief (§2 and §7), so the home page,
 * /about and anything else listing the services say the same thing.
 */
export const PILLARS: readonly Pillar[] = [
  {
    key: "move",
    eyebrow: "Move",
    title: "Yoga & Garbhasanskar",
    href: "/yoga",
    blurb:
      "Prenatal yoga, postnatal yoga, breathing, relaxation and mindful pregnancy practices.",
    cta: "Explore Yoga & Garbhasanskar",
  },
  {
    key: "nourish",
    eyebrow: "Nourish",
    title: "Maternal & Child Nutrition",
    href: "/nutrition",
    blurb:
      "Nutrition guidance for pregnancy, postpartum recovery, babies and toddlers.",
    cta: "Explore Nutrition",
  },
  {
    key: "connect",
    eyebrow: "Connect",
    title: "Mom Community",
    href: "/community",
    blurb:
      "A supportive space where mothers can connect, learn, share experiences and discover helpful resources.",
    cta: "Join Our Community",
  },
  {
    key: "pass-it-on",
    eyebrow: "Pass it on",
    title: "Preloved Marketplace",
    href: "/preloved",
    blurb:
      "A platform to buy, sell and donate eligible baby clothes, toys, books and other products.",
    cta: "Shop Preloved",
  },
] as const;

/**
 * The homepage's "choose your stage" entry points (brief §3).
 *
 * Deliberately phrased in the visitor's words rather than ours — someone
 * arriving from a reel knows they are six weeks postpartum, not that they want
 * the "Nourish" pillar. Each stage routes to the one page that answers it, so
 * the choice is a shortcut rather than another menu.
 */
export interface Stage {
  label: string;
  /** The services this stage leads to, shown under the label. */
  covers: string;
  href: string;
}

export const STAGES: readonly Stage[] = [
  { label: "I'm pregnant", covers: "Yoga · Garbhasanskar · Nutrition", href: "/yoga" },
  { label: "I'm postpartum", covers: "Recovery · Yoga · Nutrition · Support", href: "/nutrition" },
  { label: "My baby is starting solids", covers: "Solids session · Baby nutrition · Meal ideas", href: "/nutrition/starting-solids" },
  { label: "I'm navigating toddlerhood", covers: "Nutrition · Meal ideas · Free guides", href: "/nutrition" },
  { label: "I need mom support", covers: "Community · Events · Expert sessions", href: "/community" },
  { label: "I want preloved", covers: "Buy · Sell · Donate", href: "/preloved" },
] as const;

export interface NavLink {
  href: string;
  label: string;
  placeholder?: boolean;
  /** Off-site destination — opens in a new tab and skips next/link. */
  external?: boolean;
}

/**
 * The brand's own channels, as the founders supplied them. Also emitted as
 * `sameAs` in the organisation's structured data, so keep these to profiles the
 * business actually owns. The Instagram link is stored without the QR-code
 * tracking parameters it was shared with.
 */
export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/thenurturemoms",
  youtube: "https://www.youtube.com/@thenurturemoms",
} as const;

/**
 * WhatsApp community invites. Two groups: the general mom community, and a
 * separate one for preloved buying and selling.
 */
export const WHATSAPP_COMMUNITY_URL =
  "https://chat.whatsapp.com/LYhXcQjWwvp09OY66kQXgS";
export const WHATSAPP_PRELOVED_URL =
  "https://chat.whatsapp.com/DWErNklaubQ4WEQ3uCzkOD";

export interface NavItem extends NavLink {
  /** Rendered as a dropdown when present; the parent stays a real link. */
  children?: NavLink[];
}

/** Matches a route and its nested pages without making `/` match everything. */
export function isNavPathActive(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

/** A dropdown stays active when one of its marketplace shortcuts is active. */
export function isNavItemActive(pathname: string, item: Pick<NavItem, "href" | "children">) {
  return (
    isNavPathActive(pathname, item.href) ||
    item.children?.some((child) => isNavPathActive(pathname, child.href)) === true
  );
}

/**
 * Category shortcuts under Preloved. These slugs are seeded categories — if one
 * is renamed the link 404s, so they are the same set the footer and the home
 * page rail already rely on rather than a new list to keep in step.
 */
const PRELOVED_CHILDREN: NavLink[] = [
  { href: "/preloved", label: "How It Works" },
  { href: "/listings", label: "Shop Preloved" },
  { href: "/categories/strollers", label: "Strollers" },
  { href: "/categories/baby-clothes", label: "Baby Clothes" },
  { href: "/categories/maternity-wear", label: "Maternity Wear" },
  { href: "/categories/toys", label: "Toys" },
  { href: "/sell", label: "Sell an Item" },
  { href: "/preloved/donate", label: "Donate an Item" },
];

/** Under Resources: the free guides and the blog (the Journal). */
const RESOURCES_CHILDREN: NavLink[] = [
  { href: "/resources", label: "Free Guides" },
  { href: "/journal", label: "Blog" },
];

/** Under About: the brand's story, and the questions people ask first. */
const ABOUT_CHILDREN: NavLink[] = [
  { href: "/about", label: "Our Story" },
  { href: "/faq", label: "FAQs" },
];

/**
 * The main menu, in the order the founders' brief sets (REDESIGN-PLAN
 * decision 6): Home · Yoga & Garbhasanskar · Nutrition · Mom Community ·
 * Preloved Marketplace · Resources / Blog · Discounts / Exclusive Offers ·
 * About Us · Contact / Book a Session.
 *
 * The last one is not in this list: the header renders it as the highlighted
 * "Book a Session" button (BOOK_SESSION_HREF), so it stays visible next to the
 * account controls instead of competing with the eight links. Labels are the
 * short forms the brief allows ("Preloved", "Offers"), which is what lets all
 * eight fit on one line at 1280px.
 */
export const PRIMARY_NAV: readonly NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/yoga", label: "Yoga & Garbhasanskar" },
  { href: "/nutrition", label: "Nutrition" },
  { href: "/community", label: "Mom Community" },
  { href: "/preloved", label: "Preloved", children: PRELOVED_CHILDREN },
  { href: "/resources", label: "Resources", children: RESOURCES_CHILDREN },
  { href: "/offers", label: "Offers" },
  { href: "/about", label: "About", children: ABOUT_CHILDREN },
] as const;

/** Where every "Book a Session" button goes — the enquiry form and WhatsApp. */
export const BOOK_SESSION_HREF = "/contact";

/**
 * The brand's channels, resolved: the admin-edited SiteContent value when it
 * is set, the constants above when it isn't (or the API is unreachable). One
 * resolver so the footer, /about and anything else can't disagree about which
 * WhatsApp group "join the community" means.
 */
export interface SocialLinks {
  instagram: string;
  youtube: string;
  whatsappCommunity: string;
  whatsappPreloved: string;
}

export function resolveSocialLinks(
  content: {
    instagramUrl?: string | null;
    youtubeUrl?: string | null;
    whatsappCommunityUrl?: string | null;
    whatsappPrelovedUrl?: string | null;
  } | null,
): SocialLinks {
  return {
    instagram: content?.instagramUrl?.trim() || SOCIAL_LINKS.instagram,
    youtube: content?.youtubeUrl?.trim() || SOCIAL_LINKS.youtube,
    whatsappCommunity:
      content?.whatsappCommunityUrl?.trim() || WHATSAPP_COMMUNITY_URL,
    whatsappPreloved:
      content?.whatsappPrelovedUrl?.trim() || WHATSAPP_PRELOVED_URL,
  };
}

/**
 * Footer link columns. The social column is built at render time from
 * resolveSocialLinks(), because those URLs are admin-editable.
 */
export const FOOTER_COLUMNS: readonly { title: string; links: NavLink[] }[] = [
  {
    title: "Our services",
    links: [
      { href: "/yoga", label: "Yoga & Garbhasanskar" },
      { href: "/nutrition", label: "Nutrition" },
      { href: "/nutrition/starting-solids", label: "Starting Solids" },
      { href: "/community", label: "Mom Community" },
      { href: "/offers", label: "Offers" },
    ],
  },
  {
    title: "Preloved",
    links: [
      { href: "/listings", label: "Shop Preloved" },
      { href: "/preloved", label: "How It Works" },
      { href: "/sell", label: "Sell an Item" },
      { href: "/preloved/donate", label: "Donate an Item" },
      { href: "/wishlist", label: "Wishlist" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/faq", label: "FAQs" },
      { href: "/resources", label: "Free Guides" },
      { href: "/journal", label: "Blog" },
      { href: "/contact", label: "Contact Us" },
      { href: "/account", label: "My Account" },
    ],
  },
] as const;

export const LEGAL_LINKS: readonly NavLink[] = [
  { href: "/policies", label: "Policies" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/refunds", label: "Refunds" },
  { href: "/account-deletion", label: "Delete account" },
] as const;

/**
 * Every indexable static route, with the crawl hints `sitemap.ts` needs.
 *
 * Dynamic routes (listings, categories, journal posts) are fetched at build
 * time in `sitemap.ts` and are deliberately not listed here. Neither are the
 * three statutory pages — those enter the sitemap only once the BusinessProfile
 * is complete, which is a runtime condition, so they stay in `sitemap.ts`.
 */
export const STATIC_SITEMAP_ROUTES: readonly {
  path: string;
  changeFrequency: "daily" | "hourly" | "weekly" | "monthly" | "yearly";
  priority: number;
}[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/yoga", changeFrequency: "monthly", priority: 0.9 },
  { path: "/nutrition", changeFrequency: "monthly", priority: 0.9 },
  { path: "/nutrition/starting-solids", changeFrequency: "monthly", priority: 0.9 },
  { path: "/community", changeFrequency: "weekly", priority: 0.8 },
  { path: "/preloved", changeFrequency: "weekly", priority: 0.8 },
  { path: "/preloved/donate", changeFrequency: "monthly", priority: 0.6 },
  { path: "/listings", changeFrequency: "hourly", priority: 0.9 },
  { path: "/resources", changeFrequency: "monthly", priority: 0.7 },
  { path: "/journal", changeFrequency: "weekly", priority: 0.6 },
  { path: "/sell", changeFrequency: "monthly", priority: 0.5 },
  { path: "/offers", changeFrequency: "weekly", priority: 0.6 },
  { path: "/about", changeFrequency: "monthly", priority: 0.4 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.5 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.3 },
  { path: "/account-deletion", changeFrequency: "yearly", priority: 0.2 },
  // Not gated on the BusinessProfile: a plain-English guidelines hub, not a
  // statutory document, so it publishes regardless of the operator's details.
  { path: "/policies", changeFrequency: "yearly", priority: 0.3 },
] as const;
