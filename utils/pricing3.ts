import { PriceProcess2 } from '@prisma/generated/client';
import { differenceInCalendarDays } from 'date-fns';
import { median, quantileSorted, mad, sum, mean } from 'simple-statistics';

const MAX_VALID_STOCK = 3; // max stock to consider for price calculation

export const processPrices3 = (allItemData: PriceProcess2[], forceMode = false) => {
  // get only the most recent data available that fits the criteria
  const weightedVals = filterMostRecent(allItemData, forceMode);

  if (weightedVals.length === 0) return undefined;

  const usedIds = new Set<number>(weightedVals.map(([x]) => x.internal_id));

  const filteredPrices = weightedStdFilter(weightedVals, 1.6, 0.75);
  if (!filteredPrices) return undefined;

  const latestDate = filteredPrices.reduce(
    (latest, [x]) => (x.addedAt > latest ? x.addedAt : latest),
    new Date(0)
  );

  const finalMean =
    filteredPrices.length >= 2
      ? weightedMean(filteredPrices)
      : filteredPrices[0][0].price.toNumber();

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
  };

  let filtered: PriceProcess2[] = [];
  for (const days in daysThreshold) {
    const threshold = daysThreshold[days];
    filtered = priceProcessList.filter(
      (x) => differenceInCalendarDays(Date.now(), x.addedAt) <= parseInt(days, 10)
    );

    filtered = uniqueByOwner(filtered);

    if (filtered.length >= threshold) {
      break;
    } else filtered = [];
  }

  if (!filtered.length) filtered = uniqueByOwner(priceProcessList);

  const allPrices: number[] = [];
  filtered.forEach((x) => {
    const stock = Math.max(x.stock, MAX_VALID_STOCK);
    for (let i = 0; i < stock; i++) {
      allPrices.push(x.price.toNumber());
    }
  });

  const noOutliers = new Set(removeOutliersCombined(allPrices));

  if (noOutliers.size < 3) return [];

  filtered = filtered.filter((x) => noOutliers.has(x.price.toNumber()));

  const result = filtered.map((x) => [x, getWeight(x)]) as [PriceProcess2, number][];

  const meanWeight = mean(result.map(([, w]) => w));
  const lastDate = result.reduce(
    (latest, [x]) => (x.addedAt > latest ? x.addedAt : latest),
    new Date(0)
  );

  // data is low confidence, skip
  if (meanWeight < 0.5 && differenceInCalendarDays(Date.now(), lastDate) <= 30) {
    console.error('processPrices2: low quality data', filtered[0]?.item_iid, meanWeight, filtered);
    return [];
  }

  return result as [PriceProcess2, number][];
}

const sourceWeight: { [key: string]: number } = {
  ssw: 1,
  sw: 0.8,
  auction: 0.7,
  trade: 0.7,
  usershop: 0.35,
};

const getWeight = (price: PriceProcess2, priorityDays = 7, alpha = 0.03, minWeight = 0.2) => {
  const typeWeight = sourceWeight[price.type] || 0.35;

  const days = differenceInCalendarDays(Date.now(), price.addedAt);
  const daysWeight = days < priorityDays ? 1 : Math.max(0, 1 / (1 + (days - priorityDays) * alpha));
  const stock = Math.min(price.stock, MAX_VALID_STOCK);

  const stockWeight =
    price.type === 'usershop' ? 1 : 1 + (0.5 * (stock - 1)) / (MAX_VALID_STOCK - 1);

  return Math.max(typeWeight * daysWeight * stockWeight, minWeight);
};

// Helper functions

function logRound(value: number) {
  if (value === 0) return 0;
  if (value > 990000 && value < 1000000) return value; // avoid rounding buyable limit

  const precision = -1 * Math.floor(log10(value) - 2);

  const multiplier = Math.pow(10, precision || 0);
  return Math.round(value * multiplier) / multiplier;
}

const log10 = (x: number) => Math.log(x) / Math.log(10);

function uniqueByOwner(items: PriceProcess2[]) {
  const seen = new Set<string>();
  const sortedItems = [...items].sort(
    (a, b) => a.price.toNumber() - b.price.toNumber() || sourceWeight[b.type] - sourceWeight[a.type]
  );
  return sortedItems.filter((x) => {
    if (!x.owner || seen.has(x.owner)) return false;
    seen.add(x.owner);
    return true;
  });
}

function removeOutliersCombined(data: number[]) {
  if (data.length < 4) return data;

  const sorted = [...data].sort((a, b) => a - b);

  const q1 = quantileSorted(sorted, 0.25);
  const q3 = quantileSorted(sorted, 0.75);
  const iqr = q3 - q1;

  const iqrFiltered = sorted.filter((x) => x >= q1 - 1.5 * iqr && x <= q3 + 1.5 * iqr);

  if (iqrFiltered.length < 2) return iqrFiltered;

  const medianVal = median(iqrFiltered);
  const madVal = mad(iqrFiltered);

  return iqrFiltered.filter((x) => Math.abs(x - medianVal) <= 3 * madVal);
}

function weightedStdFilter(weightedPrices: [PriceProcess2, number][], kLower = 1, kUpper = 1) {
  const meanWeighted = weightedMean(weightedPrices);

  const varianceWeighted =
    sum(weightedPrices.map(([, w]) => w * Math.pow(w - meanWeighted, 2))) /
    sum(weightedPrices.map(([, w]) => w));

  const stdWeighted = Math.sqrt(varianceWeighted);
  const relativeSTD = stdWeighted / meanWeighted;

  // skip if the deviation is too high
  if (weightedPrices.length <= 3 && relativeSTD >= 0.75) {
    console.error(
      'processPrices2: Too high deviation',
      weightedPrices[0][0].item_iid,
      relativeSTD,
      weightedPrices
    );
    return undefined;
  }

  const lowerLimitFactor = Math.ceil(Math.min(kLower, meanWeighted / stdWeighted) * 10) / 10;

  if (lowerLimitFactor < 0.1) {
    console.error(
      'processPrices2: Lower limit factor too low',
      weightedPrices[0][0].item_iid,
      lowerLimitFactor
    );

    return undefined;
  }

  return weightedPrices.filter(
    ([p]) =>
      p.price.toNumber() >= meanWeighted - stdWeighted * lowerLimitFactor &&
      p.price.toNumber() <= meanWeighted + stdWeighted * kUpper
  );
}

function weightedMean(val: [PriceProcess2, number][]) {
  const sumWeights = val.reduce((a, b) => a + b[1], 0);
  const sum = val.reduce((acc, v) => acc + v[0].price.toNumber() * v[1], 0);
  return sum / sumWeights;
}
