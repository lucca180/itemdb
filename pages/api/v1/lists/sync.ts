import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { syncDynamicList } from './[username]/[list_id]/dynamic';

const TARNUM_KEY = process.env.TARNUM_KEY;

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (
    process.env.NODE_ENV !== 'development' &&
    (!req.headers.authorization || req.headers.authorization !== TARNUM_KEY)
  )
    return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') return GET(req, res);

  return res.status(405).json({ error: 'Method not allowed' });
}

async function GET(req: NextApiRequest, res: NextApiResponse) {
  await syncAllDynamicLists();

  res.status(200).json({ message: 'Dynamic lists synced' });
}

export const syncAllDynamicLists = async () => {
  const dynamicOfficialLists = await prisma.userList.findMany({
    where: {
      official: true,
      dynamicType: {
        not: null,
      },
    },
    select: {
      internal_id: true,
    },
  });

  const promises = dynamicOfficialLists.map((list) => {
    return syncDynamicList(list.internal_id, true);
  });

  await Promise.all(promises);
};
