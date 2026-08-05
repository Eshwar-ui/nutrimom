import { useAuthStore } from "./auth-store";

/** Public page groups that an admin save can make stale. */
export type RevalidateScope = "blog" | "legal";

/**
 * Purges the cached public pages behind `scope` after an admin mutation. Call
 * it once a save has succeeded — without it those pages serve a stale copy for
 * the length of their `revalidate` window, which for an unpublish or a delete
 * means the old content stays readable after it was pulled.
 *
 * Client-only: it reads the signed-in admin's token, and the fetch helpers it
 * sits beside are imported by server components.
 *
 * Best-effort — a failure costs freshness, not correctness, so it never turns a
 * successful save into a visible error.
 */
export async function revalidatePublicPages(
  scope: RevalidateScope,
): Promise<void> {
  const token = useAuthStore.getState().tokens?.accessToken;
  if (!token) return;
  await fetch("/api/revalidate", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ scope }),
  }).catch(() => undefined);
}
