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
  blog: ["/blog", "/sitemap.xml"],
  // The legal pages read the BusinessProfile server-side to decide whether
  // they may be indexed at all, so filling it in has to reach them promptly —
  // otherwise the operator saves their details and the pages still say
  // "pre-launch draft".
  legal: ["/terms", "/privacy", "/refunds", "/policies"],
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
  if (scope === "blog") revalidatePath("/blog/[slug]", "page");

  return Response.json({ revalidated: true, scope });
}
