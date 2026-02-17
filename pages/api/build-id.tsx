import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';

const isDev = process.env.NODE_ENV !== 'production';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  try {
    res.setHeader('Cache-Control', 'no-store');
    if (isDev) return res.status(200).json({ buildId: 'development' });

    const buildId = fs.readFileSync('.next/BUILD_ID', 'utf8');

    res.status(200).json({
      buildId: buildId.trim(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to read build ID' });
  }
}
