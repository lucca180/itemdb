import { NextApiRequest, NextApiResponse } from 'next';
import { getItem } from '../../items/[id_name]';
import prisma from '@utils/prisma';
import { getManyItems } from '../../items/many';
import { InsightsResponse } from '@types';
import { rawToList } from '../../lists/[username]';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function GET(req: NextApiRequest, res: NextApiResponse) {
  const item_iid = req.query.iid as string;

  const item = getItem(item_iid);

  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const result = await getNCTradeInsights(item_iid);
  return res.status(200).json(result);
}

export const getNCTradeInsights = async (item_iid: string | number): Promise<InsightsResponse> => {
  const openReports = await prisma.openableItems.findMany({
    where: {
      item_iid: Number(item_iid),
    },
  });

  const parentData: {
    [parent_iid: number]: {
      isLE: boolean;
    };
  } = {};

  openReports.forEach((report) => {
    if (!report.parent_iid) return;

    if (!parentData[report.parent_iid]) {
      parentData[report.parent_iid] = {
        isLE: false,
      };
    }

    if (
      report.notes?.toLowerCase().includes('le') ||
      report.prizePool?.toLowerCase().includes('le') ||
      report.limitedEdition
    ) {
      parentData[report.parent_iid].isLE = true;
    }
  });

  const parent_iids = Object.keys(parentData).map((key) => Number(key));

  const releasesRaw = prisma.ncMallData.findMany({
    distinct: ['saleBegin', 'item_iid'],
    where: {
      item_iid: {
        in: [...parent_iids, Number(item_iid)],
      },
    },
    orderBy: [
      {
        addedAt: 'desc',
      },
      {
        price: 'asc',
      },
    ],
  });

  const itemDataRaw = getManyItems({ id: Object.keys(parentData) });

  const ncEventsRaw = prisma.userList.findMany({
    where: {
      official: true,
      official_tag: 'NC Event',
      items: {
        some: {
          item_iid: Number(item_iid),
        },
      },
      seriesStart: {
        not: null,
      },
    },
    include: {
      items: true,
      user: true,
    },
  });

  const [releases, itemData, ncEvents] = await Promise.all([releasesRaw, itemDataRaw, ncEventsRaw]);

  const lists = ncEvents.map((event) => rawToList(event, event.user));

  return {
    releases: releases.map((release) => {
      return {
        ...release,
        addedAt: release.addedAt.toISOString(),
        updatedAt: release.updatedAt.toISOString(),
        saleBegin: release.saleBegin ? release.saleBegin.toISOString() : null,
        saleEnd: release.saleEnd ? release.saleEnd.toISOString() : null,
        discountBegin: release.discountBegin ? release.discountBegin.toISOString() : null,
        discountEnd: release.discountEnd ? release.discountEnd.toISOString() : null,
        active: !!release.active,
      };
    }),
    ncEvents: lists,
    parentData: parentData,
    itemData: itemData,
  };
};
