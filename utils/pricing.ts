import { PriceProcess2 } from '@prisma/generated/client';
import { differenceInCalendarDays } from 'date-fns';
import { mean, standardDeviation } from 'simple-statistics';

const TRADE_MIN_GOAL = process.env.TRADE_MIN_GOAL || '7';

export const processPrices2 = (allItemData: PriceProcess2[], forceMode = false) => {
  // const item = allItemData[0];

  // get only the most recent data available that fits the criteria
  const mostRecentRaw = filterMostRecent(allItemData, forceMode).sort(
    (a, b) => a.price.toNumber() - b.price.toNumber()
  );

  if (mostRecentRaw.length === 0) return undefined;

  // filter out items with the same owner
  // (although i believe this is already done in the filterMostRecent function)
  const mostRecent = uniqueByOwner(mostRecentRaw);

  const prices: number[] = [];

  const usedIds = new Set<number>(mostRecent.map((x) => x.internal_id));
  const latestDate = mostRecent.reduce((a, b) => (a.addedAt > b.addedAt ? a : b)).addedAt;

  mostRecent.map((x, i) => {
    if (i <= 4) {
      const stock = Math.min(x.stock, 2);
      prices.push(...Array(stock).fill(x.price.toNumber()));
    } else prices.push(x.price.toNumber());
  });

  const reducedPrices = prices.splice(0, 30);
  // remove outliers
  let out = removeOutliers(reducedPrices);

  if (out.length === 0) {
    console.error(
      'processPrices2: No prices left after removing outliers',
      allItemData[0].item_iid
    );
    return undefined;
  }
  const priceMean = mean(out);
  const priceSTD = standardDeviation(out);
  const relativeSTD = priceSTD / priceMean;

  // skip if the deviation is too high
  if (out.length > 1 && out.length <= 3 && relativeSTD >= 0.75) {
    console.error('processPrices2: Too high deviation', allItemData[0].item_iid, relativeSTD, out);
    return undefined;
  }

  out = out.filter((x) => x <= priceMean + priceSTD * 0.75 && x >= priceMean - priceSTD * 1.8);

  out = out.splice(0, 5);

  const finalMean = out.length >= 2 ? mean(out) : out[0];

  return {
    price: logRound(finalMean),
    usedIds: Array.from(usedIds),
    latestDate: latestDate,
  };
};

function filterMostRecent(priceProcessList: PriceProcess2[], forceMode = false) {
  const EVENT_MODE = forceMode || process.env.EVENT_MODE === 'true';

  const daysThreshold: { [days: number]: number } = {
    0: EVENT_MODE ? 10 : 18,
    3: EVENT_MODE ? 5 : 15,
    7: EVENT_MODE ? 5 : 10,
    15: 5,
    30: 3,
    120: 1,
  };

  const firstFiltered = priceProcessList.filter(
    (x) => differenceInCalendarDays(Date.now(), x.addedAt) <= 0
  );

  if (checkFiltered(firstFiltered, daysThreshold[0], forceMode)) return firstFiltered;

  let count = 0;

  for (let i = 1; i < Object.keys(daysThreshold).length; i++) {
    const days = parseInt(Object.keys(daysThreshold)[i]);
    const prevDays = parseInt(Object.keys(daysThreshold)[i - 1]) || 1;
    const goal = daysThreshold[days];

    const filtered = priceProcessList.filter(
      (x) =>
        differenceInCalendarDays(Date.now(), x.addedAt) <= days &&
        differenceInCalendarDays(Date.now(), x.addedAt) >= prevDays
    );

    if (checkFiltered(filtered, goal, forceMode)) return filtered;

    count += filtered.filter((x) => x.type !== 'usershop').length;
    if (count >= goal) return [];
  }

  return [];
}

const priorityOrder = ['ssw', 'sw', 'trade', 'usershop'];

function checkFiltered(filtered: PriceProcess2[], goal: number, forceMode = false) {
  const EVENT_MODE = forceMode || process.env.EVENT_MODE === 'true';

  // remove stuff with the same owner
  const newFiltered = uniqueByOwner(
    filtered.sort((a, b) => {
      return priorityOrder.indexOf(a.type) - priorityOrder.indexOf(b.type);
    })
  );

  if (!newFiltered.length) return false;

  const trades = newFiltered.filter((x) => x.type === 'trade');
  const ssw = newFiltered.filter((x) => x.type === 'ssw');
  const notUsershop = newFiltered.filter((x) => x.type !== 'usershop');

  // if ssw/sw/usershops are less than 3 and no trades, don't price
  if (newFiltered.length < 3 && !trades.length) return false;

  // if not usershop is more than the goal, do price!
  if (notUsershop.length >= goal) return true;

  // if ssw is greater than val, then price!
  if (ssw.length >= (EVENT_MODE ? 3 : 5)) return true;

  // if we only have trades, and the trades are more than the goal, do price!
  if (newFiltered.length === trades.length && newFiltered.length >= Number(TRADE_MIN_GOAL))
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

const removeOutliers = (data: number[]) => {
  const sorted = data.sort((a, b) => a - b);
  const q1 = quartile(sorted, 0.25);
  const q3 = quartile(sorted, 0.75);

  const iqr = q3 - q1;

  return sorted.filter((x) => x >= q1 - 1.5 * iqr && x <= q3 + 1.5 * iqr);
};

const quartile = (sorted: number[], q: number) => {
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  } else {
    return sorted[base];
  }
};

function uniqueByOwner(items: PriceProcess2[]) {
  const seen = new Set<string>();
  return items.filter((x) => {
    if (!x.owner || seen.has(x.owner)) return false;
    seen.add(x.owner);
    return true;
  });
}
