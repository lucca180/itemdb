import type { NextApiRequest, NextApiResponse } from 'next';
import { ItemAuctionData } from '../../../../../types';
import prisma from '../../../../../utils/prisma';
import { getManyItems } from '../many';
import { CheckAuth } from '../../../../../utils/googleCloud';
import { contributeCheck } from '../../restock/wrapped-check';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const id_name = req.query.id_name as string;
  const id = Number(id_name);
  if (!isNaN(id)) return res.status(400).json({ error: 'Invalid Request' });

  const name = id_name;
  const onlySold = req.query.sold === 'true';

  if (onlySold) {
    try {
      const { user } = await CheckAuth(req);

      const contributeGoal = await contributeCheck(user?.id, 4);

      if (!contributeGoal.success) return res.status(403).json(contributeGoal);
    } catch (err) {
      const contributeGoal = await contributeCheck(undefined, 4);

      if (!contributeGoal.success) return res.status(403).json(contributeGoal);
    }
  }

  const auction = await getAuctionData(name, onlySold);

  return res.json(auction);
}

const getAuctionData = async (name: string, onlySold = false) => {
  const auctionRaw = await prisma.restockAuctionHistory.findMany({
    where: {
      item: {
        name: name,
      },
      otherInfo: onlySold
        ? {
            not: {
              contains: 'nobody',
            },
          }
        : {},
      addedAt: {
        gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90),
      },
      type: 'auction',
    },
    orderBy: { addedAt: 'desc' },
  });

  const items = await getManyItems({
    id: auctionRaw.map((p) => p.item_iid.toString()),
  });

  const uniqueOwners = new Set();
  let soldAuctions = 0;
  const totalAuctions = auctionRaw.length;

  const auctions: ItemAuctionData[] = auctionRaw.map((p) => {
    uniqueOwners.add(p.owner);
    if (!p.otherInfo?.includes('nobody')) soldAuctions++;

    return {
      auction_id: p.neo_id,
      internal_id: p.internal_id,
      item: items[p.item_iid?.toString() ?? ''],
      price: p.price,
      owner: p.owner ?? 'unknown',
      isNF: !!p.otherInfo?.toLowerCase().split(',').includes('nf'),
      hasBuyer: !p.otherInfo?.includes('nobody'),
      addedAt: p.addedAt.toJSON(),
      timeLeft: p.otherInfo?.split(',')?.[1] ?? null,
    };
  });

  return {
    recent: auctions.slice(0, 20),
    total: totalAuctions,
    sold: soldAuctions,
    uniqueOwners: uniqueOwners.size,
    period: '90-days',
  };
};
