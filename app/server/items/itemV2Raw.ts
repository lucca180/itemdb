export type RawItemV2Row = Record<string, unknown>;

export function asNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'object' && 'toNumber' in value) {
    return (value as { toNumber(): number }).toNumber();
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

export function asJsonDate(value: unknown): string | null {
  if (value instanceof Date) return value.toJSON();
  if (typeof value !== 'string' && typeof value !== 'number') return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toJSON();
}
