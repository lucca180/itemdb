import { NextApiRequest, NextApiResponse } from 'next';
import { getImagePalette } from '../lists/[username]';
import { CheckAuth } from '@utils/googleCloud';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  // if (req.method === 'GET') return GET(req, res);
  if (req.method === 'POST') return POST(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function POST(req: NextApiRequest, res: NextApiResponse) {
  const url = req.body.url as string;
  if (!url) return res.status(400).json({ error: 'Missing url' });

  const { user } = await CheckAuth(req);
  if (!user || user.banned) return res.status(403).json({ error: 'Unauthorized' });

  const palette = await getImagePalette(url, true);

  if (!palette) return res.status(400).json({ error: 'Invalid url' });
  return res.status(200).json(palette);
}
