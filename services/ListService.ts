import { ItemData, ItemIntent, SearchFilters, User, UserList } from '@types';
import { CheckAuth } from '@utils/googleCloud';
import prisma from '@utils/prisma';
import { NextApiRequest } from 'next';
import { syncDynamicList } from '../pages/api/v1/lists/[username]/[list_id]/dynamic';
import { createListSlug } from '../pages/api/v1/lists/[username]';
import { UserList as RawList } from '@prisma/generated/client';
import { doSearch } from '../pages/api/v1/search';
import { sortListItems } from '@utils/utils';
import { getManyItems } from '../pages/api/v1/items/many';
import { defaultFilters } from '@utils/parseFilters';
import { fillCount, fillCounts, updateCount } from '@services/list/listCount';
import {
  applyDynamicItemChanges,
  deleteItemsByInternalId,
  hideItems,
  moveOrCopyItems,
  removeItems,
  updateItems,
  upsertItems,
  type DynamicItemChanges,
  type PutListItemInput,
} from '@services/list/listItemsWrite';
import { rawToList, rawToListItems } from '@services/list/listMappers';
import { queryUserLists, type GetUserListsOptions } from '@services/list/userListsQuery';
import { fetchListItemsV2, type FetchListItemsV2Result } from '@services/list/listItemsV2';

export { rawToList, rawToListItems } from '@services/list/listMappers';
export type { PutListItemInput, DynamicItemChanges };

export class ListService {
  user: User | null = null;

  static updateItems = updateItems;
  static deleteItemsByInternalId = deleteItemsByInternalId;
  static moveOrCopyItems = moveOrCopyItems;
  static upsertItems = upsertItems;
  static hideItems = hideItems;
  static removeItems = removeItems;
  static applyDynamicItemChanges = applyDynamicItemChanges;

  static init() {
    return ListService.initUser(null);
  }

  static async initReq(request: NextApiRequest) {
    try {
      const user = (await CheckAuth(request)).user;
      return ListService.initUser(user);
    } catch (e) {
      return ListService.initUser(null);
    }
  }

  static async initUserOrToken(user_or_token: User | string | null) {
    let user = user_or_token as User | null;

    try {
      if (typeof user_or_token === 'string') {
        user = (await CheckAuth(null, user_or_token)).user;
      }
    } catch (e) {
      user = null;
    }

    return ListService.initUser(user);
  }

  static initUser(user: User | null) {
    const service = new ListService();
    service.user = user;
    return service;
  }

  async getList(params: GetListParams) {
    let { listId, listSlug, isOfficial, username, list_id_or_slug, skipSync } = params;

    isOfficial = isOfficial || username === 'official';

    if ((!listId && !listSlug && !list_id_or_slug) || !username) {
      throw new Error('Missing required parameters');
    }

    if (list_id_or_slug) {
      const res = toListIdAndSlug(list_id_or_slug);
      listId = res.listId;
      listSlug = res.listSlug;
    }

    const listRaw = await prisma.userList.findFirst({
      where: {
        internal_id: listId ? Number(listId) : undefined,
        slug: listSlug,
        official: isOfficial || undefined,
        user: {
          username: isOfficial ? undefined : username,
        },
      },
      include: {
        user: true,
      },
    });

    if (!listRaw || !ListService.canSeeList(listRaw, this.user)) return null;

    const didSync = !!(listRaw.dynamicType && !skipSync);
    if (didSync) await syncDynamicList(listRaw.internal_id);

    listRaw.visibleItemCount = didSync
      ? await updateCount(listRaw.internal_id)
      : await fillCount(listRaw);

    if (!listRaw.slug) {
      const slug = await createListSlug(listRaw.name, listRaw.user_id, listRaw.official);
      await prisma.userList.update({
        where: {
          internal_id: listRaw.internal_id,
        },
        data: {
          slug: slug,
        },
      });

      listRaw.slug = slug;
    }

    const list: UserList = rawToList(listRaw, listRaw.user);
    return list;
  }

  async getUserLists(params: GetUserListsParams) {
    return queryUserLists({
      ...params,
      viewerId: this.user?.id ?? null,
      fillItemCounts: fillCounts,
    });
  }

  async getOfficialListsCat(tag: string, limit = 15) {
    const lists = await this.getUserLists({
      username: 'official',
      limit: -1,
      officialTag: tag,
    });

    tag = tag.toLowerCase();

    const filteredLists = lists
      .filter((list) => {
        if (tag === 'uncategorized') return list.officialTag.length === 0;
        return list.officialTag.some((officialTag) => officialTag.toLowerCase() === tag);
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return filteredLists.splice(0, limit ?? 15);
  }

  static canSeeList(list: RawList, viewer: User | null) {
    if (list.visibility === 'public') return true;
    if (list.visibility === 'unlisted') return true;
    if (list.official) return true;
    if (viewer && list.user_id === viewer.id) return true;
    return false;
  }

  private canViewHiddenListItems(list: UserList): boolean {
    return !!(this.user && (this.user.id === list.owner.id || this.user.isAdmin));
  }

  // overloaded function signatures
  async getListItems(params: GetListItemsParams & { asObject?: false }): Promise<ItemData[] | null>;

  async getListItems(
    params: GetListItemsParams & { asObject: true }
  ): Promise<Record<string, ItemData> | null>;

  async getListItems(
    params: GetListItemsParams & { asObject: boolean }
  ): Promise<Record<string, ItemData> | ItemData[] | null>;

  async getListItems(params: GetListItemsParams & { asObject?: boolean }) {
    const list =
      params.list ?? (await this.getList({ ...params, skipSync: true } as GetListParams));
    if (!list || list.dynamicType === 'search') return null;

    const canViewHidden = this.canViewHiddenListItems(list);

    const filters = { ...defaultFilters, limit: 100000 };

    const queryRes = await doSearch('', filters, false, list.internal_id, canViewHidden);

    if (!params.asObject) return queryRes.content;

    const itemMap: { [key: string]: any } = {};
    queryRes.content.forEach((item) => {
      itemMap[item.internal_id] = item;
    });

    return itemMap;
  }

  /**
   * ItemV2 items for a list (v2 `itemdata`). Mirrors {@link getListItems}:
   * resolves/authorizes the list, skips dynamic search lists, and decides
   * hidden-item authorization here — the caller only owns HTTP concerns. Returns
   * `null` when the list is missing or not visible. `includeHidden` is an opt-in
   * request flag, still gated to the owner/admin. The resolved `list` is returned
   * so the route can pick the right `Cache-Control`.
   */
  async getListItemsV2<I extends ItemIntent = 'card'>(
    params: GetListItemsParams & {
      intent?: I;
      asObject?: boolean;
      includeHidden?: boolean;
      fresh?: boolean;
    }
  ): Promise<(FetchListItemsV2Result<I> & { list: UserList }) | null> {
    const list =
      params.list ?? (await this.getList({ ...params, skipSync: true } as GetListParams));
    if (!list || list.dynamicType === 'search') return null;

    // Opt-in flag, but hidden items are only ever exposed to the owner/admin.
    const includeHidden = !!params.includeHidden && this.canViewHiddenListItems(list);

    const result = await fetchListItemsV2(list, {
      includeHidden,
      intent: params.intent ?? ('card' as I),
      asObject: params.asObject ?? false,
      fresh: params.fresh ?? false,
    });

    return { ...result, list };
  }

  async getListItemInfo(params: GetListItemParams) {
    const { query, searchFilters } = params;
    const list =
      params.list ?? (await this.getList({ ...params, skipSync: true } as GetListParams));
    if (!list || list.dynamicType === 'search') return null;
    const canViewHidden = this.canViewHiddenListItems(list);

    const itemInfoRaw = await prisma.listItems.findMany({
      where: { list_id: list.internal_id },
    });

    const itemInfo = rawToListItems(itemInfoRaw);

    if (!query && Object.keys(searchFilters || {}).length === 0) {
      const result = itemInfo.filter((item) => !item.isHidden || canViewHidden);

      return result;
    }

    const queryRes = await doSearch(
      query ?? '',
      searchFilters,
      false,
      list.internal_id,
      canViewHidden
    );

    const itemIDs = new Set(queryRes.content.map((item) => item.internal_id));

    const result = itemInfo.filter(
      (item) => itemIDs.has(item.item_iid) && (!item.isHidden || canViewHidden)
    );

    return result;
  }

  /**
   * Used to preload list items for faster initial loading.
   * Does not return hidden items.
   **/
  preloadListItems = async (params: GetListItemsParams & { limit?: number }) => {
    const { limit = 30 } = params;

    const list =
      params.list ?? (await this.getList({ ...params, skipSync: true } as GetListParams));
    if (!list || list.dynamicType === 'search') return null;

    const itemInfoRaw = await prisma.listItems.findMany({
      where: { list_id: list.internal_id },
    });

    const itemInfo = rawToListItems(itemInfoRaw);

    // we're preloading so hidden items don't show in the first load
    const result = itemInfo.filter((item) => !item.isHidden || !item);
    const itemData = await getManyItems({ id: result.map((item) => item.item_iid.toString()) });

    const sortedItemInfo = result.sort((a, b) => {
      if (a.isHighlight && !b.isHighlight) return -1;
      if (!a.isHighlight && b.isHighlight) return 1;
      return sortListItems(a, b, list.sortBy, list.sortDir, itemData);
    });

    const finalResult = sortedItemInfo.splice(0, limit);

    const finalItemData: { [id: string]: ItemData } = {};
    finalResult.forEach((item) => {
      finalItemData[item.item_iid] = itemData[item.item_iid];
    });

    return { items: finalResult, itemData: finalItemData };
  };
}

type GetListItemsParams = Partial<GetListParams> & {
  list?: UserList;
};

type GetListItemParams = Partial<GetListParams> & {
  list?: UserList;
  query?: string;
  searchFilters?: SearchFilters;
};

type GetListParams = {
  username: string;
  listId?: string | number;
  listSlug?: string;
  list_id_or_slug?: string | number;
  isOfficial?: boolean;
  skipSync?: boolean;
};

type GetUserListsParams = Omit<GetUserListsOptions, 'viewerId'>;

const toListIdAndSlug = (list_id_or_slug: string | number) => {
  if (typeof list_id_or_slug === 'number' || /^\d+$/.test(list_id_or_slug)) {
    return { listId: Number(list_id_or_slug), listSlug: undefined };
  } else {
    return { listId: undefined, listSlug: String(list_id_or_slug) };
  }
};
