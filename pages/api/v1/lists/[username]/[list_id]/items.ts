import { NextApiRequest, NextApiResponse } from 'next';
import queryString from 'query-string';
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

  if (
    !username ||
    !list_id_or_slug ||
    Array.isArray(username) ||
    Array.isArray(list_id_or_slug) ||
    !req.url
  )
    return res.status(400).json({ error: 'Bad Request' });

  const reqQuery = queryString.parse(req.url.split('?')[1], {
    arrayFormat: 'bracket',
  }) as any;

  const isQueryEmpty = Object.keys(reqQuery).length === 0;

  const query = (reqQuery.s as string)?.trim() ?? '';
  reqQuery.page = 1;
  reqQuery.limit = 10000;

  try {
    const listService = await ListService.initReq(req);

    const result = await listService.getListItemInfo({
      username,
      list_id_or_slug,
      query: isQueryEmpty ? undefined : query,
      searchFilters: isQueryEmpty ? undefined : (reqQuery as any),
    });

    if (!result) return res.status(404).json({ error: 'List not found' });

    return res.status(200).json(result);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
