import type { OfficialCategoryConfig } from './types';
import { questLog } from './quest-log';
import { altadorCup, festivalOfNeggs } from './events';
import { adventCalendar, dailies, stamps } from './fallback';

/** Registry order = order in sitemaps and other listings. */
const categories: OfficialCategoryConfig[] = [
  dailies,
  adventCalendar,
  altadorCup,
  festivalOfNeggs,
  questLog,
  stamps,
];

export const officialCategories: Record<string, OfficialCategoryConfig> = Object.fromEntries(
  categories.map((c) => [c.slug, c])
);

export const officialCategorySlugs = categories.map((c) => c.slug);

/**
 * Single-segment paths under `/lists/official/` that can never be a category or an official
 * list slug. `cat` is the legacy `/lists/official/cat/<slug>` route (now a redirect).
 */
export const RESERVED_OFFICIAL_SLUGS = ['cat'];

export function getOfficialCategory(slug: string): OfficialCategoryConfig | null {
  return officialCategories[slug.toLowerCase()] ?? null;
}

/** Category whose `tags` include this `official_tag` (case-insensitive). */
export function getOfficialCategoryByTag(tag: string): OfficialCategoryConfig | null {
  const lower = tag.trim().toLowerCase();
  return categories.find((c) => c.tags.some((t) => t.toLowerCase() === lower)) ?? null;
}

export type { OfficialCategoryConfig } from './types';
