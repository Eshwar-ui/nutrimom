import { revalidatePath } from "next/cache";
import { API_URL } from "@/lib/api";

/**
 * Purges cached public pages after an admin changes the data behind them.
 *
 * Public reads go through `revalidate` windows (60s for the blog and the
 * business profile, 20s for listings), so without this a change took up to a
 * minute to appear — and for an unpublish or a delete, the old content stayed
 * readable for that long. All of this data only ever changes through an admin
 * acting in the browser, so the admin client calls this after a successful
 * save.
 *
 * Gated on the caller's own admin token rather than a shared secret: the
 * trigger runs in the browser, where a secret would be readable by anyone.
 */
const SCOPES = {
  blog: ["/journal", "/sitemap.xml"],
  // The legal pages read the BusinessProfile server-side to decide whether
  // they may be indexed at all, so filling it in has to reach them promptly —
  // otherwise the operator saves their details and the pages still say
  // "pre-launch draft". The sitemap gates those three URLs on the same
  // condition, so it has to be purged with them or it would keep advertising
  // (or keep omitting) the wrong set.
  // /faq and /preloved quote the live cancellation window, refund share and
  // dispute window, and /about prints the BusinessProfile's support email and
  // phone — all saved from /admin/settings under this scope.
  legal: [
    "/terms",
    "/privacy",
    "/refunds",
    "/policies",
    "/sitemap.xml",
    "/faq",
    "/preloved",
    "/about",
  ],
  // Service packages and prices. The home page shows featured prices; /faq
  // carries the session-policy answers that sit beside the price grid;
  // /contact shows the price of the package an Enquire button sent you about.
  services: [
    "/",
    "/yoga",
    "/nutrition",
    "/nutrition/starting-solids",
    "/faq",
    "/contact",
  ],
  // Partner offers. Expired ones are filtered by the API at read time, so a
  // purge is only needed for admin edits, not for an offer lapsing.
  offers: ["/offers", "/"],
  // The service pages each render their own FAQ section beneath the prices.
  faqs: ["/faq", "/yoga", "/nutrition"],
  // SiteContent. The footer's social links come from it, so the root layout
  // is purged too (below) — every page renders that footer. The pages are
  // listed anyway so the scope documents what reads the content.
  content: ["/", "/about", "/community", "/preloved", "/contact"],
} as const;

type Scope = keyof typeof SCOPES;

const isScope = (v: unknown): v is Scope =>
  typeof v === "string" && v in SCOPES;

export async function POST(request: Request): Promise<Response> {
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return Response.json({ revalidated: false }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const scope = (body as { scope?: unknown } | null)?.scope;
  if (!isScope(scope)) {
    return Response.json(
      { revalidated: false, error: "Unknown scope" },
      { status: 400 },
    );
  }

  // Cheapest admin-only endpoint there is — a non-admin gets 401/403 here and
  // never reaches the purge.
  const check = await fetch(`${API_URL}/admin/blog`, {
    headers: { authorization },
    cache: "no-store",
  }).catch(() => null);

  if (!check || !check.ok) {
    return Response.json(
      { revalidated: false },
      { status: check?.status ?? 502 },
    );
  }

  for (const path of SCOPES[scope]) revalidatePath(path);
  // Dynamic segments need the route pattern plus an explicit type.
  if (scope === "blog") revalidatePath("/journal/[slug]", "page");
  // The root layout and everything beneath it: the footer's social links are
  // SiteContent, and they appear on every page.
  if (scope === "content") revalidatePath("/", "layout");

  return Response.json({ revalidated: true, scope });
}
