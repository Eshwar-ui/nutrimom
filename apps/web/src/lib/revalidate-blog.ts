import { useAuthStore } from "./auth-store";

/**
 * Purges the cached public blog pages after an admin mutation. Call it once a
 * create/update/publish/delete has succeeded — without it the public pages
 * serve a stale copy for up to `revalidate` seconds (lib/blog.ts), which for an
 * unpublish or a delete means the post stays readable after it was pulled.
 *
 * Client-only: it reads the signed-in admin's token, and lib/blog.ts is
 * imported by server components, so it lives here rather than alongside the
 * blog fetchers.
 *
 * Best-effort — a failure costs freshness, not correctness, so it never turns a
 * successful save into a visible error.
 */
export async function revalidateBlogPages(): Promise<void> {
  const token = useAuthStore.getState().tokens?.accessToken;
  if (!token) return;
  await fetch("/api/revalidate-blog", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => undefined);
}
