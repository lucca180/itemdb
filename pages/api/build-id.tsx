import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';

const isDev = process.env.NODE_ENV !== 'production';
let cachedBuildId: string | null = null;

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (isDev) return res.status(200).json({ buildId: 'development' });

    if (!cachedBuildId) {
      cachedBuildId = fs.readFileSync('.next/BUILD_ID', 'utf8');
    }

    res.setHeader('Cache-Control', 'max-age 0, s-maxage 60, stale-while-revalidate 60');

    res.status(200).json({
      buildId: cachedBuildId.trim(),
    });
  } catch {
    res.status(500).json({ error: 'Failed to read build ID' });
  }
}
