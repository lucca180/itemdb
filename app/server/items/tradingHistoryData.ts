import 'server-only';

import type { ItemAuctionData, ItemRestockData, TradeData } from '@types';
import prisma from '@utils/prisma';
import { getItem } from '@pages/api/v1/items/[id_name]';
import { medianSorted } from 'simple-statistics';
import { removeOutliersCombined } from '@utils/prices/pricing3';
import { addTradeRelistingHistory, findTradeTargetItem } from '@utils/item/tradeRelisting';

const MAX_DAYS = 180;

export const getRestockData = async (name: string) => {
  const restockRaw = await prisma.restockAuctionHistory.findMany({
    where: {
      item: {
        name: name,
      },
      type: 'restock',
      owner: {
        not: 'restock-haggle',
      },
      addedAt: {
        gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * MAX_DAYS),
      },
    },
    orderBy: { addedAt: 'desc' },
  });

  const item = await getItem(restockRaw[0]?.item_iid || 0);

  let totalStock = 0;

  const restock: ItemRestockData[] = restockRaw.map((p): ItemRestockData => {
    totalStock += p.stock;
    return {
      internal_id: p.internal_id,
      item_iid: p.item_iid,
      stock: p.stock,
      price: p.price,
      addedAt: p.addedAt.toJSON(),
    };
  });

  return {
    recent: restock.slice(0, 40),
    item: item,
    appearances: restock.length,
    totalStock: totalStock,
    period: MAX_DAYS,
  };
};

export const getTradeData = async (
  name: string | number,
  onlyPriced = false,
  includeRelisting = false
) => {
  const target = typeof name === 'string' ? { itemName: name } : { itemIid: name };
  const tradeRaw = await prisma.trades.findMany({
    where: {
      items: {
        some: typeof name === 'string' ? { item: { name: name } } : { item_iid: name },
      },
      addedAt: {
        gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * MAX_DAYS),
      },
      priced: onlyPriced ? true : undefined,
    },
    include: {
      items: {
        include: {
          item: true,
        },
      },
    },
    orderBy: { addedAt: 'desc' },
  });

  const allTrades: TradeData[] = tradeRaw.map((p) => {
    return {
      trade_id: p.trade_id,
      owner: p.owner,
      priced: p.priced,
      hash: p.hash,
      instantBuy: p.instantBuy || null,
      createdAt: p.createdAt ? p.createdAt.toJSON() : null,
      items: p.items.map((i) => ({
        internal_id: i.internal_id,
        trade_id: i.trade_id,
        name: i.item?.name || '',
        image: i.item?.image || '',
        image_id: i.item?.image_id || '',
        item_iid: i.item_iid || null,
        price: i.price?.toNumber() || null,
        order: i.order,
        addedAt: i.addedAt.toJSON(),
        amount: i.amount,
      })),
      wishlist: p.wishlist,
      processed: p.processed,
      addedAt: p.addedAt.toJSON(),
    };
  });

  const tradeList = (
    includeRelisting ? addTradeRelistingHistory(allTrades, target) : allTrades
  ).filter((trade) => !onlyPriced || !!findTradeTargetItem(trade, target)?.price);
  const uniqueOwners = new Set(tradeList.map((trade) => trade.owner));
  const priced = tradeList.filter((trade) => {
    const item = findTradeTargetItem(trade, target);
    return trade.priced && !!item?.price;
  }).length;

  return {
    recent: tradeList.slice(0, 40),
    total: onlyPriced ? tradeRaw.length : tradeList.length,
    uniqueOwners: uniqueOwners.size,
    priced: priced,
    period: MAX_DAYS,
  };
};

export const getAuctionData = async (name: string | number, onlySold = false) => {
  let auctionRaw = await prisma.restockAuctionHistory.findMany({
    where: {
      item:
        typeof name === 'string'
          ? {
              name: name,
            }
          : undefined,
      item_iid: typeof name === 'number' ? name : undefined,
      otherInfo: onlySold
        ? {
            not: {
              contains: 'nobody',
            },
          }
        : {},
      addedAt: {
        gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * MAX_DAYS),
      },
      type: 'auction',
    },
    orderBy: { addedAt: 'desc' },
  });

  // auction always has the same item
  const item = await getItem(auctionRaw[0]?.item_iid || 0);

  // only include < 30 min or closed auctions
  if (onlySold) {
    auctionRaw = auctionRaw.filter((p) => {
      const otherInfo = p.otherInfo?.toLowerCase() || '';
      return otherInfo.includes('< 30 min') || otherInfo.includes('closed');
    });
  }

  const uniqueOwners = new Set();
  let soldAuctions = 0;
  const totalAuctions = auctionRaw.length;

  const auctions: ItemAuctionData[] = auctionRaw.map((p) => {
    uniqueOwners.add(p.owner);
    if (!p.otherInfo?.includes('nobody')) soldAuctions++;

    const parts = p.otherInfo?.split(',') ?? [];
    const flagPart = parts[0]?.toLowerCase() ?? '';
    const flag = flagPart.includes('nf') ? 'NF' : flagPart.includes('gm') ? 'GM' : null;
    const bidRaw = parts[3];
    const bidParsed = bidRaw != null && bidRaw !== '' ? Number(bidRaw) : NaN;
    const bidCount = Number.isInteger(bidParsed) ? bidParsed : null;

    return {
      auction_id: p.neo_id,
      internal_id: p.internal_id,
      item_iid: p.item_iid,
      price: p.price,
      owner: p.owner ?? 'unknown',
      isNF: flag === 'NF',
      flag,
      hasBuyer: !p.otherInfo?.includes('nobody'),
      addedAt: p.addedAt.toJSON(),
      timeLeft: parts[1] ?? null,
      bidCount,
    };
  });

  const recentAuctions = auctions
    .slice(0, 40)
    .map((p) => p.price)
    .sort((a, b) => a - b);

  const median =
    recentAuctions.length >= 5 ? medianSorted(removeOutliersCombined(recentAuctions)) : null;

  return {
    recent: auctions.slice(0, 40),
    item: item,
    total: totalAuctions,
    sold: soldAuctions,
    uniqueOwners: uniqueOwners.size,
    period: MAX_DAYS,
    priceMedian: median,
  };
};
