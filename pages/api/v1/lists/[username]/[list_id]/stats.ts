import { NextApiRequest, NextApiResponse } from 'next';
import { getSearchStats } from '../../../search/stats';
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

  try {
    const listService = await ListService.initReq(req);
    const user = listService.user;
    const list = await listService.getList({
      username,
      list_id_or_slug,
      isOfficial,
    });
    if (!list) return res.status(404).json({ error: 'List not found' });

    const isOwner = !!(user && user.id === list.owner.id);

    const searchStats = await getSearchStats('', {
      list: {
        id: list.internal_id,
        includeHidden: isOwner,
      },
    });

    return res.status(200).json(searchStats);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
