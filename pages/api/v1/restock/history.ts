import { NextApiRequest, NextApiResponse } from 'next';
import { shopIDToCategory } from '../../../../utils/utils';
import prisma from '../../../../utils/prisma';
import { CheckAuth } from '../../../../utils/googleCloud';
import { contributeCheck } from './wrapped-check';
import { getManyItems } from '../items/many';
import { ItemData, ItemRestockData } from '../../../../types';
import { RestockAuctionHistory } from '@prisma/generated/client';

const MODE_COST: { [cost: string]: number } = {
  '30days': 0,
  '7days': 1,
  '3days': 2,
  '1day': 4,
  '1hour': 8,
  '30min': 18,
};

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const id = req.query.id as string;
  const category = shopIDToCategory[id];

  const mode: string = (req.query.mode as string) ?? '30days';

  if (!category) return res.status(400).json({ error: 'Invalid Request' });

  const cost = MODE_COST[mode as string];
  if (typeof cost === 'undefined') return res.status(400).json({ error: 'Invalid Request' });

  if (cost !== 0) {
    try {
      const { user } = await CheckAuth(req);

      const contributeGoal = await contributeCheck(user?.id, cost);

      if (!contributeGoal.success) return res.status(403).json(contributeGoal);
    } catch (err) {
      const contributeGoal = await contributeCheck(undefined, cost);

      if (!contributeGoal.success) return res.status(403).json(contributeGoal);
    }
  }

  const lastDaysFormated = modeToTime(mode);

  const restockRaw = (await prisma.$queryRaw`
    select r.* from restockauctionhistory r 
    left join items i on i.internal_id  = r.item_iid
    left join itemprices p on p.item_iid = r.item_iid and p.isLatest = 1
    where r.type = 'restock' and i.category = ${category} and i.rarity <= 100 and r.addedAt >= ${lastDaysFormated} and r.owner != 'restock-haggle'
    order by p.price desc
    limit 50
  `) as RestockAuctionHistory[];

  const items = await getManyItems({
    id: restockRaw.map((p) => p.item_iid?.toString() ?? ''),
  });

  const restock: ItemRestockData[] = restockRaw.map((p): ItemRestockData & { item: ItemData } => {
    return {
      internal_id: p.internal_id,
      item_iid: p.item_iid,
      item: items[p.item_iid?.toString() ?? ''],
      stock: p.stock,
      price: p.price,
      addedAt: p.addedAt.toJSON(),
    };
  });

  return res.json(restock);
}

const modeToTime = (mode: string): string => {
  const time = new Date();
  switch (mode) {
    case '30days':
      time.setDate(time.getDate() - 30);
      break;
    case '7days':
      time.setDate(time.getDate() - 7);
      break;
    case '3days':
      time.setDate(time.getDate() - 3);
      break;
    case '1day':
      time.setDate(time.getDate() - 1);
      break;
    case '1hour':
      time.setHours(time.getHours() - 1);
      break;
    case '30min':
      time.setMinutes(time.getMinutes() - 30);
      break;
  }

  // format as YYYY-MM-DD HH:MI:SS
  return time.toISOString().split('.')[0].replace('T', ' ');
};
