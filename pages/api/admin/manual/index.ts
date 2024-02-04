import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';

const TARNUM_KEY = process.env.TARNUM_KEY;

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (
    process.env.NODE_ENV !== 'development' &&
    (!req.headers.authorization || req.headers.authorization !== TARNUM_KEY)
  )
    return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') return GET(req, res);

  return res.status(404).json({ error: 'Not found' });
}

const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  const inflation = await prisma.itemPrices.findMany({
    where: {
      manual_check: 'inflation',
    },
  });

  const info = await prisma.itemProcess.findMany({
    where: {
      processed: false,
      manual_check: {
        contains: `Merge`,
      },
    },
  });

  return res.json({ inflation, info });
};
