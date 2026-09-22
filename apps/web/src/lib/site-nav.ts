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

export const PILLARS: readonly Pillar[] = [
  {
    key: "move",
    eyebrow: "Move",
    title: "Yoga & Garbhasanskar",
    href: "/yoga",
    blurb:
      "Prenatal, postnatal, Garbhasanskar and personalised sessions for every stage of pregnancy and recovery.",
    cta: "Explore Yoga",
  },
  {
    key: "nourish",
    eyebrow: "Nourish",
    title: "Maternal & Child Nutrition",
    href: "/nutrition",
    blurb:
      "Pregnancy, postpartum, starting solids, baby and toddler nutrition — practical and judgment-free.",
    cta: "Explore Nutrition",
  },
  {
    key: "connect",
    eyebrow: "Connect",
    title: "Mom Support Community",
    href: "/community",
    blurb:
      "A supportive space for pregnancy, postpartum, babies, toddlers and everything else mom life brings.",
    cta: "Join the Community",
  },
  {
    key: "pass-it-on",
    eyebrow: "Pass it on",
    title: "Preloved Marketplace",
    href: "/preloved",
    blurb:
      "Buy, sell or donate gently used baby and maternity essentials. Loved before, loved again.",
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
  { label: "I'm navigating toddlerhood", covers: "Nutrition · Activities · Resources", href: "/nutrition" },
  { label: "I need mom support", covers: "Community · Events · Expert sessions", href: "/community" },
  { label: "I want preloved", covers: "Buy · Sell · Donate", href: "/preloved" },
] as const;

export interface NavLink {
  href: string;
  label: string;
  placeholder?: boolean;
}

export interface NavItem extends NavLink {
  /** Rendered as a dropdown when present; the parent stays a real link. */
  children?: NavLink[];
}

/**
 * Category shortcuts under Preloved. These slugs are seeded categories — if one
 * is renamed the link 404s, so they are the same set the footer and the home
 * page rail already rely on rather than a new list to keep in step.
 */
const PRELOVED_CHILDREN: NavLink[] = [
  { href: "/preloved", label: "Why preloved" },
  { href: "/listings", label: "Shop all" },
  { href: "/categories/strollers", label: "Strollers" },
  { href: "/categories/baby-clothes", label: "Baby Clothes" },
  { href: "/categories/maternity-wear", label: "Maternity Wear" },
  { href: "/categories/toys", label: "Toys" },
  { href: "/sell", label: "Sell an item" },
];

export const PRIMARY_NAV: readonly NavItem[] = [
  { href: "/yoga", label: "Yoga" },
  { href: "/nutrition", label: "Nutrition" },
  { href: "/community", label: "Community" },
  { href: "/preloved", label: "Preloved", children: PRELOVED_CHILDREN },
  { href: "/about", label: "About" },
] as const;

export const FOOTER_COLUMNS: readonly { title: string; links: NavLink[] }[] = [
  {
    title: "Explore",
    links: [
      { href: "/yoga", label: "Yoga" },
      { href: "/nutrition", label: "Nutrition" },
      { href: "/nutrition/starting-solids", label: "Starting Solids" },
      { href: "/community", label: "Community" },
      { href: "/journal", label: "Journal" },
    ],
  },
  {
    title: "Marketplace",
    links: [
      { href: "/listings", label: "Shop all" },
      { href: "/categories/strollers", label: "Strollers" },
      { href: "/categories/maternity-wear", label: "Maternity" },
      { href: "/sell", label: "Sell an item" },
    ],
  },
  {
    title: "Your space",
    links: [
      { href: "/account", label: "My account" },
      { href: "/account/listings", label: "My listings" },
      { href: "/wishlist", label: "Wishlist" },
      { href: "/contact", label: "Contact us" },
    ],
  },
  {
    title: "Socials",
    links: [
      { href: "#", label: "Instagram · coming soon", placeholder: true },
      { href: "#", label: "Facebook · coming soon", placeholder: true },
      { href: "#", label: "YouTube · coming soon", placeholder: true },
    ],
  },
] as const;

export const LEGAL_LINKS: readonly NavLink[] = [
  { href: "/policies", label: "Policies" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/refunds", label: "Refunds" },
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
  { path: "/listings", changeFrequency: "hourly", priority: 0.9 },
  { path: "/journal", changeFrequency: "weekly", priority: 0.6 },
  { path: "/sell", changeFrequency: "monthly", priority: 0.5 },
  { path: "/about", changeFrequency: "monthly", priority: 0.4 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.3 },
  // Not gated on the BusinessProfile: a plain-English guidelines hub, not a
  // statutory document, so it publishes regardless of the operator's details.
  { path: "/policies", changeFrequency: "yearly", priority: 0.3 },
] as const;
