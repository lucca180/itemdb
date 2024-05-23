import { NextApiRequest, NextApiResponse } from 'next';
import { getList } from '.';
import { CheckAuth } from '../../../../../../utils/googleCloud';
import qs from 'qs';
import { doSearch } from '../../../search';
import prisma from '../../../../../../utils/prisma';
import { ListItemInfo } from '../../../../../../types';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { username, list_id } = req.query;
  const isOfficial = username === 'official';

  if (!username || !list_id || Array.isArray(username) || Array.isArray(list_id) || !req.url)
    return res.status(400).json({ error: 'Bad Request' });

  const reqQuery = qs.parse(req.url.split('?')[1]) as any;
  const query = (reqQuery.s as string)?.trim() ?? '';
  reqQuery.page = 1;
  reqQuery.limit = 10000;

  let user = null;

  try {
    user = (await CheckAuth(req)).user;
  } catch (e) {}

  try {
    const list = await getList(username, parseInt(list_id), user, isOfficial);
    if (!list) return res.status(404).json({ error: 'List not found' });

    const itemInfoRaw = await prisma.listItems.findMany({
      where: { list_id: list.internal_id },
    });

    const itemInfo: ListItemInfo[] = itemInfoRaw.map((item) => ({
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
    }));

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
