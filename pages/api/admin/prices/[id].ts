import { NextApiRequest, NextApiResponse } from 'next';
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

  if (req.method === 'POST') return POST(req, res);
  if (req.method === 'DELETE') return DELETE(req, res);
}

const POST = async (req: NextApiRequest, res: NextApiResponse) => {
  const priceID = req.query.id as string;
  const { newPrice, isInflation, item_iid, newAddedAt } = req.body;
  let noInflation_id = undefined;

  if (isInflation === true) {
    const prices = await prisma.itemPrices.findFirst({
      where: {
        item_iid: Number(item_iid),
        noInflation_id: null,
        internal_id: {
          not: Number(priceID),
        },
      },
      orderBy: {
        addedAt: 'desc',
      },
    });

    if (prices) {
      noInflation_id = prices.internal_id;
    }
  }

  if (isInflation === false) {
    noInflation_id = null;
  }

  const updated = await prisma.itemPrices.update({
    where: {
      internal_id: Number(priceID),
    },
    data: {
      noInflation_id: noInflation_id,
      price: newPrice,
      addedAt: newAddedAt ? new Date(newAddedAt) : undefined,
    },
  });

  return res.json(updated);
};

const DELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const priceID = req.query.id as string;

  await prisma.itemPrices.delete({
    where: {
      internal_id: Number(priceID),
    },
  });

  return res.json(true);
};
