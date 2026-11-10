import { cache } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { ListService } from '@services/ListService';
import { getTrendingLists } from '@pages/api/v1/beta/trending';
import { getUmamiPathPageviews } from '@services/item/trendingItems';
import type { UserList, WP_Article } from '@types';
import { fitCacheTag } from '@utils/appCacheTags';
import { wp_getBySlug } from '@pages/api/wp/posts/[slug]';
import { getOfficialCategory } from '@app/[locale]/lists/official/_categories';

export const OFFICIAL_LISTS_CACHE_TAG = 'official-lists';

export function deriveOfficialListCategories(lists: UserList[]): string[] {
  const tags = lists
    .map((list) => list.officialTag[0] || 'Uncategorized')
    .sort((a, b) => a.localeCompare(b));

  return Array.from(new Set(tags).values());
}

async function loadOfficialTrendingListsCached() {
  'use cache';
  cacheTag(OFFICIAL_LISTS_CACHE_TAG);
  cacheTag(`${OFFICIAL_LISTS_CACHE_TAG}-trending`);
  cacheLife('homeSection');

  return getTrendingLists(9);
}

export const loadOfficialTrendingLists = cache(loadOfficialTrendingListsCached);

async function loadOfficialAllListsCached() {
  'use cache';
  cacheTag(OFFICIAL_LISTS_CACHE_TAG);
  cacheTag(`${OFFICIAL_LISTS_CACHE_TAG}-all`);
  cacheLife('homeSection');

  const listService = ListService.init();
  const allLists = await listService.getUserLists({ username: 'official', limit: -1 });

  return {
    allLists,
    categories: deriveOfficialListCategories(allLists),
  };
}

export const loadOfficialAllLists = cache(loadOfficialAllListsCached);

async function loadOfficialCategoryListsCached(slug: string): Promise<UserList[]> {
  'use cache';
  cacheTag(OFFICIAL_LISTS_CACHE_TAG);
  cacheTag(fitCacheTag(`${OFFICIAL_LISTS_CACHE_TAG}-${slug}`));
  cacheLife('homeSection');

  const category = getOfficialCategory(slug);
  if (!category) return [];

  return ListService.init().getOfficialListsCat(category.tags.join(','), 3000);
}

export const loadOfficialCategoryLists = cache(loadOfficialCategoryListsCached);

/** WordPress posts from the category's `relatedArticles`, in config order; missing ones are skipped. */
async function loadOfficialCategoryArticlesCached(slug: string): Promise<WP_Article[]> {
  'use cache';
  cacheTag(fitCacheTag(`${OFFICIAL_LISTS_CACHE_TAG}-${slug}-articles`));
  cacheLife('hours');

  const slugs = getOfficialCategory(slug)?.relatedArticles ?? [];
  const posts = await Promise.all(slugs.map((s) => wp_getBySlug(s).catch(() => null)));
  return posts.filter((p): p is WP_Article => !!p);
}

export const loadOfficialCategoryArticles = cache(loadOfficialCategoryArticlesCached);

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Umami pageviews of official list pages over the last 30 days, by list slug (locales summed).
 * Shared by every category; empty when Umami fails, so the page never depends on it.
 */
async function loadOfficialListPageviewsCached(): Promise<Record<string, number>> {
  'use cache';
  cacheTag(`${OFFICIAL_LISTS_CACHE_TAG}-pageviews`);
  cacheLife('hours');

  try {
    const views = await getUmamiPathPageviews('lists/official/', { windowMs: THIRTY_DAYS_MS });
    return Object.fromEntries([...views].map(([slug, n]) => [slug.toLowerCase(), n]));
  } catch {
    return {};
  }
}

export const loadOfficialListPageviews = cache(loadOfficialListPageviewsCached);
