import type { NextApiRequest, NextApiResponse } from 'next';
import { ListService } from '@services/ListService';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const id_name = req.query.id_name;
  const id = Number(id_name);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid Request' });

  const onlyOfficial = req.query.official === 'true';
  const { official, trade } = await ListService.getItemLists(id, {
    includeOfficial: onlyOfficial,
    includeTrade: !onlyOfficial,
  });

  res.json(onlyOfficial ? official : trade);
}
