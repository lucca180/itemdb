import 'server-only';

import { cache } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { notFound, permanentRedirect } from 'next/navigation';
import { getSimilarLists } from '@pages/api/v1/lists/[username]/[list_id]/similar';
import { getListMatchWithViewer } from '@pages/api/v1/lists/match/[...usernames]';
import { getSearchStats } from '@pages/api/v1/search/stats';
import { ListService } from '@services/ListService';
import type { ItemData, ListItemInfo, SearchFilters, SearchStats, UserList } from '@types';
import { listItemsTag } from '@utils/appCacheTags';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import { withLocalePrefix, type AppLocale } from '@utils/locales';
import {
  getSortedListItemInfo,
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
  items: Record<string, ItemData>,
  list: UserList
): ListItemsData {
  const { itemMap, infoIds } = getSortedListItemInfo(itemInfo, list, items);

  return { itemMap, infoIds, itemInfo, items };
}

function emptyListItemsData(): ListItemsData {
  return { itemMap: {}, infoIds: [], itemInfo: [], items: {} };
}

async function fetchListPreload(core: ListCore): Promise<ListItemsData> {
  'use cache';
  const { list, viewer } = core;
  const username = list.official ? 'official' : (list.owner.username ?? '');
  cacheTag(listItemsTag(username, list.internal_id, 'preload'));
  cacheLife('homeSection');

  const listService = ListService.initUser(viewer);
  const preloadData = await listService.preloadListItems({ list, limit: LIST_PRELOAD_LIMIT });

  if (!preloadData) return emptyListItemsData();

  return buildListItemsData(preloadData.items, preloadData.itemData, list);
}

export const getListPreload = cache(fetchListPreload);

async function fetchListFullItems(core: ListCore): Promise<ListItemsData> {
  'use cache';
  const { list, viewer, isOwner } = core;
  const username = list.official ? 'official' : (list.owner.username ?? '');
  const scope = isOwner || viewer?.isAdmin ? 'full-owner' : 'full';
  cacheTag(listItemsTag(username, list.internal_id, scope));
  cacheLife('homeSection');

  const listService = ListService.initUser(viewer);
  const [itemInfoData, itemData] = await Promise.all([
    listService.getListItemInfo({
      list,
      username,
      list_id_or_slug: list.internal_id,
    }),
    listService.getListItems({
      list,
      username,
      list_id_or_slug: list.internal_id,
      asObject: true,
    }),
  ]);

  if (!itemInfoData || !itemData) return emptyListItemsData();

  return buildListItemsData(itemInfoData, itemData, list);
}

export const getListFullItems = cache(fetchListFullItems);

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

  const itemData =
    (await listService.getListItems({
      list,
      username,
      list_id_or_slug: list.internal_id,
      asObject: true,
    })) ?? {};

  return buildListItemsData(itemInfoData, itemData, list);
}
