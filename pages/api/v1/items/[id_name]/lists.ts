import type { NextApiRequest, NextApiResponse } from 'next';
import { UserList } from '../../../../../types';
import prisma from '../../../../../utils/prisma';
import { rawToList, rawToListItems } from '@services/ListService';
import { ListItems, Prisma, UserList as RawList } from '@prisma/generated/client';

export type ItemListCollections = {
  official: UserList[];
  trade: UserList[];
};

export type GetItemListsOptions = {
  includeOfficial?: boolean;
  includeTrade?: boolean;
};

const TRADE_LIST_ACTIVE_MS = 180 * 24 * 60 * 60 * 1000;

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
};

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const id_name = req.query.id_name;
  const id = Number(id_name);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid Request' });

  const onlyOfficial = req.query.official === 'true';
  const { official, trade } = await getItemLists(id, {
    includeOfficial: onlyOfficial,
    includeTrade: !onlyOfficial,
  });

  res.json(onlyOfficial ? official : trade);
}

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

function mapItemListRows(id: number, listsRaw: ItemListRow[]): UserList[] {
  return listsRaw.map((list) => {
    const newList = rawToList(list, list.user, false);
    const item = list.items.find((item) => item.item_iid === id)!;

    newList.itemInfo = rawToListItems([item]);
    newList.itemCount = null;

    return newList;
  });
}

async function queryItemLists(id: number, listCondition: Prisma.Sql): Promise<UserList[]> {
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
    ) as items

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
`) as ItemListRow[];

  return mapItemListRows(id, listsRaw);
}

async function queryOfficialItemLists(id: number): Promise<UserList[]> {
  return queryItemLists(id, Prisma.sql`ul.official = 1`);
}

async function queryTradeItemLists(id: number): Promise<UserList[]> {
  return queryItemLists(id, Prisma.sql`ul.visibility = 'public' AND ul.purpose != 'none'`);
}

async function queryItemListsUnified(id: number): Promise<UserList[]> {
  return queryItemLists(
    id,
    Prisma.sql`(
      ul.official = 1
      OR (ul.visibility = 'public' AND ul.purpose != 'none')
    )`
  );
}

// You cannot trust the item count value from this function.
export const getItemLists = async (
  id: number,
  options: GetItemListsOptions = {}
): Promise<ItemListCollections> => {
  const includeOfficial = options.includeOfficial ?? true;
  const includeTrade = options.includeTrade ?? false;

  if (!includeOfficial && !includeTrade) {
    return { official: [], trade: [] };
  }

  if (includeOfficial && includeTrade) {
    const lists = await queryItemListsUnified(id);
    return {
      official: filterOfficialLists(lists),
      trade: filterTradeLists(lists),
    };
  }

  const [officialLists, tradeLists] = await Promise.all([
    includeOfficial ? queryOfficialItemLists(id) : Promise.resolve([]),
    includeTrade ? queryTradeItemLists(id) : Promise.resolve([]),
  ]);

  return {
    official: filterOfficialLists(officialLists),
    trade: filterTradeLists(tradeLists),
  };
};
