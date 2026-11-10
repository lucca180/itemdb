import { listCategoriesData } from '@utils/lists/listCategoriesData';
import type { OfficialCategoryConfig } from './types';
import { questLog } from './quest-log';
import { altadorCup, festivalOfNeggs } from './events';

export const officialCategories: Record<string, OfficialCategoryConfig> = {
  [questLog.slug]: questLog,
  [festivalOfNeggs.slug]: festivalOfNeggs,
  [altadorCup.slug]: altadorCup,
};

/** DEMO: categories without a config yet get a single "All lists" group. */
export function getCategoryConfig(slug: string): OfficialCategoryConfig | null {
  if (officialCategories[slug]) return officialCategories[slug];
  const c = listCategoriesData[slug];
  if (!c) return null;
  return {
    slug,
    name: c.name,
    tags: [c.id],
    color: c.color,
    image: c.url,
    description: c.description,
    intro: [c.description],
    layout: { type: 'groups', groups: [] },
  };
}

export const demoCategorySlugs = Array.from(
  new Set([...Object.keys(officialCategories), ...Object.keys(listCategoriesData)])
);
