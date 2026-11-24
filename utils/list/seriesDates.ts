/**
 * Series dates of lists and list items (`seriesStart` / `seriesEnd`). Everything here works with
 * calendar days (`YYYY-MM-DD`, like date inputs); rows store them at 18:00 UTC.
 */
import { UTCDate } from '@date-fns/utc';

export const MIN_SERIES_DATE = '1990-01-01';
export const MAX_SERIES_DATE = '2100-12-31';

/** Calendar day of a stored date or date input value; `null` when empty. */
export function seriesDay(value: string | null | undefined): string | null {
  return value?.split('T')[0] || null;
}

/** A real calendar day between `MIN_SERIES_DATE` and `MAX_SERIES_DATE`. */
export function isValidSeriesDay(day: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  if (day < MIN_SERIES_DATE || day > MAX_SERIES_DATE) return false;

  // days like Feb 30 roll over to the next month
  const date = new Date(`${day}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(day);
}

/** For date inputs: empty is fine, anything else must be a valid series day. */
export function isSeriesDateInputValid(value: string | null | undefined): boolean {
  const day = seriesDay(value);
  return day === null || isValidSeriesDay(day);
}

/** How a series day is stored. */
export const seriesDayToDate = (day: string): Date => new UTCDate(new UTCDate(day).setHours(18));

export type SeriesDays = { seriesStart: string | null; seriesEnd: string | null };

/** A date left out is not changed; `null` clears it. */
export type SeriesDatesChange = Partial<SeriesDays> & {
  /** `false` only fills empty dates (each one on its own). */
  overwrite: boolean;
};

/** The days of a row after `change`. */
export function applySeriesDatesChange(row: SeriesDays, change: SeriesDatesChange): SeriesDays {
  const current = { seriesStart: seriesDay(row.seriesStart), seriesEnd: seriesDay(row.seriesEnd) };

  const next = (field: keyof SeriesDays) => {
    const value = change[field];
    if (value === undefined) return current[field];
    return change.overwrite || !current[field] ? value : current[field];
  };

  return { seriesStart: next('seriesStart'), seriesEnd: next('seriesEnd') };
}

export type SeriesDatesPlan<T> = {
  changed: (SeriesDays & { row: T })[];
  /** Rows that would end before they start. */
  invalid: T[];
};

/** Rows `change` would really update, with their new days. */
export function planSeriesDatesChange<T extends SeriesDays>(
  rows: T[],
  change: SeriesDatesChange
): SeriesDatesPlan<T> {
  const plan: SeriesDatesPlan<T> = { changed: [], invalid: [] };

  for (const row of rows) {
    const next = applySeriesDatesChange(row, change);
    const isSame =
      next.seriesStart === seriesDay(row.seriesStart) &&
      next.seriesEnd === seriesDay(row.seriesEnd);
    if (isSame) continue;

    if (next.seriesStart && next.seriesEnd && next.seriesEnd < next.seriesStart) {
      plan.invalid.push(row);
    } else {
      plan.changed.push({ row, ...next });
    }
  }

  return plan;
}
