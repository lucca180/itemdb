import { cache } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { Prisma } from '@prisma/generated/client';
import prisma from '@utils/prisma';
import { ListService } from '@services/ListService';
import { getTrendingLists } from '@pages/api/v1/beta/trending';
import { getUmamiPathPageviews } from '@services/item/trendingItems';
import type { UserList, WP_Article } from '@types';
import { fitCacheTag } from '@utils/appCacheTags';
import { wp_getBySlug } from '@pages/api/wp/posts/[slug]';
import { getOfficialCategory } from '@app/[locale]/lists/official/_categories';
import { matches } from '@app/[locale]/lists/official/_categories/resolve';
import { stamps, type StampAlbums } from '@app/[locale]/lists/official/_categories/stamps';
import { isGoalCollectionSlug } from '@utils/goalCounter/collections';
import { toAvatarUrl } from '@utils/goalCounter/stampGoalData';

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

  const listService = ListService.init();
  const byTag = await listService.getOfficialListsCat(category.tags.join(','), 3000);
  if (!category.lists) return byTag;

  const seen = new Set(byTag.map((l) => l.internal_id));
  const all = await listService.getUserLists({ username: 'official', limit: -1 });
  const extra = all.filter((l) => !seen.has(l.internal_id) && matches(l, category.lists));
  return [...byTag, ...extra].sort((a, b) => a.name.localeCompare(b.name));
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

/**
 * Cost and avatar of every Stamp Album page (official `stamps` lists that aren't a goal
 * collection such as All Collectibles). Cost = current NP price x amount of the visible items,
 * same as the list page; NC items are left out.
 */
async function loadStampAlbumsCached(): Promise<StampAlbums> {
  'use cache';
  cacheTag(OFFICIAL_LISTS_CACHE_TAG);
  cacheTag(`${OFFICIAL_LISTS_CACHE_TAG}-stamps-albums`);
  cacheLife('hours');

  const lists = await loadOfficialCategoryLists(stamps.slug);
  const ids = lists.filter((l) => !isGoalCollectionSlug(l.slug)).map((l) => l.internal_id);
  if (!ids.length) return {};

  const [costs, avatars] = await Promise.all([
    prisma.$queryRaw<{ list_id: number; cost: unknown; unpriced: unknown }[]>`
      SELECT li.list_id,
        SUM(CASE WHEN i.type <> 'nc' THEN p.price * li.amount ELSE 0 END) AS cost,
        SUM(i.type <> 'nc' AND p.price IS NULL AND i.status = 'active') AS unpriced
      FROM ListItems li
      JOIN Items i ON i.internal_id = li.item_iid
      LEFT JOIN ItemPrices p ON p.item_iid = li.item_iid AND p.isLatest = 1
      WHERE li.isHidden = 0 AND li.list_id IN (${Prisma.join(ids)})
      GROUP BY li.list_id
    `,
    prisma.avatarSolution.findMany({
      where: { list_id: { in: ids } },
      orderBy: { internal_id: 'asc' },
      select: { list_id: true, image: true },
    }),
  ]);

  const albums: StampAlbums = Object.fromEntries(
    ids.map((id) => [id, { cost: 0, unpriced: 0, avatar: null }])
  );
  for (const row of costs) {
    albums[row.list_id].cost = Number(row.cost ?? 0);
    albums[row.list_id].unpriced = Number(row.unpriced ?? 0);
  }
  for (const avy of avatars) {
    const album = avy.list_id ? albums[avy.list_id] : undefined;
    if (album && !album.avatar) album.avatar = toAvatarUrl(avy.image);
  }
  return albums;
}

export const loadStampAlbums = cache(loadStampAlbumsCached);
