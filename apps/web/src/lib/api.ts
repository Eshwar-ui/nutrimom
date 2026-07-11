import type { AuthTokens } from "@nutrimom/shared";
import { useAuthStore } from "./auth-store";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

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

/** Low-level fetch → JSON. Usable on both server and client. Throws ApiError. */
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
      `Cannot reach API at ${API_URL}. Start the API server and database, then try again.`,
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

/**
 * Authenticated client request with transparent refresh: if the access token
 * has expired (401), refresh once and retry before giving up.
 */
export async function authedRequest<T>(
  path: string,
  opts: Omit<RequestOptions, "token"> = {},
): Promise<T> {
  const store = useAuthStore.getState();
  const token = store.tokens?.accessToken;

  try {
    return await request<T>(path, { ...opts, token });
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401 || !store.tokens) {
      throw err;
    }
    // Try a single refresh, then retry the original request.
    let refreshed: AuthTokens;
    try {
      refreshed = await request<AuthTokens>("/auth/refresh", {
        method: "POST",
        body: { refreshToken: store.tokens.refreshToken },
      });
    } catch {
      store.logout();
      throw err;
    }
    useAuthStore.getState().setTokens(refreshed);
    return request<T>(path, { ...opts, token: refreshed.accessToken });
  }
}
