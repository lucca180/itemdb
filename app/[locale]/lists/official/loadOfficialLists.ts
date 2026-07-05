import { cache } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { ListService } from '@services/ListService';
import { getTrendingLists } from '@pages/api/v1/beta/trending';
import { UserList } from '@types';
import { fitCacheTag } from '@utils/appCacheTags';
import { listCategoriesData, sortOfficialLists } from '@utils/lists/listCategoriesData';

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

async function loadOfficialListsCatDataCached(category: string) {
  'use cache';
  cacheTag(OFFICIAL_LISTS_CACHE_TAG);
  cacheTag(fitCacheTag(`${OFFICIAL_LISTS_CACHE_TAG}-${category}`));
  cacheLife('homeSection');

  const catInfo = listCategoriesData[category];
  if (!catInfo) return null;

  const listService = ListService.init();
  const lists = (await listService.getOfficialListsCat(catInfo.id.toLowerCase(), 3000)).sort(
    (a, b) => sortOfficialLists(a, b, catInfo.featured)
  );

  return { lists, catInfo };
}

export const loadOfficialListsCatData = cache(loadOfficialListsCatDataCached);
