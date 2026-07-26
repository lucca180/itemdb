import { tz } from '@date-fns/tz';
import { endOfDay, setDate, startOfDay, subDays, subMonths } from 'date-fns';
import type { RestockStats } from '@types';

export type ShopRankingEntry = RestockStats['shopRanking'][number];

export const compareShopRankingEntries = (a: ShopRankingEntry, b: ShopRankingEntry) => {
  const aHasProfit = a.estProfit !== null;
  const bHasProfit = b.estProfit !== null;

  if (aHasProfit && bHasProfit) return b.estProfit! - a.estProfit!;
  if (aHasProfit) return -1;
  if (bHasProfit) return 1;

  return b.estRevenue - a.estRevenue;
};

export const getShopRankingMetric = (entry: ShopRankingEntry) => ({
  amount: entry.estProfit ?? entry.estRevenue,
  isProfit: entry.estProfit !== null,
});

export type PeriodPreset = 'lastSession' | 'today' | 'yesterday' | 'halfPriceDay';

export type PeriodFilter = {
  timePeriod: number;
  shops: number | string;
  timestamp: number | null;
  preset?: PeriodPreset | null;
};

const NST = tz('America/Los_Angeles');

export const getNstEndOfDay = (timestamp: number) => endOfDay(timestamp, { in: NST }).getTime();

export const getRollingStartDate = (timePeriod: number) =>
  Date.now() - timePeriod * 24 * 60 * 60 * 1000;

export const getTodayTimestamp = () => startOfDay(new Date(), { in: NST }).getTime();

export const getYesterdayTimestamp = () =>
  startOfDay(subDays(new Date(), 1, { in: NST }), { in: NST }).getTime();

export const getLatestHalfPriceDayTimestamp = () => {
  const now = new Date();
  const hpdThisMonth = startOfDay(setDate(now, 3, { in: NST }), { in: NST });

  if (now.getTime() >= hpdThisMonth.getTime()) {
    return hpdThisMonth.getTime();
  }

  return startOfDay(setDate(subMonths(now, 1, { in: NST }), 3, { in: NST }), {
    in: NST,
  }).getTime();
};

export const getFilterSelectValue = (filter: PeriodFilter) => {
  if (filter.preset) return filter.preset;
  if (filter.timestamp) return 'customDate';

  return String(filter.timePeriod);
};

export const getPresetFilter = (value: string, baseFilter: PeriodFilter): PeriodFilter | null => {
  if (value === 'lastSession') {
    return { ...baseFilter, timePeriod: 0, timestamp: null, preset: 'lastSession' };
  }

  if (value === 'today') {
    return { ...baseFilter, timePeriod: 1, timestamp: getTodayTimestamp(), preset: 'today' };
  }

  if (value === 'yesterday') {
    return {
      ...baseFilter,
      timePeriod: 1,
      timestamp: getYesterdayTimestamp(),
      preset: 'yesterday',
    };
  }

  if (value === 'halfPriceDay') {
    return {
      ...baseFilter,
      timePeriod: 1,
      timestamp: getLatestHalfPriceDayTimestamp(),
      preset: 'halfPriceDay',
    };
  }

  return null;
};

export const normalizeFilterPreset = (filter: PeriodFilter): PeriodFilter => {
  if (!filter.preset) return filter;

  return getPresetFilter(filter.preset, filter) ?? filter;
};
