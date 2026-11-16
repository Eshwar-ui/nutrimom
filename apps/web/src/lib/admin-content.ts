import type { ZodError } from "zod";
import { ApiError } from "./api";

// Small helpers shared by the admin content editors (services, offers, FAQs,
// testimonials, site content). Client-side; nothing here talks to the API.

/** Field path → first message, e.g. { "founders.0.name": "Enter the founder's name" }. */
export type FormIssues = Record<string, string>;

/**
 * Flattens a Zod error into one message per field. Nested paths are joined
 * with "." so the site-content editor can mark `founders.2.bio` on the third
 * founder's card. A refine without a path lands on "form".
 */
export function zodIssues(error: ZodError): FormIssues {
  const out: FormIssues = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join(".") : "form";
    out[key] ??= issue.message;
  }
  return out;
}

/**
 * The per-field messages from an API 400. The validation pipe answers
 * `{ message: "Validation failed", errors: { fieldErrors } }` — the useful
 * words are in fieldErrors, so surface those instead of the generic headline.
 */
export function apiIssues(err: unknown): FormIssues {
  if (!(err instanceof ApiError)) return {};
  const body = err.body as
    | { errors?: { fieldErrors?: Record<string, string[] | undefined>; formErrors?: string[] } }
    | undefined;
  const out: FormIssues = {};
  for (const [key, messages] of Object.entries(body?.errors?.fieldErrors ?? {})) {
    if (messages?.[0]) out[key] = messages[0];
  }
  if (body?.errors?.formErrors?.[0]) out.form = body.errors.formErrors[0];
  return out;
}

/** A message fit for a toast: the API's own words when it sent any. */
export function errorMessage(err: unknown, fallback: string): string {
  if (!(err instanceof ApiError)) return fallback;
  const issues = apiIssues(err);
  const first = Object.values(issues)[0];
  if (err.status === 400 && first) return first;
  return err.message || fallback;
}

/**
 * Rupees typed by the admin → integer paise. Blank → null (an optional price
 * was left empty); anything unparseable → NaN, which the shared schema then
 * rejects with its own message rather than this silently guessing.
 */
export function rupeesToPaise(value: string): number | null {
  const trimmed = value.replace(/[,₹\s]/g, "");
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? Math.round(n * 100) : Number.NaN;
}

/** Integer paise → the rupee string shown in a price input ("1499", "1499.5"). */
export function paiseToRupees(paise: number | null | undefined): string {
  if (paise == null) return "";
  return String(paise / 100);
}

/** A whole-number input → number, or null when blank. */
export function optionalInt(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : Number.NaN;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO → the "YYYY-MM-DDTHH:mm" a datetime-local input wants, in local time. */
export function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** A datetime-local value (local time) → ISO, or "" when blank. */
export function localInputToIso(value: string): string {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toISOString();
}

/** e.g. "31 Dec 2026, 11:59 pm" — how expiry dates read in the admin lists. */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** True when an ISO date is set and already in the past. */
export function isPast(iso: string | null | undefined, now = new Date()): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return !Number.isNaN(t) && t <= now.getTime();
}
