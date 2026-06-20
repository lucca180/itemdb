import type { ItemData, TradeData } from '@types';

type TradeRelistingTarget = {
  itemIid?: number;
  itemName?: string;
};

const normalize = (value: string) => value.trim().toLowerCase();

export const shouldShowTradeRelisting = (item: Pick<ItemData, 'saleStatus' | 'price'>) =>
  item.saleStatus === null ||
  item.saleStatus.status === 'hts' ||
  (item.price.value || 0) > 20_000_000 ||
  (item.price.inflated && (item.price.value || 0) > 5_000_000);

const isTargetItem = (item: TradeData['items'][number], target: TradeRelistingTarget) => {
  if (target.itemIid !== undefined) return item.item_iid === target.itemIid;
  if (target.itemName !== undefined) return normalize(item.name) === normalize(target.itemName);
  return false;
};

export const addTradeRelistingHistory = (
  trades: TradeData[],
  target: TradeRelistingTarget
): TradeData[] => {
  const ownerHistory = new Map<
    string,
    {
      count: number;
      since: string;
      history: {
        price: number | null;
        date: string;
      }[];
    }
  >();
  const result = trades.map((trade) => ({
    ...trade,
    items: trade.items.map((item) => ({ ...item })),
  }));

  const chronologicalTrades = [...result].sort((a, b) => {
    const dateDifference = new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
    return dateDifference || a.trade_id - b.trade_id;
  });

  chronologicalTrades.forEach((trade) => {
    const item = trade.items.find((tradeItem) => isTargetItem(tradeItem, target));
    if (!item) return;

    const ownerKey = normalize(trade.owner);
    const history = ownerHistory.get(ownerKey);

    if (!history) {
      ownerHistory.set(ownerKey, {
        count: 1,
        since: trade.addedAt,
        history: [{ price: item.price, date: trade.addedAt }],
      });
      return;
    }

    item.relisting = {
      count: history.count,
      since: history.since,
      history: [...history.history].reverse(),
    };

    history.history.push({ price: item.price, date: trade.addedAt });
    history.count++;
  });

  return result;
};

export const findTradeTargetItem = (trade: TradeData, target: TradeRelistingTarget) =>
  trade.items.find((item) => isTargetItem(item, target));
