import { NextApiRequest, NextApiResponse } from 'next';
import requestIp from 'request-ip';
import { redis_setItemCount } from '@utils/redis';
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
  const { username, list_id: list_id_or_slug, asObject } = req.query;
  let startTime = Date.now();
  if (
    !username ||
    !list_id_or_slug ||
    Array.isArray(username) ||
    Array.isArray(list_id_or_slug) ||
    !req.url
  )
    return res.status(400).json({ error: 'Bad Request' });

  try {
    startTime = updateServerTime('init list service', startTime, res);
    const listService = await ListService.initReq(req);

    const itemData = await listService.getListItems({
      username,
      list_id_or_slug,
      asObject: asObject === 'true',
    });

    startTime = updateServerTime('get-item-data', startTime, res);

    if (!itemData) return res.status(404).json({ error: 'List not found' });

    const ip = requestIp.getClientIp(req);
    redis_setItemCount(ip, Object.keys(itemData).length, req);

    updateServerTime('set-redis', startTime, res);

    return res.status(200).json(itemData);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const updateServerTime = (label: string, startTime: number, response: NextApiResponse) => {
  const endTime = Date.now();
  const value = endTime - startTime;
  const serverTime = response.getHeader('Server-Timing') || '';
  const newServerTime = serverTime
    ? `${serverTime}, ${label};dur=${value}`
    : `${label};dur=${value}`;

  response.setHeader('Server-Timing', newServerTime);
  return endTime;
};
