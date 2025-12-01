import { ItemData, ListItemInfo, SearchFilters, User, UserList } from '@types';
import { CheckAuth } from '@utils/googleCloud';
import prisma from '@utils/prisma';
import { NextApiRequest } from 'next';
import { syncDynamicList } from '../pages/api/v1/lists/[username]/[list_id]/dynamic';
import { createListSlug } from '../pages/api/v1/lists/[username]';
import { ListItems, UserList as RawList, User as RawUser } from '@prisma/generated/client';
import { startOfDay } from 'date-fns';
import { doSearch } from '../pages/api/v1/search';
import { sortListItems } from '@utils/utils';
import { getManyItems } from '../pages/api/v1/items/many';

export class ListService {
  user: User | null = null;

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
    let { listId, listSlug, isOfficial, username, list_id_or_slug } = params;

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
        items: true,
        user: true,
      },
    });

    if (!listRaw || !ListService.canSeeList(listRaw, this.user)) return null;

    if (listRaw.dynamicType) await syncDynamicList(listRaw.internal_id);

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
    const { username, limit = -1, officialTag } = params;
    const isOfficial = username === 'official';

    const listsRaw = await prisma.userList.findMany({
      where: !isOfficial
        ? {
            visibility: this.user?.username === username ? undefined : 'public',
            user: {
              username: username,
            },
          }
        : {
            official: true,
            official_tag: officialTag || undefined,
          },
      include: {
        items: true,
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit > 0 ? limit : undefined,
    });

    if (!listsRaw || listsRaw.length === 0) return [];

    const lists: UserList[] = listsRaw
      .map((list) => rawToList(list, list.user))
      .sort((a, b) =>
        isOfficial
          ? new Date(b.createdAt) < new Date(a.createdAt)
            ? -1
            : 1
          : (a.order ?? 0) - (b.order ?? 0) ||
            (new Date(b.updatedAt) < new Date(a.updatedAt) ? -1 : 1)
      );

    return lists;
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
        if (tag === 'uncategorized') return !list.officialTag;
        return list.officialTag?.toLowerCase() === tag;
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

  // overloaded function signatures
  async getListItems(params: GetListItemsParams & { asObject?: false }): Promise<ItemData[] | null>;

  async getListItems(
    params: GetListItemsParams & { asObject: true }
  ): Promise<Record<string, ItemData> | null>;

  async getListItems(
    params: GetListItemsParams & { asObject: boolean }
  ): Promise<Record<string, ItemData> | ItemData[] | null>;

  async getListItems(params: GetListItemsParams & { asObject?: boolean }) {
    const list = params.list ?? (await this.getList(params as GetListParams));
    if (!list) return null;

    const isOwner = !!(this.user && this.user.id === list.owner.id);

    const queryRes = await doSearch('', undefined, false, list.internal_id, isOwner);

    if (!params.asObject) return queryRes.content;

    const itemMap: { [key: string]: any } = {};
    queryRes.content.forEach((item) => {
      itemMap[item.internal_id] = item;
    });

    return itemMap;
  }

  async getListItemInfo(params: GetListItemParams) {
    const { query, searchFilters } = params;
    const list = params.list ?? (await this.getList(params as GetListParams));
    if (!list) return null;
    const isOwner = !!(this.user && this.user.id === list.owner.id);

    const itemInfoRaw = await prisma.listItems.findMany({
      where: { list_id: list.internal_id },
    });

    const itemInfo = rawToListItems(itemInfoRaw);

    if (!query && Object.keys(searchFilters || {}).length === 0) {
      const result = itemInfo.filter((item) => !item.isHidden || isOwner);

      return result;
    }

    const queryRes = await doSearch(query ?? '', searchFilters, false, list.internal_id, isOwner);

    const itemIDs = new Set(queryRes.content.map((item) => item.internal_id));

    const result = itemInfo.filter(
      (item) => itemIDs.has(item.item_iid) && (!item.isHidden || isOwner)
    );

    return result;
  }

  /**
   * Used to preload list items for faster initial loading.
   * Does not return hidden items.
   **/
  preloadListItems = async (params: GetListItemsParams & { limit?: number }) => {
    const { limit = 30 } = params;

    const list = params.list ?? (await this.getList(params as GetListParams));
    if (!list) return null;

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
};

type GetUserListsParams = {
  username: string;
  limit?: number;
  officialTag?: string;
};

const toListIdAndSlug = (list_id_or_slug: string | number) => {
  if (typeof list_id_or_slug === 'number' || /^\d+$/.test(list_id_or_slug)) {
    return { listId: Number(list_id_or_slug), listSlug: undefined };
  } else {
    return { listId: undefined, listSlug: String(list_id_or_slug) };
  }
};

export const rawToList = (
  listRaw: RawList & { items?: ListItems[] },
  owner: User | RawUser,
  includeItems = false
): UserList => {
  return {
    internal_id: listRaw.internal_id,
    name: listRaw.name,
    description: listRaw.description,
    coverURL: listRaw.cover_url,
    colorHex: listRaw.colorHex,
    purpose: listRaw.purpose,
    official: listRaw.official,
    visibility: listRaw.visibility,

    owner: {
      id: owner.id,
      username: owner.username,
      neopetsUser: (owner as RawUser)?.neo_user ?? (owner as User).neopetsUser,
      lastSeen: startOfDay((owner as RawUser).last_login ?? (owner as User).lastLogin).toJSON(),
    },

    createdAt: listRaw.createdAt.toJSON(),
    updatedAt: listRaw.updatedAt.toJSON(),

    sortBy: listRaw.sortBy,
    sortDir: listRaw.sortDir,
    order: listRaw.order ?? 0,

    dynamicType: listRaw.dynamicType,
    lastSync: listRaw.lastSync?.toJSON() ?? null,
    linkedListId: listRaw.linkedListId ?? null,
    canBeLinked: listRaw.official || listRaw.canBeLinked,

    officialTag: listRaw.official_tag ?? null,
    userTag: listRaw.listUserTag ?? null,

    itemCount: listRaw.items?.filter((x) => !x.isHidden).length ?? -1,

    slug: listRaw.slug,
    seriesType: listRaw.seriesType,
    seriesStart: listRaw.seriesStart?.toJSON() ?? null,
    seriesEnd: listRaw.seriesEnd?.toJSON() ?? null,

    highlight: listRaw.highlight ?? null,
    highlightText: listRaw.highlightText ?? null,

    itemInfo: !includeItems ? [] : rawToListItems(listRaw.items ?? []),
  };
};

export const rawToListItems = (items: ListItems[]): ListItemInfo[] => {
  return items.map((item) => ({
    internal_id: item.internal_id,
    list_id: item.list_id,
    item_iid: item.item_iid,
    addedAt: item.addedAt.toJSON(),
    updatedAt: item.updatedAt.toJSON(),
    amount: item.amount,
    capValue: item.capValue,
    imported: item.imported,
    order: item.order,
    isHighlight: item.isHighlight,
    isHidden: item.isHidden,
    seriesStart: item.seriesStart?.toJSON() ?? null,
    seriesEnd: item.seriesEnd?.toJSON() ?? null,
  }));
};
