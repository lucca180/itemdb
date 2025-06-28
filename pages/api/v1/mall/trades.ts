/* eslint-disable @typescript-eslint/no-unused-vars */
import axios from 'axios';
import { isSameDay } from 'date-fns';
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { Prisma } from '@prisma/generated/client';
import { NCTradeItem, NCTradeReport } from '../../../../types';
import { CheckAuth } from '../../../../utils/googleCloud';
import requestIp from 'request-ip';
import { getManyItems } from '../items/many';

type OwlsRes = {
  recent_updates: {
    api_name: string;
    date_of_last_update: string;
    owls_value: string;
  }[];
};

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  // if (req.method === 'GET') return GET(req, res);
  if (req.method === 'POST') return POST(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// async function GET(req: NextApiRequest, res: NextApiResponse<any>) {
//   let limit = req.query.limit ? Number(req.query.limit) : 20;
//   limit = Math.min(limit, 20);

//   const itemRes = await getLatestOwls(limit);

//   return res.status(200).json(itemRes);
// }

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

  // const { ds, traded, traded_for } = tradeReportToOwlsTrade({
  //   date,
  //   offered,
  //   received,
  //   notes,
  // });

  // const result = await axios.post(OWLS_URL + '/transactions/submit', {
  //   user_id: user.neopetsUser,
  //   date: ds,
  //   traded: traded,
  //   traded_for: traded_for,
  //   notes: notes,
  // });

  return res.status(200).json({ success: true, message: 'Trade submitted successfully' });
}

// const tradeReportToOwlsTrade = (report: NCTradeReport): OwlsTrade => {
//   const trade: OwlsTrade = {
//     ds: format(new UTCDate(report.date), 'yyyy-MM-dd'),
//     notes: report.notes,
//     traded: '',
//     traded_for: '',
//   };

//   report.offered.forEach((item, i) => {
//     if (i > 0) trade.traded += ' + ';
//     if (item.quantity > 1) trade.traded += `${item.quantity}x `;
//     trade.traded += `${item.itemName} (${item.personalValue})`;
//   });

//   report.received.forEach((item, i) => {
//     if (i > 0) trade.traded_for += ' + ';
//     if (item.quantity > 1) trade.traded_for += `${item.quantity}x `;
//     trade.traded_for += `${item.itemName} (${item.personalValue})`;
//   });

//   return trade;
// };

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
