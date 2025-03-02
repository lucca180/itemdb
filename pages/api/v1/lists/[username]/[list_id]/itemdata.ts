import { NextApiRequest, NextApiResponse } from 'next';
import { getList } from '.';
import { CheckAuth } from '../../../../../../utils/googleCloud';
import prisma from '../../../../../../utils/prisma';
import { getManyItems } from '../../../items/many';

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

    return res.status(200).json(Object.values(itemData));
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
