import { NextApiRequest, NextApiResponse } from 'next';
import { getList } from '.';
import { CheckAuth } from '../../../../../../utils/googleCloud';
import { getSearchStats } from '../../../search/stats';

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

    const searchStats = await getSearchStats('', list.internal_id, isOwner);

    return res.status(200).json(searchStats);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
