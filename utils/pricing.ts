import { PriceProcess2 } from '@prisma/client';
import { differenceInCalendarDays } from 'date-fns';
import { mean, standardDeviation } from 'simple-statistics';

const TRADE_MIN_GOAL = process.env.TRADE_MIN_GOAL || '7';

export const processPrices2 = (allItemData: PriceProcess2[]) => {
  // const item = allItemData[0];

  // get only the most recent data available that fits the criteria
  const mostRecentsRaw = filterMostRecents(allItemData).sort(
    (a, b) => a.price.toNumber() - b.price.toNumber()
  );

  if (mostRecentsRaw.length === 0) return undefined;

  const owners = new Set<string>();

  // filter out items with the same owner
  const mostRecents = mostRecentsRaw
    .map((x) => {
      if (x.owner && !owners.has(x.owner)) owners.add(x.owner);
      else return undefined;
      return x;
    })
    .filter((x) => !!x) as PriceProcess2[];
  const prices: number[] = [];

  const usedIds = new Set<number>(mostRecents.map((x) => x.internal_id));
  const latestDate = mostRecents.reduce((a, b) => (a.addedAt > b.addedAt ? a : b)).addedAt;

  mostRecents.map((x, i) => {
    if (i <= 4) {
      const stock = Math.min(x.stock, 2);
      prices.push(...Array(stock).fill(x.price.toNumber()));
    } else prices.push(x.price.toNumber());
  });

  // remove outliers
  const priceMean = mean(prices);
  const priceSTD = standardDeviation(prices);

  let out = prices.filter(
    (x) => x <= priceMean + priceSTD * 0.75 && x >= priceMean - priceSTD * 2.25
  );
  out = out.splice(0, 5);

  const finalMean = out.length >= 2 ? mean(out) : out[0];

  return {
    price: logRound(finalMean),
    usedIds: Array.from(usedIds),
    latestDate: latestDate,
  };
};

function filterMostRecents(priceProcessList: PriceProcess2[]) {
  const daysThreshold: { [days: number]: number } = {
    3: 15,
    7: 10,
    15: 5,
    30: 3,
    120: 1,
  };

  const firstFiltered = priceProcessList.filter(
    (x) => differenceInCalendarDays(Date.now(), x.addedAt) <= 0
  );

  if (checkFiltered(firstFiltered, daysThreshold[3] * 2)) return firstFiltered;

  let count = 0;

  for (let i = 0; i < Object.keys(daysThreshold).length; i++) {
    const days = parseInt(Object.keys(daysThreshold)[i]);
    const prevDays = parseInt(Object.keys(daysThreshold)[i - 1]) || 1;
    const goal = daysThreshold[days];

    const filtered = priceProcessList.filter(
      (x) =>
        differenceInCalendarDays(Date.now(), x.addedAt) <= days &&
        differenceInCalendarDays(Date.now(), x.addedAt) >= prevDays
    );

    if (checkFiltered(filtered, goal)) return filtered;

    count += filtered.filter((x) => x.type !== 'usershop').length;
    if (count >= goal) return [];
  }

  return [];
}

function checkFiltered(filtered: PriceProcess2[], goal: number) {
  if (filtered.filter((x) => x.type !== 'usershop').length >= goal) return true;

  if (filtered.filter((x) => x.type === 'ssw').length >= 5) return true;

  if (
    filtered.length === filtered.filter((x) => x.type === 'trade').length &&
    filtered.length >= Number(TRADE_MIN_GOAL)
  )
    return true;

  return false;
}

function logRound(value: number) {
  if (value === 0) return 0;

  const precision = -1 * Math.floor(log10(value) - 2);

  const multiplier = Math.pow(10, precision || 0);
  return Math.round(value * multiplier) / multiplier;
}

const log10 = (x: number) => Math.log(x) / Math.log(10);
