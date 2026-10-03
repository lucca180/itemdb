import { ITEMDB_CDN } from '@utils/cdnPreview';
import {
  getDateNST,
  getRestockPrice,
  getShopRestockSpecialDay,
  shopIDToCategory,
  type ShopRestockSpecialDay,
} from '@utils/utils';

// Restock practice mode: the shop pool is fetched once and every refresh is generated
// client-side with the Neopets restock algorithm (as shared by the community on
// reddit.com/r/neopets/comments/16u9rx5). Nothing here touches the server.

export type PracticeItem = {
  id: number;
  /** Neopets item id (obj_info_id) — shops list items in ascending order of it */
  itemId: number | null;
  name: string;
  slug: string | null;
  imageId: string;
  rarity: number;
  estVal: number;
  /** NP market price; null when unknown (no price data or not an NP price) */
  marketPrice: number | null;
};

export type PracticeRestockItem = PracticeItem & {
  stock: number;
  shopPrice: number;
  /** market price - shop price; null when the market price is unknown */
  profit: number | null;
};

export type PracticeStockedItem = PracticeRestockItem & {
  // already loaded + decoded image url (itemdb CDN or Neopets fallback)
  image: string;
};

/**
 * Bump whenever `PracticePoolPayload` changes shape. It is part of the fetch URL, so browsers and
 * the CDN never hand a cached payload in the old shape to new client code.
 */
export const PRACTICE_POOL_VERSION = 3;

export const practicePoolUrl = (shopId: number) =>
  `/api/v2/restock/${shopId}/practice?v=${PRACTICE_POOL_VERSION}`;

/** Column-oriented pool payload — keeps shops with thousands of items small on the wire. */
export type PracticePoolPayload = {
  version: number;
  shopId: number;
  ids: number[];
  itemIds: (number | null)[];
  names: string[];
  slugs: (string | null)[];
  imageIds: string[];
  rarities: number[];
  estVals: number[];
  marketPrices: (number | null)[];
};

export function decodePracticePool(payload: PracticePoolPayload): PracticeItem[] {
  if (payload.version !== PRACTICE_POOL_VERSION) {
    throw new Error(`Unexpected practice pool version: ${payload.version}`);
  }

  return payload.ids.map((id, i) => ({
    id,
    itemId: payload.itemIds[i],
    name: payload.names[i],
    slug: payload.slugs[i],
    imageId: payload.imageIds[i],
    rarity: payload.rarities[i],
    estVal: payload.estVals[i],
    marketPrice: payload.marketPrices[i],
  }));
}

// ---------- Restock algorithm ---------- //

type Rng = () => number;

export const MAX_UNIQUE_ITEMS = 46;
const ROLLS_PER_POOL_ITEM = 1.6;

// obj_types whose stock is divided by 3 (capped at 8, min 1)
const REDUCED_STOCK_SHOPS = new Set([25, 27, 31, 36, 40, 44, 45, 50, 51, 59, 61]);
// "Food and Medicine" get +2d8 stock for rarity <= 75 — assumed to be the Food Shop and the Pharmacy
const EXTRA_STOCK_SHOPS = new Set([1, 13]);

const dice = (rng: Rng, min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;

/** The rarity "roll" an item has to beat (item rarity <= roll) to be stocked. */
export function rollRestockRarity(rng: Rng = Math.random) {
  let rarity = dice(rng, 1, 100);
  if (dice(rng, 1, 3) !== 1 || rarity > 80) rarity -= dice(rng, 1, 12);
  rarity = Math.min(Math.max(rarity, 1), 99);
  if (rarity === 99 && dice(rng, 1, 5) === 1) rarity = 100;

  return rarity;
}

export function rollStockAmount(rarity: number, rng: Rng = Math.random) {
  if (rarity > 85) return 1;
  if (rarity > 80) return dice(rng, 1, 2);
  if (rarity > 75) return dice(rng, 1, 3);
  if (rarity > 70) return dice(rng, 1, 4);
  if (rarity > 65) return dice(rng, 1, 7);
  if (rarity > 60) return dice(rng, 2, 7);
  if (rarity > 50) return dice(rng, 3, 7);
  if (rarity > 30) return dice(rng, 4, 7);
  return dice(rng, 5, 7);
}

/**
 * Units added by one successful roll, following the post's steps in order: rarity table →
 * 1/3 reduction (cap 8, min 1) → Usuki Day ×2 → Food/Medicine +2d8. Repeated rolls of the
 * same item add up afterwards.
 */
export function rollShopStockAmount(
  rarity: number,
  shopId: number,
  specialDay: ShopRestockSpecialDay | undefined,
  rng: Rng = Math.random
) {
  let amount = rollStockAmount(rarity, rng);
  if (REDUCED_STOCK_SHOPS.has(shopId)) amount = Math.min(8, Math.max(1, Math.floor(amount / 3)));
  if (specialDay === 'usukicon') amount *= 2;
  if (EXTRA_STOCK_SHOPS.has(shopId) && rarity <= 75) amount += dice(rng, 1, 8) + dice(rng, 1, 8);

  return amount;
}

export type GenerateRestockOptions = {
  rng?: Rng;
  /** Timestamp used for special days (prices and Usuki Day stock). Defaults to now. */
  date?: number;
};

export function generateRestock(
  pool: PracticeItem[],
  shopId: number,
  { rng = Math.random, date }: GenerateRestockOptions = {}
): PracticeRestockItem[] {
  if (!pool.length) return [];

  const specialDay = getShopRestockSpecialDay(shopId, getDateNST(date));
  const stocked = new Map<number, { item: PracticeItem; stock: number }>();
  const rolls = Math.round(pool.length * ROLLS_PER_POOL_ITEM);

  for (let i = 0; i < rolls; i++) {
    const item = pool[Math.floor(rng() * pool.length)];

    const restockRarity = rollRestockRarity(rng);
    if (restockRarity < item.rarity || dice(rng, 1, 2) !== 1) continue;

    const current = stocked.get(item.id);
    if (!current && stocked.size >= MAX_UNIQUE_ITEMS) continue;

    const amount = rollShopStockAmount(item.rarity, shopId, specialDay, rng);

    if (current) current.stock += amount;
    else stocked.set(item.id, { item, stock: amount });
  }

  const restock = [...stocked.values()].map(({ item, stock }) => {
    const shopPrice = rollShopPrice(item, shopId, rng, date);
    const profit = item.marketPrice !== null ? item.marketPrice - shopPrice : null;

    return { ...item, stock, shopPrice, profit };
  });

  return restock.sort(compareShopOrder);
}

/** Neopets shops always list items by ascending item id; unknown ids go last. */
function compareShopOrder(a: PracticeItem, b: PracticeItem) {
  return (a.itemId ?? Infinity) - (b.itemId ?? Infinity) || a.id - b.id;
}

function rollShopPrice(item: PracticeItem, shopId: number, rng: Rng, date?: number) {
  // r100 items share the r95+ price floor
  const range = getRestockPrice(
    { category: shopIDToCategory[shopId], rarity: Math.min(item.rarity, 99), estVal: item.estVal },
    false,
    date
  );
  if (!range) return item.estVal;

  return dice(rng, range[0], range[1]);
}

// ---------- Images ---------- //

const itemImageUrls = (imageId: string) => [
  `${ITEMDB_CDN}/items/${imageId}.gif`,
  `https://images.neopets.com/items/${imageId}.gif`,
];

const loadedImages = new Map<string, Promise<string>>();

/**
 * Loads and decodes an item image so it paints instantly once rendered.
 * Tries our CDN first and falls back to the Neopets one. Memoized per image id.
 */
export function loadItemImage(imageId: string): Promise<string> {
  let pending = loadedImages.get(imageId);
  if (!pending) {
    pending = loadFirstAvailable(itemImageUrls(imageId));
    loadedImages.set(imageId, pending);
  }
  return pending;
}

async function loadFirstAvailable(urls: string[]) {
  for (const url of urls) {
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      return url;
    } catch {
      // try the next source
    }
  }

  return urls[0];
}
