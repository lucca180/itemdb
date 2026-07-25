/**
 * Coerce unknown input to a truncated integer within [min, max].
 * Non-finite values fall back to `fallback` (also clamped).
 */
export function normalizeInteger(
  value: unknown,
  fallback: number,
  min: number,
  max: number
): number {
  const parsed = Number(value);
  const base = Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
  return Math.min(Math.max(base, min), max);
}
