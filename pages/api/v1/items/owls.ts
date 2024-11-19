import axios from 'axios';
import { isSameDay } from 'date-fns';
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { getManyItems } from './many';
import { Prisma } from '@prisma/client';

type OwlsRes = {
  recent_updates: {
    api_name: string;
    date_of_last_update: string;
    owls_value: string;
  }[];
};

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function GET(req: NextApiRequest, res: NextApiResponse<any>) {
  let limit = req.query.limit ? Number(req.query.limit) : 20;
  limit = Math.min(limit, 20);

  const itemRes = await getLatestOwls(limit);

  return res.status(200).json(itemRes);
}

export const getLatestOwls = async (limit = 20) => {
  const owlsRes = await axios.get('https://neo-owls.net/recent_updates');
  const owlsData = owlsRes.data as OwlsRes;

  const names = owlsData.recent_updates.map((owl) => owl.api_name);

  const items = await getManyItems({ name: names });

  const itemRes = [];

  let i = 0;

  while (itemRes.length < limit) {
    if (i >= owlsData.recent_updates.length) break;
    const owlsItem = owlsData.recent_updates[i];
    const item = items[owlsItem.api_name];

    if (!item || !item.isNC || !owlsItem.owls_value) {
      i++;
      continue;
    }

    const pricedAt = new Date(owlsItem.date_of_last_update);
    const itemdbPricedAt = new Date(item.owls?.pricedAt ?? 0);

    if ((!item.owls || !isSameDay(pricedAt, itemdbPricedAt)) && owlsItem.owls_value) {
      let price = Number(owlsItem.owls_value.split('-')[0]);
      if (isNaN(price)) price = 0;

      const updateAll = prisma.owlsPrice.updateMany({
        where: {
          item_iid: item.internal_id,
          isLatest: true,
        },
        data: {
          isLatest: null,
        },
      });

      const createAll = prisma.owlsPrice.create({
        data: {
          item_iid: item.internal_id,
          value: owlsItem.owls_value,
          valueMin: price,
          pricedAt: pricedAt,
          isLatest: true,
        },
      });

      await prisma.$transaction([updateAll, createAll], {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });

      item.owls = {
        value: owlsItem.owls_value,
        valueMin: price,
        pricedAt: pricedAt.toJSON(),
        buyable: owlsItem.owls_value.toLowerCase().includes('buyable'),
      };
    }

    itemRes.push(item);
    i++;
  }

  if (itemRes.length < limit) {
    const owlsItem = await prisma.owlsPrice.findMany({
      where: {
        item_iid: {
          notIn: itemRes.map((item) => item.internal_id),
        },
        isLatest: true,
      },
      orderBy: {
        pricedAt: 'desc',
      },
      take: limit - itemRes.length,
    });

    const newItems = await getManyItems({
      id: owlsItem.map((item) => item.item_iid.toString()),
    });

    itemRes.push(...Object.values(newItems));
  }

  return itemRes.sort((a, b) => {
    if (!a.owls || !b.owls) return 0;
    return new Date(b.owls.pricedAt).getTime() - new Date(a.owls.pricedAt).getTime();
  });
};
