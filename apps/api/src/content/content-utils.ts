/**
 * Prisma's "record to update/delete does not exist". Only this code is turned
 * into a 404 — any other failure propagates, so an unrelated database fault is
 * never disguised as a missing row (the trap blog.service documents).
 */
export function isRecordNotFound(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: unknown }).code === 'P2025'
  );
}

/**
 * Admin forms send "" for a cleared optional field and the shared input
 * schemas accept it; the columns store null so "empty" has one spelling.
 */
export function blankToNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

/** "" / null / undefined → null, otherwise a Date from the ISO string. */
export function isoToDate(value: string | null | undefined): Date | null {
  const v = blankToNull(value);
  return v ? new Date(v) : null;
}
