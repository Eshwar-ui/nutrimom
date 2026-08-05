import { revalidatePath } from "next/cache";
import { API_URL } from "@/lib/api";

/**
 * Purges the cached public blog pages after an admin changes a post.
 *
 * The public blog reads go through `revalidate: 60` (lib/blog.ts), so without
 * this a publish took up to a minute to appear — and, worse, an unpublish or a
 * delete left the post readable for that long. Blog posts only ever change
 * through an admin acting in the browser, so the admin client calls this right
 * after a successful mutation.
 *
 * Gated on the caller's own admin token rather than a shared secret: the
 * trigger runs in the browser, where a secret would be readable by anyone.
 */
export async function POST(request: Request): Promise<Response> {
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return Response.json({ revalidated: false }, { status: 401 });
  }

  // Cheapest admin-only endpoint there is — a non-admin gets 401/403 here and
  // never reaches the purge.
  const check = await fetch(`${API_URL}/admin/blog`, {
    headers: { authorization },
    cache: "no-store",
  }).catch(() => null);

  if (!check || !check.ok) {
    return Response.json({ revalidated: false }, { status: check?.status ?? 502 });
  }

  revalidatePath("/blog");
  revalidatePath("/blog/[slug]", "page");
  revalidatePath("/sitemap.xml");

  return Response.json({ revalidated: true });
}
