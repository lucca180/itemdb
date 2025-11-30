import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../../../utils/prisma';
import { rawToList } from '@services/ListService';
import { UserList } from '../../../../../../types';
import { ListService } from '@services/ListService';

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

  const listService = ListService.init();

  const list = await listService.getList({
    username: username as string,
    list_id_or_slug: list_id_or_slug,
    isOfficial,
  });

  if (!list) return res.status(404).json({ error: 'List not found' });

  const result = await getSimilarLists(list, limit);

  return res.status(200).json(result);
};

export const getSimilarLists = async (list: UserList, limit: number) => {
  const name = list.name;

  const similarIdsRaw = (await prisma.$queryRaw`
    select internal_id from userlist
      where official = 1 AND 
      ( 
        MATCH name AGAINST (${name} IN NATURAL LANGUAGE MODE) OR 
        MATCH description AGAINST (${name} IN NATURAL LANGUAGE MODE)
      )
      ORDER BY MATCH name AGAINST (${name} IN NATURAL LANGUAGE MODE) desc, MATCH description AGAINST (${name} IN NATURAL LANGUAGE MODE) desc, updatedAt desc
  `) as { internal_id: number }[];

  const similarIds = similarIdsRaw
    .map((x: { internal_id: number }) => x.internal_id)
    .filter((id) => id !== list.internal_id);

  const similarLists = await prisma.userList.findMany({
    where: similarIds.length
      ? {
          internal_id: {
            in: similarIds,
          },
        }
      : {
          official: true,
          official_tag: list.officialTag,
          NOT: {
            internal_id: list.internal_id,
          },
        },
    include: {
      items: true,
      user: true,
    },
  });

  similarLists.sort((a, b) => {
    const aPos = similarIds.indexOf(a.internal_id);
    const bPos = similarIds.indexOf(b.internal_id);
    if (aPos === -1 && bPos === -1) return 0;
    if (aPos === -1) return 1;
    if (bPos === -1) return -1;
    return aPos - bPos;
  });

  if (!similarLists.length) return [];

  const result = similarLists.slice(0, limit).map((list) => rawToList(list, list.user, false));

  return result;
};
