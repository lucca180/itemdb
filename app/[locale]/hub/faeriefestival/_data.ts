import { cacheLife, cacheTag } from 'next/cache';
import { getTrendingCatLists } from '@pages/api/v1/beta/trending';
import type { UserList } from '@types';

const EVENT_YEAR = 2026;

export async function loadFaerieFestivalLists(): Promise<UserList[]> {
  'use cache';
  cacheTag('hub-faeriefestival');
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });

  try {
    return (await getTrendingCatLists('Faerie Festival', 100)).filter(
      (list) => new Date(list.createdAt).getFullYear() === EVENT_YEAR
    );
  } catch {
    return [];
  }
}
