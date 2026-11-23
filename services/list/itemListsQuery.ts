/**
 * INTERNAL MODULE — do not import this file directly. Go through `@services/ListService`
 * (enforced by `test/listItemsWrite.guard.test.ts`).
 */
/**
 * Queries for the lists that hold one item (item page official/trade lists, NC Mall hub,
 * price markers, avatar solutions).
 *
 * Item counts come from UserList.visibleItemCount.
 */
import { rawToList, rawToListItems } from '@services/list/listMappers';
import type { UserList } from '@types';
import prisma from '@utils/prisma';
import { Prisma, type ListItems, type UserList as RawList } from '@prisma/generated/client';

export type ItemListCollections = {
  official: UserList[];
  trade: UserList[];
};

export type GetItemListsOptions = {
  includeOfficial?: boolean;
  includeTrade?: boolean;
  /**
   * Ranks official lists for the item page instead of creation order (see
   * `rankItemOfficialLists`). Non-official lists keep creation order.
   */
  rankOfficial?: boolean;
};

const TRADE_LIST_ACTIVE_MS = 180 * 24 * 60 * 60 * 1000;

/** Lists below this visible size are ranked newest first; the rest come after, smallest first. */
export const RANK_BY_CREATION_MAX_ITEMS = 300;

type ItemListsResult = {
  lists: UserList[];
  /** Lists where the item is in at least one context. */
  contextListIds: Set<number>;
};

type ItemListRow = RawList & {
  user: {
    id: string;
    username: string;
    neo_user: string;
    last_login: string;
  };
  items: (ListItems & {
    addedAt: string;
    updatedAt: string;
    seriesStart: string | null;
    seriesEnd: string | null;
  })[];
  /** 1 when the item's list row is in at least one context */
  hasContext: number | bigint;
};

export function filterOfficialLists(lists: UserList[]): UserList[] {
  return lists.filter((list) => list.official);
}

export function filterTradeLists(lists: UserList[]): UserList[] {
  const cutoff = Date.now() - TRADE_LIST_ACTIVE_MS;
  return lists.filter(
    (list) =>
      list.visibility === 'public' &&
      list.purpose !== 'none' &&
      new Date(list.owner.lastSeen).getTime() > cutoff
  );
}

/** Active series: `seriesStart < now < seriesEnd` (both required). */
export function isListSeriesActive(
  list: Pick<UserList, 'seriesStart' | 'seriesEnd'>,
  now: number
): boolean {
  if (!list.seriesStart || !list.seriesEnd) return false;
  return new Date(list.seriesStart).getTime() < now && now < new Date(list.seriesEnd).getTime();
}

/**
 * Item page order for the official lists that hold one item:
 * 1. active series;
 * 2. lists where the item is a highlight;
 * 3. lists where the item is in a context (`contextListIds`);
 * 4. lists with fewer than `RANK_BY_CREATION_MAX_ITEMS` visible items, newest first;
 * 5. the rest by size, smallest first (lists without a count last).
 * Ties keep the incoming order (creation order).
 */
export function rankItemOfficialLists(
  lists: UserList[],
  now: number,
  contextListIds: ReadonlySet<number> = new Set()
): UserList[] {
  const keyed = lists.map((list) => {
    const size = list.itemCount ?? Number.MAX_SAFE_INTEGER;
    const createdAt = new Date(list.createdAt).getTime();
    return {
      list,
      active: isListSeriesActive(list, now) ? 1 : 0,
      highlight: list.itemInfo?.[0]?.isHighlight ? 1 : 0,
      context: contextListIds.has(list.internal_id) ? 1 : 0,
      small: size < RANK_BY_CREATION_MAX_ITEMS ? 1 : 0,
      createdAt: Number.isNaN(createdAt) ? 0 : createdAt,
      size,
    };
  });

  keyed.sort(
    (a, b) =>
      b.active - a.active ||
      b.highlight - a.highlight ||
      b.context - a.context ||
      b.small - a.small ||
      (a.small && b.small ? b.createdAt - a.createdAt : 0) ||
      a.size - b.size
  );

  return keyed.map((entry) => entry.list);
}

function mapItemListRows(id: number, listsRaw: ItemListRow[]): ItemListsResult {
  const contextListIds = new Set<number>();
  const lists = listsRaw.map((list) => {
    if (Number(list.hasContext)) contextListIds.add(list.internal_id);

    const newList = rawToList(list, list.user, false);
    const item = list.items.find((item) => item.item_iid === id)!;

    newList.itemInfo = rawToListItems([item]);
    // `rawToList` would count the single joined item row; use the stored list count instead.
    newList.itemCount = list.visibleItemCount ?? null;

    return newList;
  });

  return { lists, contextListIds };
}

async function queryItemLists(id: number, listCondition: Prisma.Sql): Promise<ItemListsResult> {
  const listsRaw = (await prisma.$queryRaw`
  SELECT 
    ul.*,
    
    -- Construct the User object
    JSON_OBJECT(
      'id', u.id, 
      'username', u.username, 
      'neo_user', u.neo_user, 
      'last_login', u.last_login
    ) as user,

    -- Construct the items Array
    -- Since we are querying the specific item row directly (via the main FROM clause),
    -- we can build the JSON object directly without a subquery or aggregation overhead.
    JSON_ARRAY(
      JSON_OBJECT(
        'internal_id', li_filter.internal_id,
        'list_id', li_filter.list_id,
        'item_iid', li_filter.item_iid,
        'addedAt', li_filter.addedAt,
        'updatedAt', li_filter.updatedAt,
        'amount', li_filter.amount,
        'capValue', li_filter.capValue,
        'imported', li_filter.imported,
        'order', li_filter.order,
        'isHighlight', li_filter.isHighlight,
        'isHidden', li_filter.isHidden,
        'seriesStart', li_filter.seriesStart,
        'seriesEnd', li_filter.seriesEnd
      )
    ) as items,

    -- Item page ranking: the item's list row is in at least one context (indexed by listItem_id)
    EXISTS (
      SELECT 1 FROM ListContextItem lci WHERE lci.listItem_id = li_filter.internal_id
    ) as hasContext

    -- OPTIMIZATION STRATEGY: Inverted Join
    -- Instead of scanning Lists and checking if they have the item (EXISTS),
    -- we start by finding the specific Item (li_filter) using the index.
    FROM ListItems li_filter

    -- Join "upwards" to get the List details
    INNER JOIN UserList ul ON ul.internal_id = li_filter.list_id

    -- Join to get the User details
    INNER JOIN User u ON ul.user_id = u.id

    WHERE 
      -- 1. Primary Filter (The Driver):
      -- This drastically reduces the search space immediately.
      li_filter.item_iid = ${id} 
      AND li_filter.isHidden = 0

      -- 2. Secondary Filter (The List Conditions):
      -- These are applied only to the lists found in the step above.
      AND ${listCondition}

    ORDER BY ul.internal_id ASC
`) as ItemListRow[];

  return mapItemListRows(id, listsRaw);
}

async function queryOfficialItemLists(id: number): Promise<ItemListsResult> {
  return queryItemLists(id, Prisma.sql`ul.official = 1`);
}

async function queryTradeItemLists(id: number): Promise<ItemListsResult> {
  return queryItemLists(id, Prisma.sql`ul.visibility = 'public' AND ul.purpose != 'none'`);
}

async function queryItemListsUnified(id: number): Promise<ItemListsResult> {
  return queryItemLists(
    id,
    Prisma.sql`(
      ul.official = 1
      OR (ul.visibility = 'public' AND ul.purpose != 'none')
    )`
  );
}

export const getItemLists = async (
  id: number,
  options: GetItemListsOptions = {}
): Promise<ItemListCollections> => {
  const includeOfficial = options.includeOfficial ?? true;
  const includeTrade = options.includeTrade ?? false;
  const rankOfficial = options.rankOfficial ?? false;
  const toOfficial = ({ lists, contextListIds }: ItemListsResult) => {
    const official = filterOfficialLists(lists);
    return rankOfficial ? rankItemOfficialLists(official, Date.now(), contextListIds) : official;
  };

  if (!includeOfficial && !includeTrade) {
    return { official: [], trade: [] };
  }

  if (includeOfficial && includeTrade) {
    const result = await queryItemListsUnified(id);
    return {
      official: toOfficial(result),
      trade: filterTradeLists(result.lists),
    };
  }

  const empty: ItemListsResult = { lists: [], contextListIds: new Set() };
  const [officialLists, tradeLists] = await Promise.all([
    includeOfficial ? queryOfficialItemLists(id) : Promise.resolve(empty),
    includeTrade ? queryTradeItemLists(id) : Promise.resolve(empty),
  ]);

  return {
    official: toOfficial(officialLists),
    trade: filterTradeLists(tradeLists.lists),
  };
};
