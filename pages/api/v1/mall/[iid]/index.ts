import { NextApiRequest, NextApiResponse } from 'next';
import { getItem } from '../../items/[id_name]';
import prisma from '@utils/prisma';
import { ncTradeItems, ncValues } from '@prisma/generated/client';
import { dti } from '@utils/impress';
import { differenceInCalendarDays } from 'date-fns';
import { NCValue, OwlsTrade } from '@types';
import { getOwlsTradeData } from '../../items/[id_name]/[tradings]';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  const item_iid = req.query.iid as string;

  const item = await getItem(item_iid);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const value = await getNCValue(item.internal_id, item.name, 15);

  return res.status(200).json(value);
};

export const getNCValue = async (
  item_iid: number,
  itemName: string,
  updateInterval = 15,
  shouldReturnUpdated = true
) => {
  const valueRaw = await prisma.ncValues.findFirst({
    where: {
      item_iid: Number(item_iid),
      isLatest: true,
    },
  });

  let value: NCValue | null = valueRaw ? rawToNCValue(valueRaw) : null;

  if (
    !valueRaw ||
    differenceInCalendarDays(Date.now(), valueRaw.lastChangeCheck ?? 0) > updateInterval
  ) {
    if (!shouldReturnUpdated) {
      // not awaiting the update if we don't need the updated value
      updateNCValue(Number(item_iid), itemName, valueRaw ? rawToNCValue(valueRaw) : undefined);

      return value;
    }

    value =
      (await updateNCValue(
        Number(item_iid),
        itemName,
        valueRaw ? rawToNCValue(valueRaw) : undefined
      )) || value;
  }

  return value;
};

const updateNCValue = async (item_iid: number, itemName: string, oldValue?: NCValue) => {
  const tradesRaw = prisma.ncTradeItems.findMany({
    where: {
      item_iid: item_iid,
      trade: {
        tradeDate: {
          gt: oldValue ? new Date(oldValue.addedAt) : undefined,
        },
      },
    },
    include: {
      trade: {
        select: {
          tradeDate: true,
        },
      },
    },
  });

  const owlsTradesRaw = getOwlsTradeData(itemName);

  const ratiosRaw = dti.fetchRatiosByName(itemName).catch((e) => {
    console.error('Error fetching ratios:', e);
    return null;
  });

  const [tradesDb, ratios, owlsTrades] = await Promise.all([tradesRaw, ratiosRaw, owlsTradesRaw]);

  const trades = [...tradesDb, ...owlsTrades];

  if (trades.length < 3) {
    const updated = oldValue
      ? await prisma.ncValues.update({
          where: {
            item_iid_isLatest: {
              item_iid: item_iid,
              isLatest: true,
            },
          },
          data: {
            lastChangeCheck: new Date(),
          },
        })
      : null;

    return updated ? rawToNCValue(updated) : null;
  }

  const seeking = ratios?.numUsersSeekingThis;
  const offering = ratios?.numUsersOfferingThis;

  const ratio = ratios ? (seeking! / offering!) * 100 : null;
  const value = calculateItemValue(ratio, trades, itemName);
  const valueRange = value[0] !== value[1] ? `${value[0]}-${value[1]}` : `${value[0]}`;

  if (valueRange === oldValue?.range) {
    const updated = await prisma.ncValues.update({
      where: {
        item_iid_isLatest: {
          item_iid: item_iid,
          isLatest: true,
        },
      },
      data: {
        lastChangeCheck: new Date(),
      },
    });

    return rawToNCValue(updated);
  }

  const update = prisma.ncValues.updateMany({
    where: {
      item_iid: item_iid,
      isLatest: true,
    },
    data: {
      isLatest: null,
    },
  });

  const create = prisma.ncValues.create({
    data: {
      item_iid: item_iid,
      minValue: value[0],
      maxValue: value[1],
      valueRange: valueRange,
      addedAt: new Date(),
      lastChangeCheck: new Date(),
      isLatest: true,
      valueContext: {
        seeking: seeking || 0,
        offering: offering || 0,
        ratio: ratio || null,
      },
    },
  });

  const [, newVal] = await prisma.$transaction([update, create]);

  return rawToNCValue(newVal);
};

type itemdbTrade = ncTradeItems & {
  trade: {
    tradeDate: Date;
  };
};

type tradeHistory = itemdbTrade | OwlsTrade;

function calculateItemValue(ratio: number | null, tradeHistory: tradeHistory[], itemName: string) {
  // uses an exponential decay function to weight the trades based on their age
  const weighted = tradeHistory
    .map((t) => getTradeHistoryValues(t, itemName))
    .filter((x) => x !== null) as {
    min: number;
    max: number;
    weight: number;
  }[];

  const totalWeight = weighted.reduce((a, b) => a + b.weight, 0);

  const minHist = weighted.reduce((a, b) => a + b.min * b.weight, 0) / totalWeight || 1;
  const maxHist = weighted.reduce((a, b) => a + b.max * b.weight, 0) / totalWeight || 1;

  if (!ratio || isNaN(ratio)) {
    return [Math.floor(minHist), Math.round(maxHist)];
  }

  const [minRate, maxRate] = mapToRange(ratio).split('-').map(Number);

  // Calculate the final value using a weighted average of the historical values and the current rate
  const nEffective = totalWeight;
  const alpha = 1 / (1 + nEffective * 1.5);
  const vFinalMin = alpha * minRate + (1 - alpha) * minHist;
  const vFinalMax = alpha * maxRate + (1 - alpha) * maxHist;

  return [Math.floor(vFinalMin), Math.round(vFinalMax)];
}

function mapToRange(ratio: number) {
  if (ratio < 40) return '1-2';
  if (ratio < 50) return '2-2';
  if (ratio < 60) return '2-3';
  if (ratio < 70) return '3-4';
  if (ratio < 80) return '3-4';
  if (ratio < 90) return '4-5';
  if (ratio < 100) return '5-6';
  if (ratio < 110) return '4-6';
  if (ratio < 130) return '5-8';
  if (ratio < 150) return '6-8';
  if (ratio < 180) return '8-10';
  if (ratio < 220) return '10-15';
  if (ratio < 270) return '15-20';
  if (ratio < 320) return '20-30';
  return '30-30';
}

const rawToNCValue = (raw: ncValues): NCValue => {
  return {
    minValue: raw.minValue,
    maxValue: raw.maxValue,
    range: raw.valueRange,
    addedAt: new Date(raw.addedAt).toJSON(),
  };
};

const getTradeHistoryValues = (trade: any, itemName: string) => {
  const itemdbTrade = trade as itemdbTrade;
  const owlsTrade = trade as unknown as OwlsTrade;
  const now = Date.now();
  const lambda = 0.005;

  if (typeof trade.personalValue !== 'undefined') {
    const deltaT = (now - itemdbTrade.trade.tradeDate.getTime()) / (1000 * 60 * 60 * 24);
    const weight = Math.exp(-lambda * deltaT);

    return { min: itemdbTrade.pvMinValue, max: itemdbTrade.pvMaxValue, weight };
  }
  const tradeDate = new Date(owlsTrade.ds);
  const deltaT = (now - tradeDate.getTime()) / (1000 * 60 * 60 * 24);
  const weight = Math.exp(-lambda * deltaT);

  const val = getItemValueOwls(owlsTrade, itemName);
  if (!val) return null;

  return { min: val[0], max: val[1] ?? val[0], weight };
};

const getItemValueOwls = (trade: OwlsTrade, itemName: string) => {
  const targetItem =
    trade.traded.split('+').find((traded) => isSameItem(traded, itemName)) ||
    trade.traded_for.split('+').find((traded) => isSameItem(traded, itemName));

  if (!targetItem) return null;

  const values =
    targetItem
      .match(/\((\d+)(?:-(\d+))?\)/)
      ?.slice(1)
      .map((value) => parseInt(value))
      .filter((x) => !isNaN(x)) ?? [];

  if (values.length === 0) return null;

  return values;
};
const isSameItem = (tradeStr: string, itemName: string) =>
  tradeStr.toLowerCase().includes(itemName.toLowerCase());
