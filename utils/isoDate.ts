/**
 * WordPress *_gmt fields often omit `Z`; treat naive datetimes as UTC.
 * Drops milliseconds — Google examples use seconds precision only.
 */
export function toIso8601Utc(value: string | Date): string | undefined {
  const date =
    value instanceof Date
      ? value
      : new Date(/T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(value) ? `${value}Z` : value);

  if (Number.isNaN(date.getTime())) return undefined;

  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}
