import type { NextApiRequest, NextApiResponse } from 'next';

export default function handle(_req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    ok: true,
    buildId: process.env.BUILD_ID ?? null,
  });
}
