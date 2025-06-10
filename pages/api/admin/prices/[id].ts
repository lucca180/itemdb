import { NextApiRequest, NextApiResponse } from 'next';
import { CheckAuth } from '../../../../utils/googleCloud';
import prisma from '../../../../utils/prisma';
import { User } from '@types';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  let user: User | null = null;
  try {
    user = (await CheckAuth(req)).user;
    if (!user || !user.isAdmin) throw new Error('Unauthorized');
  } catch (e) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (req.method === 'POST') return POST(req, res, user);
  if (req.method === 'DELETE') return DELETE(req, res, user);
}

const POST = async (req: NextApiRequest, res: NextApiResponse, user: User) => {
  const priceID = req.query.id as string;
  const { newPrice, isInflation, item_iid, priceContext } = req.body;
  let noInflation_id = undefined;

  const originalPrice = await prisma.itemPrices.findUnique({
    where: {
      internal_id: Number(priceID),
    },
  });

  if (!originalPrice) return res.status(404).json({ error: 'Price not found' });

  noInflation_id = originalPrice.noInflation_id;

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
      usedProcessIDs: 'manual_edit',
      priceContext: priceContext || undefined,
    },
  });

  await prisma.actionLogs.create({
    data: {
      actionType: 'editPrice',
      subject_id: item_iid.toString(),
      logData: {
        originalPrice,
        updatedPrice: updated,
      },
      user_id: user.id,
    },
  });

  return res.json(updated);
};

const DELETE = async (req: NextApiRequest, res: NextApiResponse, user: User) => {
  const priceID = req.query.id as string;

  const originalPrice = await prisma.itemPrices.findUnique({
    where: {
      internal_id: Number(priceID),
    },
  });

  if (!originalPrice) {
    return res.status(404).json({ error: 'Price not found' });
  }

  await prisma.itemPrices.delete({
    where: {
      internal_id: Number(priceID),
    },
  });

  await prisma.actionLogs.create({
    data: {
      actionType: 'deletePrice',
      subject_id: originalPrice.item_iid?.toString(),
      logData: originalPrice,
      user_id: user.id,
    },
  });

  if (!originalPrice.isLatest) return res.json(true);

  const lastOne = await prisma.itemPrices.findFirst({
    where: {
      item_iid: originalPrice.item_iid,
    },
    orderBy: {
      addedAt: 'desc',
    },
  });

  if (lastOne) {
    await prisma.itemPrices.update({
      where: {
        internal_id: lastOne.internal_id,
      },
      data: {
        isLatest: true,
      },
    });
  }

  return res.json(true);
};
