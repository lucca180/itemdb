/** Lists above this many NP items don't get a price history chart. */
export const MAX_ITEMS_LIST_PRICE = 2000;

/** The chart shows at most one point per this many days. */
export const LIST_PRICE_HISTORY_PERIOD_DAYS = 7;

/** How far back the chart goes. */
export const LIST_PRICE_HISTORY_YEARS = 2;

const DAY_MS = 24 * 60 * 60 * 1000;

export type ListPriceHistoryPoint = {
  /** UTC day, `YYYY-MM-DD` */
  date: string;
  /** Sum of each item's latest known price as of the end of that day × its amount */
  value: number;
  /** How many of the list's items had a known price by the end of that day */
  pricedItems: number;
};

export type ListPriceHistoryResult =
  | { status: 'ok'; points: ListPriceHistoryPoint[]; totalItems: number }
  | { status: 'too-many'; max: number };

export type ListPricePoint = {
  item_iid: number;
  value: number;
  addedAt: Date;
};

/**
 * Running total of the latest known price of every item (× amount), sampled once per
 * `periodDays` window (UTC days, aligned to the Unix epoch). Each point is the total at the
 * last price change inside its window and carries that change's day as `date`.
 * Items enter the total on their first price, so early points can cover only part of the
 * list — `pricedItems` says how much.
 *
 * With `since`, points dated before it are dropped. The totals are still computed from the
 * full history, so the first returned point already includes every item's last known price.
 *
 * Linear in the number of prices after sorting.
 */
export function buildListPriceHistory(
  amounts: ReadonlyMap<number, number>,
  prices: readonly ListPricePoint[],
  periodDays = 1,
  since?: Date
): ListPriceHistoryPoint[] {
  const period = Math.max(1, Math.trunc(periodDays));
  const sorted = prices
    .filter((price) => amounts.has(price.item_iid) && price.value > 0)
    .sort((a, b) => a.addedAt.getTime() - b.addedAt.getTime());

  const current = new Map<number, number>();
  const points: ListPriceHistoryPoint[] = [];
  let total = 0;
  let lastBucket: number | null = null;

  for (const price of sorted) {
    const amount = amounts.get(price.item_iid)!;
    const previous = current.get(price.item_iid) ?? 0;

    total += (price.value - previous) * amount;
    current.set(price.item_iid, price.value);

    const time = price.addedAt.getTime();
    const bucket = Math.floor(Math.floor(time / DAY_MS) / period);
    const point = {
      date: price.addedAt.toISOString().slice(0, 10),
      value: total,
      pricedItems: current.size,
    };

    if (bucket === lastBucket) points[points.length - 1] = point;
    else points.push(point);

    lastBucket = bucket;
  }

  if (!since) return points;

  // Keep the total as of `since` as the first point, so the chart starts at the cutoff.
  const sinceDate = since.toISOString().slice(0, 10);
  const firstKept = points.findIndex((point) => point.date >= sinceDate);
  const kept = firstKept === -1 ? [] : points.slice(firstKept);
  const before = points[(firstKept === -1 ? points.length : firstKept) - 1];

  if (before && kept[0]?.date !== sinceDate) kept.unshift({ ...before, date: sinceDate });

  return kept;
}
