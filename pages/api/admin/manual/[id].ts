import type { NextApiRequest, NextApiResponse } from 'next';
import { CheckAuth } from '../../../../utils/googleCloud';
import prisma from '../../../../utils/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = (await CheckAuth(req)).user;
    if (!user || !user.isAdmin) throw new Error('Unauthorized');
  } catch (e) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (req.method === 'GET') return GET(req, res);
  if (req.method === 'POST') return POST(req, res);
}

const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  const id = req.query.id as string;

  const inflation = await prisma.itemPrices.findFirst({
    where: {
      item_iid: Number(id),
      manual_check: 'inflation',
    },
  });

  const info = await prisma.itemProcess.findFirst({
    where: {
      processed: false,
      manual_check: {
        contains: `(${id})`,
      },
    },
  });

  console.log(info);

  return res.json({ inflation, info });
};

const POST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { type, action, checkID } = req.body;
  const id = req.query.id as string;

  if (type === 'inflation') {
    if (action === 'approve') {
      await prisma.itemPrices.update({
        where: {
          internal_id: checkID,
        },
        data: {
          manual_check: null,
        },
      });

      return res.json({ success: true });
    }

    if (action === 'reprove') {
      await prisma.itemPrices.delete({
        where: {
          internal_id: checkID,
        },
      });

      return res.json({ success: true });
    }

    if (action === 'not_inflated') {
      await prisma.itemPrices.update({
        where: {
          internal_id: checkID,
        },
        data: {
          manual_check: null,
          noInflation_id: null,
        },
      });

      return res.json({ success: true });
    }
  }

  if (type === 'info') {
    if (action === 'approve') {
      await prisma.itemProcess.updateMany({
        where: {
          processed: false,
          manual_check: {
            contains: `(${id})`,
          },
        },
        data: {
          manual_check: null,
        },
      });

      return res.json({ success: true });
    }

    if (action === 'reprove') {
      await prisma.itemProcess.update({
        where: {
          internal_id: checkID,
        },
        data: {
          processed: true,
        },
      });

      return res.json({ success: true });
    }
  }

  return res.status(400).json({ error: 'Bad Request' });
};
