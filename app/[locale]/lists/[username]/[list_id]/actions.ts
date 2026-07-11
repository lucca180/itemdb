'use server';

import { updateTag } from 'next/cache';
import type { SearchFilters, SearchStats, UserList } from '@types';
import { defaultFilters, getFiltersDiff } from '@utils/parseFilters';
import { listMutationCacheTags } from '@utils/appCacheTags';
import { ListService } from '@services/ListService';
import { getFilteredListItems, getListCore, getListFullItems, getListStats } from './loadListPage';
import type { ListCore, ListItemsData } from './listPage';

function invalidateListMutationCaches(core: ListCore) {
  const username = core.list.official ? 'official' : (core.list.owner.username ?? '');
  for (const tag of listMutationCacheTags(username, core.list.internal_id)) {
    updateTag(tag);
  }
}

export async function loadListStats(
  locale: string,
  username: string,
  list_id: string
): Promise<SearchStats> {
  const core = await getListCore(locale, username, list_id);
  return getListStats(core);
}

export async function loadRemainingListItems(
  locale: string,
  username: string,
  list_id: string
): Promise<ListItemsData> {
  const core = await getListCore(locale, username, list_id);
  return getListFullItems(core);
}

export async function applyListFilters(
  locale: string,
  username: string,
  list_id: string,
  filters: SearchFilters
): Promise<ListItemsData> {
  const core = await getListCore(locale, username, list_id);
  const diff = getFiltersDiff(filters);
  const hasFilters = Object.keys(diff).length > 0;

  if (!hasFilters) {
    return getListFullItems(core);
  }

  return getFilteredListItems(core, { ...defaultFilters, ...diff });
}

export async function refreshListData(
  locale: string,
  username: string,
  list_id: string
): Promise<{ list: UserList; items: ListItemsData }> {
  const core = await getListCore(locale, username, list_id);
  invalidateListMutationCaches(core);

  const listService = ListService.initUser(core.viewer);
  const list =
    (await listService.getList({
      username,
      list_id_or_slug: list_id,
      isOfficial: username === 'official',
    })) ?? core.list;
  const items = await getListFullItems({ ...core, list });

  return { list, items };
}
