import { NextApiRequest, NextApiResponse } from 'next';
import { getList } from '.';
import { CheckAuth } from '../../../../../../utils/googleCloud';
import prisma from '../../../../../../utils/prisma';
import { getManyItems } from '../../../items/many';
import requestIp from 'request-ip';
import { redis_setItemCount } from '../../../../redis/checkapi';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { username, list_id: list_id_or_slug, asObject } = req.query;
  const isOfficial = username === 'official';

  if (
    !username ||
    !list_id_or_slug ||
    Array.isArray(username) ||
    Array.isArray(list_id_or_slug) ||
    !req.url
  )
    return res.status(400).json({ error: 'Bad Request' });

  let user = null;

  try {
    user = (await CheckAuth(req)).user;
  } catch (e) {}

  try {
    const list = await getList(username, list_id_or_slug, user, isOfficial);
    if (!list) return res.status(404).json({ error: 'List not found' });

    const isOwner = !!(user && user.id === list.owner.id);

    const itemInfoRaw = await prisma.listItems.findMany({
      where: { list_id: list.internal_id, isHidden: !isOwner ? false : undefined },
      select: {
        item_iid: true,
      },
    });

    if (!itemInfoRaw.length) return res.status(200).json([]);

    const itemData = await getManyItems({
      id: itemInfoRaw.map((item) => item.item_iid.toString()),
    });

    const itemArray = Object.values(itemData);

    const ip = requestIp.getClientIp(req);
    redis_setItemCount(ip, itemArray.length, req);

    if (asObject === 'true') return res.status(200).json(itemData);

    return res.status(200).json(itemArray);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// this function does not check if user is owner of the list
// only returns public data
export const getListItems = async (list_id_or_slug: string, username: string) => {
  const isOfficial = username === 'official';

  const list = await getList(username, list_id_or_slug, null, isOfficial);
  if (!list) return null;

  const isOwner = false;

  const itemInfoRaw = await prisma.listItems.findMany({
    where: { list_id: list.internal_id, isHidden: !isOwner ? false : undefined },
    select: {
      item_iid: true,
    },
  });

  if (!itemInfoRaw.length) return [];

  const itemData = await getManyItems({
    id: itemInfoRaw.map((item) => item.item_iid.toString()),
  });

  return Object.values(itemData);
};
