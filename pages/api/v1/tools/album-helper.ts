import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { getManyItems } from '../items/many';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);
  // if (req.method === 'POST') return POST(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  const album_id = req.query.album_id as string;
  const redirect = req.query.redirect === 'true';

  if (!album_id) {
    return res.status(400).json({ error: 'Missing query parameters' });
  }
  console.log(album_id);
  const album = await prisma.userList.findFirst({
    where: {
      official: true,
      official_tag: 'stamps',
      description: {
        contains: `&page_id=${album_id}`,
      },
    },
  });

  if (!album && !redirect) {
    return res.status(404).json({ error: 'Album not found' });
  }

  if (!album) return res.redirect(301, '/lists/official');

  if (redirect) {
    return res.redirect(301, `/lists/official/${album.internal_id}`);
  }

  const stamps = await prisma.listItems.findMany({
    where: {
      list_id: album.internal_id,
    },
    orderBy: {
      order: 'asc',
    },
  });

  const items = await getManyItems({
    id: stamps.map((stamp) => stamp.item_iid.toString()),
  });

  const data: { [order: number]: any } = {};

  stamps.map((stamp) => {
    const item = items[stamp.item_iid];

    if (!item) throw new Error(`Item ${stamp.item_iid} not found`);
    if (!stamp.order) return;
    data[stamp.order] = {
      position: stamp.order,
      itemData: item,
    };
  });

  return res.status(200).json(data);
};
