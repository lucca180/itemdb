import 'server-only';

import { cache } from 'react';
import { cacheLife, cacheTag, io } from 'next/cache';
import { notFound, permanentRedirect } from 'next/navigation';
import { getSimilarLists } from '@pages/api/v1/lists/[username]/[list_id]/similar';
import { getListMatchWithViewer } from '@pages/api/v1/lists/match/[...usernames]';
import { getSearchStats } from '@pages/api/v1/search/stats';
import { ItemService } from '@services/ItemService';
import { ListService } from '@services/ListService';
import type { ItemV2For, ListItemInfo, SearchFilters, SearchStats, UserList } from '@types';
import { listItemsTag } from '@utils/appCacheTags';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import { withLocalePrefix, type AppLocale } from '@utils/locales';
import {
  getSortedListItemInfo,
  LIST_FULL_SERVER_LOAD_THRESHOLD,
  LIST_PRELOAD_LIMIT,
  type ListCore,
  type ListItemsData,
} from './listPage';

async function resolveListCore(
  locale: string,
  username: string,
  list_id: string
): Promise<ListCore> {
  const { user: viewer } = await getServerCurrentUser();
  // `getServerCurrentUser` only suspends for signed-in visitors. `getList` is an uncached
  // Prisma read (reads the clock) that may also sync/write, so it must wait for the
  // request instead of running in prerenders and runtime prefetches.
  await io();
  const listService = ListService.initUser(viewer);

  const isNum = /^\d+$/.test(list_id);
  const parsedId = !isNum ? undefined : parseInt(list_id, 10);
  const slug = isNum ? undefined : list_id;

  const list = await listService.getList({
    username,
    listId: parsedId,
    listSlug: slug,
  });

  if (!list) notFound();

  const appLocale = locale as AppLocale;

  if (list.dynamicType === 'search') {
    permanentRedirect(withLocalePrefix(`/search?list_id=${list.internal_id}`, appLocale));
  }

  if (parsedId && list.slug) {
    let actualUsername = username;
    if (list.official) actualUsername = 'official';
    permanentRedirect(withLocalePrefix(`/lists/${actualUsername}/${list.slug}`, appLocale));
  }

  if (list.official && username !== 'official') {
    permanentRedirect(
      withLocalePrefix(`/lists/official/${list.slug ?? list.internal_id}`, appLocale)
    );
  }

  const isOwner = !!(viewer && viewer.id === list.owner.id);
  const canEdit = !!(viewer && (viewer.id === list.owner.id || viewer.isAdmin));

  return { list, canEdit, isOwner, viewer };
}

export const getListCore = cache(resolveListCore);

function buildListItemsData(
  itemInfo: ListItemInfo[],
  items: Record<string, ItemV2For<'card'>>,
  list: UserList
): ListItemsData {
  const { itemMap, infoIds } = getSortedListItemInfo(itemInfo, list, items);

  return { itemMap, infoIds, itemInfo, items };
}

function emptyListItemsData(): ListItemsData {
  return { itemMap: {}, infoIds: [], itemInfo: [], items: {} };
}

/**
 * Card payloads for list rows — Prisma only, no Redis item/id cache.
 * (HTTP `/api/v2/...` owns Redis caching; RSC loaders stay uncached.)
 */
async function fetchCardItemsByIids(
  itemInfo: ListItemInfo[]
): Promise<Record<string, ItemV2For<'card'>>> {
  if (itemInfo.length === 0) return {};

  const ids = [...new Set(itemInfo.map((row) => String(row.item_iid)))];
  return ItemService.getManyItems(
    { type: 'id', data: ids },
    { intent: 'card', cached: false, limit: ids.length }
  );
}

/**
 * `'use cache'` loaders below take the list (+ a hidden-items flag), never `ListCore`:
 * every argument becomes part of the shared Redis key, so passing `viewer` would store
 * user data (email) in keys and duplicate multi-MB entries per viewer.
 */
async function fetchListPreload(list: UserList): Promise<ListItemsData> {
  'use cache';
  const username = list.official ? 'official' : (list.owner.username ?? '');
  cacheTag(listItemsTag(username, list.internal_id, 'preload'));
  cacheLife('homeSection');

  // Preload never includes hidden items, so it does not depend on the viewer.
  const preloadData = await ListService.init().preloadListItemsV2({
    list,
    limit: LIST_PRELOAD_LIMIT,
  });

  if (!preloadData) return emptyListItemsData();

  return buildListItemsData(preloadData.items, preloadData.itemData, list);
}

export const getListPreload = cache((core: ListCore) => fetchListPreload(core.list));

/** Owner/admin see hidden items — same rule as `ListService.canViewHiddenListItems`. */
function canViewHiddenItems(core: ListCore): boolean {
  return core.isOwner || !!core.viewer?.isAdmin;
}

async function loadListFullItems(list: UserList, includeHidden: boolean): Promise<ListItemsData> {
  // The list was already authorized for this viewer in `resolveListCore`.
  const itemInfoData = await ListService.getAllListItemInfo(list, includeHidden);
  if (!itemInfoData) return emptyListItemsData();

  const items = await fetchCardItemsByIids(itemInfoData);
  return buildListItemsData(itemInfoData, items, list);
}

async function fetchListFullItems(list: UserList, includeHidden: boolean): Promise<ListItemsData> {
  'use cache';
  const username = list.official ? 'official' : (list.owner.username ?? '');
  cacheTag(listItemsTag(username, list.internal_id, includeHidden ? 'full-owner' : 'full'));
  cacheLife('homeSection');

  return loadListFullItems(list, includeHidden);
}

export const getListFullItems = cache((core: ListCore) => {
  const includeHidden = canViewHiddenItems(core);

  // Large lists (tier 3, loaded by server action) skip `'use cache'`: their payload runs to
  // several MB, and reading/parsing it from the shared Redis cache blocks the event loop.
  if ((core.list.itemCount ?? 0) > LIST_FULL_SERVER_LOAD_THRESHOLD) {
    return loadListFullItems(core.list, includeHidden);
  }

  return fetchListFullItems(core.list, includeHidden);
});

export async function getListMatches(core: ListCore): Promise<ListItemInfo[]> {
  const { list, viewer, isOwner } = core;
  if (!viewer || list.purpose === 'none' || isOwner) return [];

  const seeker = list.purpose === 'seeking' ? list.owner.username! : (viewer.username ?? '');
  const offerer = list.purpose === 'trading' ? list.owner.username! : (viewer.username ?? '');

  try {
    return (await getListMatchWithViewer(
      seeker,
      offerer,
      viewer,
      list.internal_id
    )) as ListItemInfo[];
  } catch {
    return [];
  }
}

export async function getSimilarListsForList(list: UserList): Promise<UserList[]> {
  if (!list.official) return [];
  return getSimilarLists(list, 3);
}

export async function getListStats(core: ListCore) {
  const { list, viewer, isOwner } = core;

  return getSearchStats('', {
    list: {
      id: list.internal_id,
      includeHidden: isOwner || !!viewer?.isAdmin,
    },
  }) as Promise<SearchStats>;
}

export async function getFilteredListItems(
  core: ListCore,
  filters: SearchFilters
): Promise<ListItemsData> {
  const { list, viewer } = core;
  const username = list.official ? 'official' : (list.owner.username ?? '');
  const listService = ListService.initUser(viewer);

  const itemInfoData = await listService.getListItemInfo({
    list,
    username,
    list_id_or_slug: list.internal_id,
    searchFilters: { ...filters, limit: 100000 },
  });

  if (!itemInfoData) return emptyListItemsData();

  const items = await fetchCardItemsByIids(itemInfoData);
  return buildListItemsData(itemInfoData, items, list);
}
