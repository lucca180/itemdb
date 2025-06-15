import axios from 'axios';
import { format, isSameDay } from 'date-fns';
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { Prisma } from '@prisma/generated/client';
import { NCTradeItem, NCTradeReport, OwlsTrade } from '../../../../types';
import { CheckAuth } from '../../../../utils/googleCloud';
import { UTCDate } from '@date-fns/utc';
import requestIp from 'request-ip';
import { getManyItems } from '../items/many';

type OwlsRes = {
  recent_updates: {
    api_name: string;
    date_of_last_update: string;
    owls_value: string;
  }[];
};

const OWLS_URL = process.env.OWLS_API_URL;

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);
  if (req.method === 'POST') return POST(req, res);

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

async function POST(req: NextApiRequest, res: NextApiResponse<any>) {
  const { offered, received, notes, date } = req.body as NCTradeReport;

  if (!offered || !received || !date)
    return res.status(400).json({ error: 'Missing required fields' });

  let user = null;

  try {
    user = (await CheckAuth(req)).user;
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!user || user.banned || !user.neopetsUser)
    return res.status(401).json({ error: 'Unauthorized' });

  const ip = requestIp.getClientIp(req);

  const itemsCreate: Prisma.ncTradeItemsCreateManyTradeInput[] = [];

  offered.forEach((offeredItem) => {
    if (!offeredItem.item && !offeredItem.itemName) return;

    itemsCreate.push(toTradeItem(offeredItem, 'offered'));
  });

  received.forEach((receivedItem) => {
    if (!receivedItem.item && !receivedItem.itemName) return;

    itemsCreate.push(toTradeItem(receivedItem, 'received'));
  });

  await prisma.ncTrade.create({
    data: {
      reporter_id: user.id,
      tradeDate: new Date(date),
      notes: notes,
      ip_address: ip,
      NCTradeItems: {
        createMany: {
          data: itemsCreate,
          skipDuplicates: true,
        },
      },
    },
  });

  const { ds, traded, traded_for } = tradeReportToOwlsTrade({
    date,
    offered,
    received,
    notes,
  });

  const result = await axios.post(OWLS_URL + '/transactions/submit', {
    user_id: user.neopetsUser,
    date: ds,
    traded: traded,
    traded_for: traded_for,
    notes: notes,
  });

  return res.status(result.status).json(result.data);
}

export const getLatestOwls = async (limit = 20) => {
  if (!OWLS_URL) return [];
  const owlsRes = await axios.get(OWLS_URL + '/recent_updates');
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

const tradeReportToOwlsTrade = (report: NCTradeReport): OwlsTrade => {
  const trade: OwlsTrade = {
    ds: format(new UTCDate(report.date), 'yyyy-MM-dd'),
    notes: report.notes,
    traded: '',
    traded_for: '',
  };

  report.offered.forEach((item, i) => {
    if (i > 0) trade.traded += ' + ';
    if (item.quantity > 1) trade.traded += `${item.quantity}x `;
    trade.traded += `${item.itemName} (${item.personalValue})`;
  });

  report.received.forEach((item, i) => {
    if (i > 0) trade.traded_for += ' + ';
    if (item.quantity > 1) trade.traded_for += `${item.quantity}x `;
    trade.traded_for += `${item.itemName} (${item.personalValue})`;
  });

  return trade;
};

const toTradeItem = (
  tradeItemRaw: NCTradeItem,
  type: 'offered' | 'received'
): Prisma.ncTradeItemsCreateManyTradeInput => {
  const tradeItem: Prisma.ncTradeItemsCreateManyTradeInput = {
    item_iid: tradeItemRaw.item?.internal_id,
    item_name: tradeItemRaw.itemName || undefined,
    quantity: Number(tradeItemRaw.quantity),
    personalValue: tradeItemRaw.personalValue,
    pvMinValue: Number(tradeItemRaw.personalValue.split('-').at(0)),
    pvMaxValue: Number(tradeItemRaw.personalValue.split('-').at(-1)),
    type: type,
  };

  return tradeItem;
};
