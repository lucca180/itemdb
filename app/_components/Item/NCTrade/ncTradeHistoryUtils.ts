import type { ItemData, LebronTrade, NCTradeReport } from '@types';
import { tradeReportToLebronTrade } from '@utils/ncTrades';

export function getUniqueTrades(trades: LebronTrade[]) {
  const uniqueTrades = new Map<string, LebronTrade>();

  trades.forEach((trade) => {
    const key = `${trade.itemsSent}-${trade.itemsReceived}-${trade.tradeDate}`;
    if (!uniqueTrades.has(key)) {
      uniqueTrades.set(key, trade);
    }
  });

  return Array.from(uniqueTrades.values());
}

export function prepareNCTradeHistory(
  ncTrades: LebronTrade[] | null,
  tradeHistory: NCTradeReport[] | null
) {
  const trades: LebronTrade[] = [...(ncTrades ?? [])];

  tradeHistory?.forEach((trade) => {
    trades.push(tradeReportToLebronTrade(trade));
  });

  return getUniqueTrades(trades).sort((a, b) => {
    const dateA = new Date(a.tradeDate);
    const dateB = new Date(b.tradeDate);
    return dateB.getTime() - dateA.getTime();
  });
}

export const isValidTradeDate = (date: Date) => date instanceof Date && !isNaN(date.valueOf());

export const isSameTradeItem = (tradeStr: string, item: ItemData) =>
  tradeStr.toLowerCase().includes(item.name.toLowerCase());

export const getTradeItemSearchLink = (tradeStr: string) => {
  const itemName = tradeStr.trim().replaceAll(/\(?\d+-?\d+\)?$|\(?\d+\)?$/gm, '');
  return `/search?s=${encodeURIComponent(itemName.trim())}`;
};
