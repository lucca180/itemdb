import { NextApiRequest, NextApiResponse } from 'next';
import { CheckAuth } from '../../../../utils/googleCloud';
import { isValid } from 'date-fns';
import prisma from '../../../../utils/prisma';
import { UTCDate } from '@date-fns/utc';
import { doProcessPrices, MAX_PAST_DAYS } from '../../v1/prices/process';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = (await CheckAuth(req)).user;
    if (!user || !user.isAdmin) throw new Error('Unauthorized');
  } catch (e) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (req.method === 'POST') return POST(req, res);
  if (req.method === 'PATCH') return PATCH(req, res);
}

async function POST(req: NextApiRequest, res: NextApiResponse) {
  const { price, isInflation, item_iid, addedAt } = req.body;

  if (!isValid(new Date(addedAt)) || isNaN(price) || isNaN(item_iid)) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const lastPrice = await prisma.itemPrices.findFirst({
    where: {
      item_iid: Number(item_iid),
    },
    orderBy: {
      addedAt: 'desc',
    },
  });

  let noInflation_id = null;
  if (isInflation && lastPrice) noInflation_id = lastPrice.noInflation_id ?? lastPrice.internal_id;

  const utcAddedAt = new UTCDate(new UTCDate(addedAt).setHours(18));

  const newIsLatest = lastPrice ? lastPrice.addedAt.getTime() < utcAddedAt.getTime() : true;

  if (newIsLatest && lastPrice) {
    await prisma.itemPrices.update({
      where: {
        internal_id: lastPrice.internal_id,
      },
      data: {
        isLatest: null,
      },
    });
  }

  const newPrice = await prisma.itemPrices.create({
    data: {
      item_iid: Number(item_iid),
      price: price,
      noInflation_id: noInflation_id,
      addedAt: new UTCDate(new UTCDate(addedAt).setHours(18)),
      usedProcessIDs: 'admin_price',
      isLatest: newIsLatest ? true : null,
    },
  });

  return res.json(newPrice);
}

async function PATCH(req: NextApiRequest, res: NextApiResponse) {
  const { item_iid } = req.body;

  if (isNaN(item_iid)) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const lastPrice = await prisma.itemPrices.findFirst({
    where: {
      item_iid: Number(item_iid),
    },
    orderBy: {
      addedAt: 'desc',
    },
  });

  const maxPast = Math.max(
    Date.now() - MAX_PAST_DAYS * 24 * 60 * 60 * 1000,
    lastPrice?.addedAt.getTime() ?? 0
  );

  const priceProcess = await prisma.priceProcess2.findMany({
    where: {
      item_iid: Number(item_iid),
      processed: false,
      addedAt: {
        gte: new Date(maxPast),
      },
    },
  });

  if (!priceProcess.length) {
    return res.status(400).json({ error: 'Nothing to process' });
  }

  const result = await doProcessPrices(priceProcess, [Number(item_iid)], true);

  return res.json(result);
}
