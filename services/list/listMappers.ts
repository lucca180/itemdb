import { startOfDay } from 'date-fns';
import { tz } from '@date-fns/tz';
import type { ListItemInfo, User, UserList } from '@types';
import type { ListItems, UserList as RawList, User as RawUser } from '@prisma/generated/client';

export type ListOwnerRef = RawUser | User | RequiredUserFields;

type RequiredUserFields = {
  id: string;
  username: string;
  neo_user: string;
  last_login: string;
};

export const rawToList = (
  listRaw: RawList & { items?: ListItems[]; _count?: { items: number } },
  owner: ListOwnerRef,
  includeItems = false
): UserList => {
  const itemCount =
    listRaw.items !== undefined
      ? listRaw.items.filter((x) => !x.isHidden).length
      : (listRaw.visibleItemCount ?? listRaw._count?.items ?? -1);

  return {
    internal_id: listRaw.internal_id,
    name: listRaw.name,
    description: listRaw.description,
    coverURL: listRaw.cover_url,
    colorHex: listRaw.colorHex,
    purpose: listRaw.purpose,
    official: !!listRaw.official,
    visibility: listRaw.visibility,

    owner: {
      id: owner.id,
      username: owner.username,
      neopetsUser: (owner as RequiredUserFields).neo_user ?? (owner as User).neopetsUser,
      lastSeen: startOfDay((owner as RequiredUserFields).last_login ?? (owner as User).lastLogin, {
        in: tz('America/Los_Angeles'),
      }).toJSON(),
    },

    createdAt: listRaw.createdAt.toJSON(),
    updatedAt: listRaw.updatedAt.toJSON(),

    sortBy: listRaw.sortBy,
    sortDir: listRaw.sortDir,
    order: listRaw.order ?? 0,

    dynamicType: listRaw.dynamicType,
    lastSync: listRaw.lastSync?.toJSON() ?? null,
    linkedListId: listRaw.linkedListId ?? null,
    canBeLinked: !!(listRaw.official || listRaw.canBeLinked),

    officialTag: splitOfficialTag(listRaw.official_tag),
    userTag: listRaw.listUserTag ?? null,

    itemCount,

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
    addedAt: new Date(item.addedAt).toJSON(),
    updatedAt: new Date(item.updatedAt).toJSON(),
    amount: item.amount,
    capValue: item.capValue,
    imported: !!item.imported,
    order: item.order,
    isHighlight: !!item.isHighlight,
    isHidden: !!item.isHidden,
    seriesStart: item.seriesStart ? new Date(item.seriesStart).toJSON() : null,
    seriesEnd: item.seriesEnd ? new Date(item.seriesEnd).toJSON() : null,
  }));
};

const splitOfficialTag = (officialTag: string | null) =>
  officialTag
    ?.split(',')
    .map((tag) => tag.trim())
    .filter(Boolean) ?? [];
