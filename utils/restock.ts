import { tz } from '@date-fns/tz';
import { endOfDay } from 'date-fns';
import type { RestockStats } from '@types';
import { getDateNST } from '@utils/utils';

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

const getNstStartOfDay = (date: Date = getDateNST()) => {
  const nst = getDateNST(date.getTime());
  nst.setHours(0, 0, 0, 0);
  return nst.getTime();
};

export const getNstEndOfDay = (timestamp: number) =>
  endOfDay(getDateNST(timestamp), { in: NST }).getTime();

export const getRollingStartDate = (timePeriod: number) =>
  Date.now() - timePeriod * 24 * 60 * 60 * 1000;

export const getTodayTimestamp = () => getNstStartOfDay();

export const getYesterdayTimestamp = () => {
  const yesterday = getDateNST();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  return yesterday.getTime();
};

export const getLatestHalfPriceDayTimestamp = () => {
  const todayNST = getDateNST();
  const hpdThisMonth = getDateNST();
  hpdThisMonth.setFullYear(todayNST.getFullYear(), todayNST.getMonth(), 3);
  hpdThisMonth.setHours(0, 0, 0, 0);

  if (todayNST.getTime() >= hpdThisMonth.getTime()) {
    return hpdThisMonth.getTime();
  }

  const hpdPrevMonth = getDateNST();
  hpdPrevMonth.setFullYear(todayNST.getFullYear(), todayNST.getMonth() - 1, 3);
  hpdPrevMonth.setHours(0, 0, 0, 0);
  return hpdPrevMonth.getTime();
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
