import axios from 'axios';
import { format } from 'date-fns';
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { Prisma } from '@prisma/generated/client';
import { LebronTrade, NCTradeItem, NCTradeReport } from '../../../../types';
import { CheckAuth } from '../../../../utils/googleCloud';
import requestIp from 'request-ip';
import { UTCDate } from '@date-fns/utc';
const LEBRON_URL = process.env.LEBRON_API_URL;

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') return POST(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
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

  const { tradeDate, itemsSent, itemsReceived } = tradeReportToOwlsTrade({
    date,
    offered,
    received,
    notes,
  });

  const body = {
    username: user.neopetsUser,
    trade_date: tradeDate,
    items_sent: itemsSent,
    items_received: itemsReceived,
    notes: notes,
  };

  const result = await axios.post(LEBRON_URL + 'report', body, {
    headers: {
      Authorization: 'Bearer ' + process.env.LEBRON_API_KEY,
      Referer: 'https://itemdb.com.br',
    },
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

  return res
    .status(200)
    .json({ success: true, message: 'Trade submitted successfully', lebron: result.data });
}

const tradeReportToOwlsTrade = (report: NCTradeReport): LebronTrade => {
  const trade: LebronTrade = {
    tradeDate: format(new UTCDate(report.date), 'yyyy-MM-dd') as any,
    notes: report.notes,
    itemsSent: '',
    itemsReceived: '',
  };

  report.offered.forEach((item, i) => {
    if (i > 0) trade.itemsSent += ' + ';
    if (item.quantity > 1) trade.itemsSent += `${item.quantity}x `;
    trade.itemsSent += `${item.itemName} (${item.personalValue})`;
  });

  report.received.forEach((item, i) => {
    if (i > 0) trade.itemsReceived += ' + ';
    if (item.quantity > 1) trade.itemsReceived += `${item.quantity}x `;
    trade.itemsReceived += `${item.itemName} (${item.personalValue})`;
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
