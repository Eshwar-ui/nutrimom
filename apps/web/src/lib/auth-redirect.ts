/**
 * Where to send someone after they sign in, and what to do when they get there.
 *
 * `?next=` is attacker-controllable (anyone can mail a victim a login link), so
 * it is only ever used through `safeNextPath`, which accepts a same-origin
 * relative path and nothing else. `?intent=` names a gated action to resume
 * on that page ("save" the listing, "contact" its seller) and is only honoured
 * from a fixed allowlist.
 *
 * Pure functions, no React and no `window`, so they run in tests and on the
 * server alike.
 */

/** Gated actions that can be resumed after login. Extend deliberately. */
export const AUTH_INTENTS = ["save", "contact"] as const;
export type AuthIntent = (typeof AUTH_INTENTS)[number];

/** The query parameter that carries an intent, on /login, /register and the target page. */
export const INTENT_PARAM = "intent";

/** Pages a post-login redirect must never land on: they would just loop. */
const AUTH_PAGES = new Set(["/login", "/register"]);

// A throwaway origin to resolve against. Anything that resolves anywhere else
// was absolute or protocol-relative, whatever it looked like as a string.
const PROBE_ORIGIN = "https://same-origin.invalid";

/**
 * Returns `raw` as a same-origin path (`/listings/abc?x=1#y`), or null if it
 * is anything else: absolute (`https://evil.example`), protocol-relative
 * (`//evil.example`, `/\evil.example`), scheme-bearing (`javascript:…`),
 * containing control characters or backslashes (browsers strip or rewrite
 * those, so `/\t/evil.example` can become `//evil.example`), oversized, or
 * pointing back at /login or /register.
 */
export function safeNextPath(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  if (raw.length === 0 || raw.length > 2048) return null;
  if (raw[0] !== "/") return null;
  if (raw[1] === "/" || raw[1] === "\\") return null;
  if (/[\u0000-\u001F\u007F\\]/.test(raw)) return null;

  let url: URL;
  try {
    url = new URL(raw, PROBE_ORIGIN);
  } catch {
    return null;
  }
  if (url.origin !== PROBE_ORIGIN) return null;
  if (AUTH_PAGES.has(url.pathname)) return null;
  return `${url.pathname}${url.search}${url.hash}`;
}

/** `raw` if it is an allowlisted intent, otherwise null. */
export function parseAuthIntent(raw: string | null | undefined): AuthIntent | null {
  return (AUTH_INTENTS as readonly string[]).includes(raw ?? "")
    ? (raw as AuthIntent)
    : null;
}

/** `/login?next=…&intent=…` — the one place a sign-in link is built. */
export function loginHref(next?: string | null, intent?: AuthIntent | null): string {
  return authPageHref("/login", next, intent);
}

/** `/register?next=…&intent=…`, for the "create an account" link on /login. */
export function registerHref(next?: string | null, intent?: AuthIntent | null): string {
  return authPageHref("/register", next, intent);
}

function authPageHref(
  page: "/login" | "/register",
  next?: string | null,
  intent?: AuthIntent | null,
): string {
  const safe = safeNextPath(next);
  if (!safe) return page;
  const params = new URLSearchParams({ next: safe });
  const ok = parseAuthIntent(intent);
  if (ok) params.set(INTENT_PARAM, ok);
  return `${page}?${params.toString()}`;
}

/** Reads the validated `next` and `intent` off a login/register query string. */
export function readAuthReturn(search: string): {
  next: string | null;
  intent: AuthIntent | null;
} {
  const params = new URLSearchParams(search);
  const next = safeNextPath(params.get("next"));
  // An intent only means something on the page it was raised from.
  const intent = next ? parseAuthIntent(params.get(INTENT_PARAM)) : null;
  return { next, intent };
}

/**
 * Where to go after signing in: `next` with the intent appended (replacing any
 * intent already on it), or `fallback` when there is no safe `next`.
 */
export function postAuthDestination(
  next: string | null,
  intent: AuthIntent | null,
  fallback: string,
): string {
  const safe = safeNextPath(next);
  if (!safe) return fallback;
  if (!intent) return safe;
  const url = new URL(safe, PROBE_ORIGIN);
  url.searchParams.set(INTENT_PARAM, intent);
  return `${url.pathname}${url.search}${url.hash}`;
}

/**
 * Splits the intent off a page's own query string: the intent to run (if it
 * is allowlisted) and the URL to replace the current one with, minus the
 * parameter, so the action can't re-run on refresh or Back.
 */
export function takeIntentFromUrl(
  pathname: string,
  search: string,
  hash = "",
): { intent: AuthIntent | null; cleanUrl: string | null } {
  const params = new URLSearchParams(search);
  if (!params.has(INTENT_PARAM)) return { intent: null, cleanUrl: null };
  const intent = parseAuthIntent(params.get(INTENT_PARAM));
  params.delete(INTENT_PARAM);
  const rest = params.toString();
  return { intent, cleanUrl: `${pathname}${rest ? `?${rest}` : ""}${hash}` };
}
