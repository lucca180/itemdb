/**
 * Queries for loading user list collections.
 *
 * Two paths:
 * - `username` (regular profile): one owner, filter by user_id, no per-list user join.
 * - `'official'`: many lists from few creators, owners fetched in batch after the list query.
 *
 * Item counts come from UserList.visibleItemCount unless includeItems is true.
 */
import { getUser } from '@pages/api/v1/users/[username]';
import { rawToList } from '@services/list/listMappers';
import type { User, UserList } from '@types';
import prisma from '@utils/prisma';
import type { ListItems, UserList as RawList, User as RawUser } from '@prisma/generated/client';

export type GetUserListsOptions = {
  /** Profile username or the literal `'official'`. */
  username: string;
  limit?: number;
  officialTag?: string;
  /** When true, loads full list items inline instead of item counts. */
  includeItems?: boolean;
  /** Skip getUser when the caller already resolved the profile owner. */
  owner?: User;
  /** Logged-in viewer id; when it matches owner.id, private/unlisted lists are included. */
  viewerId?: string | null;
  fillItemCounts?: (lists: RawList[]) => Promise<void>;
};

type ListRow = RawList & { items?: ListItems[] };
type OwnerRef = RawUser | User | ListOwnerStub;
/** Fallback when an official list references a deleted user. */
type ListOwnerStub = {
  id: string;
  username: string;
  neo_user: string;
  last_login: string;
};

/** Fields required by rawToList to build list.owner. */
const LIST_OWNER_SELECT = {
  id: true,
  username: true,
  neo_user: true,
  last_login: true,
} as const;

/** Used when an official list references a deleted or unknown user. */
export const FALLBACK_LIST_OWNER_ID = 'UmY3BzWRSrhZDIlxzFUVxgRXjfi1';

/** Routes to the official or username query path. */
export async function queryUserLists(options: GetUserListsOptions): Promise<UserList[]> {
  if (options.username === 'official') {
    return queryOfficialLists(options);
  }

  return queryUsernameLists(options);
}

/**
 * Official lists: each list may have a different creator.
 * We avoid joining User on every row and batch-fetch unique owners instead.
 */
async function queryOfficialLists(options: GetUserListsOptions) {
  const { limit = -1, officialTag, includeItems = false } = options;

  const listsRaw = await prisma.userList.findMany({
    where: {
      official: true,
      official_tag: officialTag ? { contains: officialTag } : undefined,
    },
    include: includeItems ? { items: true } : undefined,
    orderBy: { createdAt: 'desc' },
    take: limit > 0 ? limit : undefined,
  });

  const ownersById = await fetchListOwnersById(listsRaw.map((list) => list.user_id));

  return buildUserLists({
    listsRaw,
    includeItems,
    isOfficial: true,
    fillItemCounts: options.fillItemCounts,
    resolveOwner: (list) =>
      ownersById.get(list.user_id) ?? ownersById.get(FALLBACK_LIST_OWNER_ID) ?? missingListOwner(),
  });
}

/**
 * Regular user profile: one owner for all lists.
 * Filter by user_id directly; reuse the same owner object for every rawToList call.
 */
async function queryUsernameLists(options: GetUserListsOptions) {
  const { username, limit = -1, includeItems = false, owner: knownOwner, viewerId } = options;

  const owner = knownOwner ?? (await getUser(username));
  if (!owner) return [];

  const isOwnerView = viewerId === owner.id;

  const listsRaw = await prisma.userList.findMany({
    where: {
      user_id: owner.id,
      visibility: isOwnerView ? undefined : 'public',
    },
    include: includeItems ? { items: true } : undefined,
    orderBy: { createdAt: 'desc' },
    take: limit > 0 ? limit : undefined,
  });

  return buildUserLists({
    listsRaw,
    includeItems,
    isOfficial: false,
    fillItemCounts: options.fillItemCounts,
    resolveOwner: () => owner,
  });
}

/** One query for all distinct list creators (typically far fewer than list count on /official). */
async function fetchListOwnersById(userIds: string[]) {
  const uniqueIds = [...new Set([...userIds, FALLBACK_LIST_OWNER_ID])];
  if (!uniqueIds.length) return new Map<string, RawUser>();

  const users = await prisma.user.findMany({
    where: { id: { in: uniqueIds } },
    select: LIST_OWNER_SELECT,
  });

  return new Map(users.map((user) => [user.id, user as RawUser]));
}

/** Official lists sort by createdAt; user lists use manual order then updatedAt. */
function sortUserLists(lists: UserList[], isOfficial: boolean) {
  return lists.sort((a, b) =>
    isOfficial
      ? new Date(b.createdAt) < new Date(a.createdAt)
        ? -1
        : 1
      : (a.order ?? 0) - (b.order ?? 0) || (new Date(b.updatedAt) < new Date(a.updatedAt) ? -1 : 1)
  );
}

/** Shared pipeline: fill missing counts → rawToList → sort. */
async function buildUserLists<T extends ListRow>({
  listsRaw,
  includeItems,
  isOfficial,
  fillItemCounts,
  resolveOwner,
}: {
  listsRaw: T[];
  includeItems: boolean;
  isOfficial: boolean;
  fillItemCounts?: (lists: T[]) => Promise<void>;
  resolveOwner: (list: T) => OwnerRef;
}) {
  if (!listsRaw.length) return [];

  if (!includeItems && fillItemCounts) await fillItemCounts(listsRaw);

  return sortUserLists(
    listsRaw.map((list) => rawToList(list, resolveOwner(list), includeItems)),
    isOfficial
  );
}

function missingListOwner(): ListOwnerStub {
  return {
    id: FALLBACK_LIST_OWNER_ID,
    username: '',
    neo_user: '',
    last_login: new Date(0).toISOString(),
  };
}
