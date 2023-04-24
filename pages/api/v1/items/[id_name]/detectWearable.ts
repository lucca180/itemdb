import { NextApiRequest, NextApiResponse } from 'next';
import { getItem } from '.';
import { detectWearable } from '../../../../../utils/detectWearable';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id_name } = req.query;
  if (!id_name) return res.status(400).json({ error: 'Invalid Request' });

  const internal_id = Number(id_name);
  const name = isNaN(internal_id) ? (id_name as string) : undefined;

  const item = await getItem(name ?? internal_id);
  if (!item) return res.status(400).json({ error: 'Item not found' });

  const x = await detectWearable(item.image);

  return res.send(x);
}
