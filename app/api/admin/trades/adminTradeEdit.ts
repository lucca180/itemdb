import type { TradeData } from '@types';
import type { TradeItems, Trades } from '@prisma/generated/client';
import prisma from '@utils/prisma';

/** Prices above this do not fit TradeItems / PriceProcess2 Decimal(11, 0). */
const MAX_SUPPORTED_NUMBER = 99999999999;

type TradeWithItems = Trades & {
  items: (TradeItems & {
    item: { name: string; image: string | null; image_id: string | null } | null;
  })[];
};

export class AdminTradeEditError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export type AdminTradeItemPrice = {
  internal_id?: number;
  order: number;
  price: number | null;
};

export type Pp2Action = {
  trade_id: number;
  item_iid: number | null;
  order: number;
  neo_id: number;
  action: 'update' | 'delete' | 'create' | 'skip-processed';
};

const parsePrice = (price: number | null | undefined) => {
  // Empty, 0, or garbage from the form → clear the stored price.
  if (price == null || price === 0) return null;
  const n = Number(price);
  if (!Number.isFinite(n) || n <= 0 || n >= MAX_SUPPORTED_NUMBER) return null;
  return n;
};

/** Shape the editor already uses (FeedbackTrade / TradeTable). */
export const toTradeData = (trade: TradeWithItems): TradeData => ({
  trade_id: trade.trade_id,
  owner: trade.owner,
  wishlist: trade.wishlist,
  addedAt: trade.addedAt.toJSON(),
  processed: trade.processed,
  priced: trade.priced,
  hash: trade.hash,
  instantBuy: trade.instantBuy ?? null,
  createdAt: trade.createdAt?.toJSON() ?? null,
  items: trade.items
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((i) => ({
      internal_id: i.internal_id,
      trade_id: i.trade_id,
      name: i.item?.name || '',
      image: i.item?.image || '',
      image_id: i.item?.image_id || '',
      item_iid: i.item_iid || null,
      order: i.order,
      price: i.price?.toNumber() || null,
      addedAt: i.addedAt.toJSON(),
      amount: i.amount,
    })),
});

/** GET /api/admin/trades/[id] — load one lot for the pricing form. */
export const loadAdminTrade = async (tradeId: number) => {
  const trade = await prisma.trades.findUnique({
    where: { trade_id: tradeId },
    include: {
      items: {
        include: { item: true },
      },
    },
  });

  if (!trade) throw new AdminTradeEditError('Trade not found', 404);

  return toTradeData(trade);
};

/** This lot plus clones recorded on tradesUpdated when it was first priced. Hash is ignored. */
const getRelatedTradeIds = (trade: Trades) => {
  const ids = new Set<number>([trade.trade_id]);

  if (trade.tradesUpdated) {
    for (const raw of trade.tradesUpdated.split(',')) {
      const n = Number(raw);
      if (Number.isFinite(n) && n > 0) ids.add(n);
    }
  }

  return [...ids];
};

export const applyAdminTradeEdit = async (tradeId: number, items: AdminTradeItemPrice[]) => {
  if (!items?.length) throw new AdminTradeEditError('Missing items', 400);

  // One price per lot slot (order). Clones share the same order layout.
  const priceByOrder = new Map<number, number | null>();
  for (const item of items) {
    if (typeof item.order !== 'number') continue;
    priceByOrder.set(item.order, parsePrice(item.price));
  }

  if (priceByOrder.size === 0) throw new AdminTradeEditError('Missing item prices', 400);

  // TradeItems + PriceProcess2 must commit together.
  return prisma.$transaction(async (tx) => {
    const trade = await tx.trades.findUnique({
      where: { trade_id: tradeId },
      include: {
        items: {
          include: { item: true },
        },
      },
    });

    if (!trade) throw new AdminTradeEditError('Trade not found', 404);

    const relatedTradeIds = getRelatedTradeIds(trade);
    const relatedItems = await tx.tradeItems.findMany({
      where: { trade_id: { in: relatedTradeIds } },
      include: {
        trade: {
          select: {
            trade_id: true,
            owner: true,
            ownerHash: true,
            addedAt: true,
          },
        },
      },
    });

    // Snapshot for ActionLogs (this lot only; clones are listed as cloneIds).
    const before = trade.items.map((item) => ({
      internal_id: item.internal_id,
      order: item.order,
      item_iid: item.item_iid,
      price: item.price?.toNumber() ?? null,
    }));

    // Write the new unit prices onto this lot and every clone, matched by order.
    for (const [order, price] of priceByOrder) {
      await tx.tradeItems.updateMany({
        where: {
          trade_id: { in: relatedTradeIds },
          order,
        },
        data: { price },
      });
    }

    const itemInternalIds = [...new Set(relatedItems.map((item) => item.internal_id))];
    const itemIids = [
      ...new Set(relatedItems.map((item) => item.item_iid).filter((iid): iid is number => !!iid)),
    ];
    const tradeIdSet = new Set(relatedTradeIds);

    // New rows: neo_id = TradeItems.internal_id. Legacy collapsed rows: neo_id = trade_id
    // (scoped by item_iid so we do not mix those two id namespaces).
    const pp2Or = [
      ...(itemInternalIds.length ? [{ neo_id: { in: itemInternalIds } }] : []),
      ...(relatedTradeIds.length && itemIids.length
        ? [{ neo_id: { in: relatedTradeIds }, item_iid: { in: itemIids } }]
        : []),
    ];

    const pp2Rows = pp2Or.length
      ? await tx.priceProcess2.findMany({
          where: { type: 'trade', OR: pp2Or },
        })
      : [];

    const newRowsByItemId = new Map<number, typeof pp2Rows>();
    const legacyByTradeId = new Map<number, typeof pp2Rows>();
    const internalIdSet = new Set(itemInternalIds);

    // Split queue rows: current format is keyed by TradeItems PK, old format by trade_id.
    for (const row of pp2Rows) {
      if (row.neo_id == null) continue;
      // Prefer current-format (neo_id = TradeItems.internal_id) when the two id spaces overlap.
      if (internalIdSet.has(row.neo_id)) {
        const list = newRowsByItemId.get(row.neo_id) ?? [];
        list.push(row);
        newRowsByItemId.set(row.neo_id, list);
        continue;
      }
      if (tradeIdSet.has(row.neo_id)) {
        const list = legacyByTradeId.get(row.neo_id) ?? [];
        list.push(row);
        legacyByTradeId.set(row.neo_id, list);
      }
    }

    // Processed leftover → skip PP2 for that trade. Unprocessed leftover → delete once,
    // then create/update per TradeItems.internal_id below.
    const skipPp2TradeIds = new Set<number>();
    const legacyUnprocessedIds: number[] = [];

    for (const [legacyTradeId, rows] of legacyByTradeId) {
      if (rows.some((row) => row.processed)) {
        skipPp2TradeIds.add(legacyTradeId);
        continue;
      }
      legacyUnprocessedIds.push(...rows.map((row) => row.internal_id));
    }

    if (legacyUnprocessedIds.length) {
      await tx.priceProcess2.deleteMany({
        where: { internal_id: { in: legacyUnprocessedIds } },
      });
    }

    const pp2Actions: Pp2Action[] = [];

    for (const [legacyTradeId, rows] of legacyByTradeId) {
      if (rows.some((row) => row.processed)) continue;
      for (const row of rows) {
        pp2Actions.push({
          trade_id: legacyTradeId,
          item_iid: row.item_iid,
          order: -1,
          neo_id: row.neo_id ?? legacyTradeId,
          action: 'delete',
        });
      }
    }

    // Per priced item: delete if cleared, update unprocessed, skip processed, else enqueue.
    for (const item of relatedItems) {
      if (!priceByOrder.has(item.order) || !item.item_iid) continue;

      const newPrice = priceByOrder.get(item.order) ?? null;
      const stock = item.amount || 1;

      if (skipPp2TradeIds.has(item.trade_id)) {
        pp2Actions.push({
          trade_id: item.trade_id,
          item_iid: item.item_iid,
          order: item.order,
          neo_id: item.trade_id,
          action: 'skip-processed',
        });
        continue;
      }

      const itemPp2 = newRowsByItemId.get(item.internal_id) ?? [];
      const unprocessed = itemPp2.filter((row) => !row.processed);
      const processed = itemPp2.filter((row) => row.processed);

      if (newPrice == null) {
        if (unprocessed.length) {
          await tx.priceProcess2.deleteMany({
            where: { internal_id: { in: unprocessed.map((row) => row.internal_id) } },
          });
          pp2Actions.push({
            trade_id: item.trade_id,
            item_iid: item.item_iid,
            order: item.order,
            neo_id: item.internal_id,
            action: 'delete',
          });
        }
        continue;
      }

      if (unprocessed.length) {
        const [keep, ...extras] = unprocessed;
        await tx.priceProcess2.update({
          where: { internal_id: keep.internal_id },
          data: { price: newPrice, stock },
        });

        if (extras.length) {
          await tx.priceProcess2.deleteMany({
            where: { internal_id: { in: extras.map((row) => row.internal_id) } },
          });
        }

        pp2Actions.push({
          trade_id: item.trade_id,
          item_iid: item.item_iid,
          order: item.order,
          neo_id: keep.neo_id ?? item.internal_id,
          action: 'update',
        });
        continue;
      }

      if (processed.length) {
        pp2Actions.push({
          trade_id: item.trade_id,
          item_iid: item.item_iid,
          order: item.order,
          neo_id: processed[0].neo_id ?? item.internal_id,
          action: 'skip-processed',
        });
        continue;
      }

      await tx.priceProcess2.create({
        data: {
          item_iid: item.item_iid,
          price: newPrice,
          stock,
          type: 'trade',
          // not trade_id: unique(type, neo_id) + skipDuplicates would keep only 1 item per lot
          neo_id: item.internal_id,
          owner: item.trade.owner,
          ownerHash: item.trade.ownerHash,
          addedAt: item.trade.addedAt,
        },
      });

      pp2Actions.push({
        trade_id: item.trade_id,
        item_iid: item.item_iid,
        order: item.order,
        neo_id: item.internal_id,
        action: 'create',
      });
    }

    return {
      trade_id: trade.trade_id,
      cloneIds: relatedTradeIds.filter((id) => id !== trade.trade_id),
      before,
      after: [...priceByOrder.entries()].map(([order, price]) => ({
        order,
        price,
      })),
      pp2: pp2Actions,
    };
  });
};
