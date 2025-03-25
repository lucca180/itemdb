import { NextApiRequest, NextApiResponse } from 'next';
import { getList } from '.';
import { CheckAuth } from '../../../../../../utils/googleCloud';
import qs from 'qs';
import { doSearch } from '../../../search';
import prisma from '../../../../../../utils/prisma';
import { ItemData, UserList } from '../../../../../../types';
import { rawToListItems } from '..';
import { getManyItems } from '../../../items/many';
import { sortListItems } from '../../../../../lists/[username]/[list_id]';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { username, list_id: list_id_or_slug } = req.query;
  const isOfficial = username === 'official';

  if (
    !username ||
    !list_id_or_slug ||
    Array.isArray(username) ||
    Array.isArray(list_id_or_slug) ||
    !req.url
  )
    return res.status(400).json({ error: 'Bad Request' });

  const reqQuery = qs.parse(req.url.split('?')[1]) as any;

  const isQueryEmpty = Object.keys(reqQuery).length === 0;

  const query = (reqQuery.s as string)?.trim() ?? '';
  reqQuery.page = 1;
  reqQuery.limit = 10000;

  let user = null;

  try {
    user = (await CheckAuth(req)).user;
  } catch (e) {}

  try {
    const list = await getList(username, list_id_or_slug, user, isOfficial);
    if (!list) return res.status(404).json({ error: 'List not found' });

    const itemInfoRaw = await prisma.listItems.findMany({
      where: { list_id: list.internal_id },
    });

    const itemInfo = rawToListItems(itemInfoRaw);

    if (isQueryEmpty) return res.status(200).json(itemInfo);

    const isOwner = !!(user && user.id === list.owner.id);

    const queryRes = await doSearch(query, reqQuery, false, list.internal_id, isOwner);

    const itemIDs = new Set(queryRes.content.map((item) => item.internal_id));

    const result = itemInfo.filter(
      (item) => itemIDs.has(item.item_iid) && (!item.isHidden || isOwner)
    );

    return res.status(200).json(result);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// this assumes you already verified the user is the owner of the list
export const preloadListItems = async (list: UserList, isOwner = false, limit = 30) => {
  const itemInfoRaw = await prisma.listItems.findMany({
    where: { list_id: list.internal_id },
  });

  const itemInfo = rawToListItems(itemInfoRaw);

  const result = itemInfo.filter((item) => !item.isHidden || isOwner || !item);
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
