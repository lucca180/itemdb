import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { getManyItems } from './many';

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

    if (!item) {
      i++;
      continue;
    }

    const pricedAt = new Date(owlsItem.date_of_last_update);

    if ((!item.owls || item.owls.pricedAt !== pricedAt.toJSON()) && owlsItem.owls_value) {
      let price = Number(owlsItem.owls_value.split('-')[0]);
      if (isNaN(price)) price = 0;

      await prisma.owlsPrice.create({
        data: {
          item: {
            connect: {
              internal_id: item.internal_id,
            },
          },
          value: owlsItem.owls_value,
          valueMin: price,
          pricedAt: pricedAt,
        },
      });

      item.owls = {
        value: owlsItem.owls_value,
        valueMin: price,
        pricedAt: pricedAt.toJSON(),
        buyable: owlsItem.owls_value.toLowerCase().includes('buyable'),
      };
    }

    if (!item.isNC) {
      await prisma.items.update({
        where: {
          internal_id: item.internal_id,
        },
        data: {
          rarity: 500,
          type: 'nc',
          isNC: true,
        },
      });

      item.isNC = true;
      item.type = 'nc';
      item.rarity = 500;
    }

    itemRes.push(item);
    i++;
  }

  if (itemRes.length < limit) {
    const owlsItem = await prisma.owlsPrice.findMany({
      distinct: ['item_iid'],
      where: {
        item_iid: {
          notIn: itemRes.map((item) => item.internal_id),
        },
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

  return itemRes;
};
