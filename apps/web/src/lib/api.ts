import type { AuthTokens } from "@nutrimom/shared";
import { useAuthStore } from "./auth-store";
import { loginHref } from "./auth-redirect";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:1133";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string;
  /** Server-component caching (ignored on the client). */
  cache?: RequestCache;
  revalidate?: number;
}

/** Low-level fetch -> JSON. Usable on both server and client. Throws ApiError. */
export async function request<T>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: opts.method ?? "GET",
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      cache: opts.cache,
      next: opts.revalidate !== undefined ? { revalidate: opts.revalidate } : undefined,
    });
  } catch (err) {
    throw new ApiError(
      0,
      process.env.NODE_ENV === "development"
        ? `Cannot reach API at ${API_URL}. Start the API server and database, then try again.`
        : "We're having trouble connecting right now. Please try again in a moment.",
      err,
    );
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : res.statusText) || "Request failed";
    throw new ApiError(res.status, message, data);
  }
  return data as T;
}

export const SESSION_EXPIRED_MESSAGE = "Your session expired — please sign in again";

// One refresh at a time: a page that fires several requests with a stale
// token shares a single /auth/refresh instead of racing N of them.
let refreshInFlight: Promise<AuthTokens> | null = null;
// Set once the session has been declared over, so N failing requests produce
// one logout, one toast and one redirect.
let sessionEnding = false;

function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  refreshInFlight ??= request<AuthTokens>("/auth/refresh", {
    method: "POST",
    body: { refreshToken },
  }).finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

/**
 * The refresh endpoint answered and refused the token (expired, revoked,
 * malformed, user gone). A network failure (status 0), a rate limit (429) or
 * a 5xx says nothing about the session, so those must not sign anyone out.
 */
function isSessionRejection(err: unknown): boolean {
  return err instanceof ApiError && [400, 401, 403].includes(err.status);
}

/**
 * Ends a session the server no longer accepts: clears it, tells the user, and
 * sends them to sign in with a way back to where they were. Client-only and
 * idempotent. On /login or /register it clears the session in place instead
 * of redirecting — the user is already where they need to be.
 */
function endExpiredSession() {
  if (typeof window === "undefined" || sessionEnding) return;
  // Concurrent requests that shared the refused refresh: the first one has
  // already signed out, so the rest have nothing left to end.
  if (!useAuthStore.getState().tokens) return;
  sessionEnding = true;
  const { pathname, search } = window.location;
  const onAuthPage = pathname === "/login" || pathname === "/register";
  useAuthStore.getState().logout({
    redirectTo: onAuthPage ? null : loginHref(pathname + search),
    notice: { message: SESSION_EXPIRED_MESSAGE, variant: "info" },
  });
  // Only reachable without a navigation; the session is already gone.
  if (onAuthPage) sessionEnding = false;
}

/**
 * Runs an authenticated call; on a 401 refreshes once (shared across
 * concurrent callers) and retries. If the refresh is refused the session is
 * over: see `endExpiredSession`. The caller still gets an error, worded for
 * the user, for the moment before the page navigates away.
 */
async function withRefresh<T>(call: (token: string | undefined) => Promise<T>): Promise<T> {
  const store = useAuthStore.getState();
  try {
    return await call(store.tokens?.accessToken);
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401 || !store.tokens) {
      throw err;
    }
    let refreshed: AuthTokens;
    try {
      refreshed = await refreshTokens(store.tokens.refreshToken);
    } catch (refreshErr) {
      if (!isSessionRejection(refreshErr)) throw err;
      endExpiredSession();
      throw new ApiError(401, SESSION_EXPIRED_MESSAGE, err.body);
    }
    useAuthStore.getState().setTokens(refreshed);
    return call(refreshed.accessToken);
  }
}

/**
 * Authenticated client request with transparent refresh: if the access token
 * has expired (401), refresh once and retry before giving up.
 */
export async function authedRequest<T>(
  path: string,
  opts: Omit<RequestOptions, "token"> = {},
): Promise<T> {
  return withRefresh((token) => request<T>(path, { ...opts, token }));
}

export async function authedFormRequest<T>(
  path: string,
  formData: FormData,
  method = "POST",
): Promise<T> {
  return withRefresh((token) => formRequest<T>(path, formData, method, token));
}

/**
 * Authenticated multipart upload of a single file, with the same one-shot
 * refresh-and-retry as authedRequest. Content-Type is left unset so the browser
 * writes the multipart boundary itself.
 */
export async function authedUpload<T>(path: string, file: File): Promise<T> {
  const formData = new FormData();
  formData.append("file", file);
  return authedFormRequest<T>(path, formData);
}

async function formRequest<T>(
  path: string,
  formData: FormData,
  method: string,
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: formData,
    });
  } catch (err) {
    throw new ApiError(
      0,
      process.env.NODE_ENV === "development"
        ? `Cannot reach API at ${API_URL}. Start the API server and database, then try again.`
        : "We're having trouble connecting right now. Please try again in a moment.",
      err,
    );
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : res.statusText) || "Request failed";
    throw new ApiError(res.status, message, data);
  }
  return data as T;
}
