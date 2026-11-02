export type RestockerType = 'loyal' | 'owl' | 'sniper' | 'marathoner' | 'explorer' | 'haggler';

export const RESTOCKER_TYPES: RestockerType[] = [
  'loyal',
  'owl',
  'sniper',
  'marathoner',
  'explorer',
  'haggler',
];

export type ReviewItem = {
  name: string;
  image: string;
  price: number;
};

export type RestockReviewData = {
  year: number;
  username: string;
  /** ISO dates (NST) the review covers, inclusive. */
  periodStart: string;
  periodEnd: string;
  hours: number;
  sessions: number;
  shops: number;
  refreshes: number;
  /** Most visited shops by time, the first one is the shop of the year. */
  topShops: { id: number; hours: number }[];
  /** Share of the total time spent at the shop of the year (0-1). */
  topShopShare: number;
  favorite: { item: ReviewItem; count: number };
  /** Most valuable purchases, price at the time of the purchase. */
  topBought: ReviewItem[];
  totalBoughtValue: number;
  fastest: { item: ReviewItem; shopId: number; seconds: number };
  avgReactionSeconds: number;
  biggestLoss: ReviewItem;
  lostCount: number;
  lostValue: number;
  /** Activity level per day (0 = no restock, 4 = busiest), from periodStart to periodEnd. */
  daily: number[];
  bestDay: { date: string; value: number };
  /** Share of the community this user beats (0-100). */
  percentiles: { reaction: number; hours: number; shops: number };
  communitySize: number;
  type: RestockerType;
};

const img = (file: string) => `https://images.neopets.com/items/${file}`;

const ITEMS = {
  bloodhook: {
    name: 'Captain Bloodhook Stamp',
    image: img('stamp_capt_bloodhook.gif'),
    price: 8000000,
  },
  zurroball: { name: 'Zurroball Stamp', image: img('sta_space_zurroball.gif'), price: 2970000 },
  usukiland: { name: 'Usukiland Stamp', image: img('sta_usukiland.gif'), price: 716000 },
  fuzzle: { name: 'Evil Fuzzle Coin', image: img('coi_spa_evilfuzzle.gif'), price: 649000 },
  negg: { name: 'Purple Negg', image: img('purple_negg.gif'), price: 364000 },
  splat: { name: 'Splat-A-Sloth Stamp', image: img('stamp_spa_splat.gif'), price: 11200 },
  snowager: { name: 'Snowager Stamp', image: img('stamp_snowy_snowager.gif'), price: 16800000 },
} satisfies Record<string, ReviewItem>;

const PERIOD_START = '2026-01-01';
const PERIOD_END = '2026-11-30';
const STREAK = { start: '2026-06-04', end: '2026-07-14' };
const BEST_DAY = '2026-07-14';

const dayIndex = (iso: string) =>
  Math.round((Date.parse(iso) - Date.parse(PERIOD_START)) / 86400000);

// deterministic so the demo looks the same on every render
const mulberry32 = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const buildDaily = () => {
  const rand = mulberry32(20261130);
  const total = dayIndex(PERIOD_END) + 1;
  const streakStart = dayIndex(STREAK.start);
  const streakEnd = dayIndex(STREAK.end);
  const best = dayIndex(BEST_DAY);

  return Array.from({ length: total }, (_, i) => {
    let level = rand() < 0.2 ? 0 : 1 + Math.floor(rand() * 3);
    if (i >= streakStart && i <= streakEnd && level === 0) level = 2;
    if (i === streakStart - 1 || i === streakEnd + 1) level = 0;
    if (i === best) level = 4;
    return level;
  });
};

export const MOCK_REVIEW: RestockReviewData = {
  year: 2026,
  username: 'sloth_minion',
  periodStart: PERIOD_START,
  periodEnd: PERIOD_END,
  hours: 412,
  sessions: 1284,
  shops: 23,
  refreshes: 86410,
  topShops: [
    { id: 58, hours: 186 },
    { id: 15, hours: 64 },
    { id: 7, hours: 41 },
  ],
  topShopShare: 0.45,
  favorite: { item: ITEMS.splat, count: 41 },
  topBought: [ITEMS.bloodhook, ITEMS.zurroball, ITEMS.usukiland, ITEMS.fuzzle, ITEMS.negg],
  totalBoughtValue: 147320000,
  fastest: { item: ITEMS.zurroball, shopId: 58, seconds: 1.8 },
  avgReactionSeconds: 2.9,
  biggestLoss: ITEMS.snowager,
  lostCount: 47,
  lostValue: 92400000,
  daily: buildDaily(),
  bestDay: { date: BEST_DAY, value: 23100000 },
  percentiles: { reaction: 87, hours: 72, shops: 64 },
  communitySize: 998,
  type: 'loyal',
};

/** Longest run of consecutive active days, as indexes into `daily`. */
export const getLongestStreak = (daily: number[]) => {
  let run = 0;
  let runStart = 0;
  let best = { length: 0, start: 0, end: 0 };

  daily.forEach((level, i) => {
    if (!level) {
      run = 0;
      return;
    }

    if (!run) runStart = i;
    run++;
    if (run > best.length) best = { length: run, start: runStart, end: i };
  });

  return best;
};

/** ISO date of the n-th day after `start`. */
export const addDaysIso = (start: string, days: number) =>
  new Date(Date.parse(start) + days * 86400000).toISOString().slice(0, 10);
