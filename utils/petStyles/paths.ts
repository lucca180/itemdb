import { petColorSlug } from '@utils/pet-utils';

export const STYLES_BASE_PATH = '/rainbow-pool/pet-styles' as const;

/** Page size for hub / browse token grids. */
export const PET_STYLES_PAGE_SIZE = 12;

/**
 * Sentinel colour for colour-agnostic Pet Styles (`color_id` null),
 * e.g. Essence / All-Star Essence — URL `/{species}/unknown`.
 */
export const UNKNOWN_COLOR_NAME = 'Unknown Colour' as const;
/** Canonical URL segment (short); also accept `unknown-colour`. */
export const UNKNOWN_COLOR_SLUG = 'unknown' as const;

export function isUnknownColorSlug(slug: string | null | undefined): boolean {
  const normalized = petColorSlug(slug ?? '');
  return normalized === UNKNOWN_COLOR_SLUG || normalized === petColorSlug(UNKNOWN_COLOR_NAME);
}

export function isUnknownColorName(name: string | null | undefined): boolean {
  return isUnknownColorSlug(name);
}

export function stylesComboHref(speciesName: string, colorName: string): `/${string}` {
  const colorSlug = isUnknownColorName(colorName) ? UNKNOWN_COLOR_SLUG : petColorSlug(colorName);
  return `${STYLES_BASE_PATH}/${petColorSlug(speciesName)}/${colorSlug}`;
}

export function stylesBrowseHref(name: string): `/${string}` {
  const slug = isUnknownColorName(name) ? UNKNOWN_COLOR_SLUG : petColorSlug(name);
  return `${STYLES_BASE_PATH}/${slug}`;
}

/** Colour-agnostic styles for a species (`/{species}/unknown`). */
export function stylesUnknownHref(speciesName: string): `/${string}` {
  return stylesComboHref(speciesName, UNKNOWN_COLOR_NAME);
}

/** Picker / filter colour lists including the Unknown Colour sentinel (styles UI only). */
export function withUnknownColorOption(colors: string[]): string[] {
  if (colors.some(isUnknownColorName)) return colors;
  return [...colors, UNKNOWN_COLOR_NAME].sort((a, b) => a.localeCompare(b));
}

/** Hub / browse filter query (`?series=&prismatic=1&available=1`). */
export function stylesFilterQuery(opts: {
  series?: string;
  includePrismatic?: boolean;
  availableNowOnly?: boolean;
}): string {
  const params = new URLSearchParams();
  if (opts.series) params.set('series', petColorSlug(opts.series));
  if (opts.includePrismatic) params.set('prismatic', '1');
  if (opts.availableNowOnly) params.set('available', '1');
  return params.toString();
}

/** Filter query plus `page` when > 1. */
export function stylesListQuery(opts: {
  series?: string;
  includePrismatic?: boolean;
  availableNowOnly?: boolean;
  page?: number;
}): string {
  const params = new URLSearchParams(stylesFilterQuery(opts));
  if (opts.page && opts.page > 1) params.set('page', String(opts.page));
  return params.toString();
}

export function withStylesQuery(href: `/${string}` | string, query: string): string {
  return query ? `${href}?${query}` : href;
}

export function parseStylesPage(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}
