import type { NextApiRequest, NextApiResponse } from 'next';
import { CheckAuth } from '@utils/googleCloud';
import { processItemProcessQueue, type ItemChangesLog } from '@utils/item/processItemQueue';

const TARNUM_KEY = process.env.TARNUM_KEY;
const isDev = process.env.NODE_ENV === 'development';

async function authorizeProcess(req: NextApiRequest, res: NextApiResponse) {
  if (isDev) return true;

  const authorization = req.headers.authorization;

  if (authorization === TARNUM_KEY) return true;
  if (authorization?.includes('Bearer')) return true;

  try {
    const user = (await CheckAuth(req)).user;
    if (user?.isAdmin) return true;
  } catch {
    // fall through to unauthorized
  }

  res.status(401).json({ error: 'Unauthorized' });
  return false;
}

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!(await authorizeProcess(req, res))) return;

  const body = req.body ?? {};

  const result = await processItemProcessQueue({
    limit: body.limit,
    offset: body.offset,
    checkAll: body.checkAll === 'true',
    skipColors: req.query.skipColors === 'true',
  });

  // Keep the previous response shape: prisma $transaction tuple-like + manualChecks
  return res.json({
    0: { count: result.created },
    1: { count: result.colorsCreated },
    2: { count: result.processed },
    manualChecks: result.manualChecks,
  });
}

export { getPalette } from '@utils/item/itemPalette';
export type { ItemChangesLog };
