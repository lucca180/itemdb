import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../../../utils/prisma';
import { getList } from '.';
import { rawToList } from '..';
import { UserList } from '../../../../../../types';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { username, list_id_or_slug } = req.query;
  const isOfficial = username === 'official';

  const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;

  if (!isOfficial) return res.status(400).json({ error: 'Bad Request' });

  if (
    !username ||
    !list_id_or_slug ||
    Array.isArray(username) ||
    Array.isArray(list_id_or_slug) ||
    !req.url
  )
    return res.status(400).json({ error: 'Bad Request' });

  const list = await getList(username, list_id_or_slug, null, isOfficial);
  if (!list) return res.status(404).json({ error: 'List not found' });

  const result = await getSimilarLists(list, limit);

  return res.status(200).json(result);
};

export const getSimilarLists = async (list: UserList, limit: number) => {
  const similarLists = await prisma.userList.findMany({
    where: {
      official: true,
      official_tag: list.officialTag,
      NOT: {
        internal_id: list.internal_id,
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
    include: {
      items: true,
      user: true,
    },
  });

  if (!similarLists.length) return [];

  const result = similarLists.slice(0, limit).map((list) => rawToList(list, list.user, false));

  return result;
};
