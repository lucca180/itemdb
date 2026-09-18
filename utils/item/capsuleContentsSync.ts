import axios from 'axios';
import prisma from '@utils/prisma';
import { Prisma } from '@prisma/generated/client';
import { enqueueAndProcessItems } from '@utils/item/enqueueItemProcess';
import { markNcItemOpenableFromDrops } from '@utils/item/markNcItemOpenableFromDrops';
import { ItemRevalidateTags, revalidateItem } from '@utils/item/revalidateItem';
import { CAPSULE_CONTENTS_SYNC_OPENING_ID } from '@utils/item/itemDropEvidence';

const CAPSULE_CONTENTS_URL = 'https://ncmall.neopets.com/mall/ajax/v2/capsule_contents/index.phtml';
const PAGE_LIMIT = 50;

const NEO_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const neoHeaders = {
  'User-Agent': NEO_UA,
  Accept: 'application/json, text/javascript, */*; q=0.01',
  'accept-language': 'en-US,en;q=0.9',
  origin: 'https://ncmall.neopets.com',
  Referer: 'https://ncmall.neopets.com/mall/',
};

/**
 * Recognized by the drops odds engine's `catType`/`catTypeZone` lists
 * (pages/api/v1/items/[id_name]/drops.ts) to render the category-choice UI.
 */
const KNOWN_CAPSULE_CATEGORIES = ['clothing', 'accessories', 'trinkets'] as const;
type CapsuleCategoryKey = (typeof KNOWN_CAPSULE_CATEGORIES)[number];

type CapsuleContentsApiItem = {
  id: number;
  name: string;
  imageFile: string;
  tier: number;
  tierLabel: string;
  isBonus: boolean;
  category?: string;
};

type CapsuleContentsApiCategory = {
  key: string;
  name: string;
  count: number;
  items: CapsuleContentsApiItem[];
};

type CapsuleContentsApiResponse = {
  error: string;
  capsule_id: number;
  capsule_type: number;
  capsule_type_name: string;
  capsule_name: string;
  data: CapsuleContentsApiItem[];
  categories: CapsuleContentsApiCategory[];
  bonusItems: CapsuleContentsApiItem[];
  totalItems: number;
  totalPages: number;
  page: number;
  limit: number;
};

export type CapsuleContentsItem = {
  item_id: number;
  name: string;
  img: string;
  /** True for the capsule's rarer/bonus tier drops — maps to OpenableItems.limitedEdition. */
  isBonus: boolean;
  /**
   * Only known for capsules whose API response affirms a `categories` breakdown
   * (e.g. "Retired Mystery Capsule" style, clothing/accessories/trinkets).
   * Most capsules don't expose this — stays undefined for those.
   */
  category?: CapsuleCategoryKey;
};

export type CapsuleContentsSnapshot = {
  capsuleName: string;
  capsuleTypeName: string;
  items: CapsuleContentsItem[];
};

const toCapsuleContentsItem = (item: CapsuleContentsApiItem): CapsuleContentsItem => ({
  item_id: item.id,
  name: item.name,
  img: `https://images.neopets.com/items/${item.imageFile}.gif`,
  isBonus: item.isBonus,
});

/**
 * The API only tells us each item's real category (clothing/accessories/trinkets) through
 * the top-level `categories[].items` sub-arrays — each page's `categories` entries contain
 * only that page's items, tagged with their category key. The flat `data` array and each
 * item's own `category` field are useless for this (always the generic string `"Wearable"`).
 */
const collectCategoryByItemId = (
  categories: CapsuleContentsApiCategory[] | undefined,
  target: Map<number, CapsuleCategoryKey>
) => {
  for (const category of categories ?? []) {
    if (!KNOWN_CAPSULE_CATEGORIES.includes(category.key as CapsuleCategoryKey)) continue;
    for (const item of category.items) {
      target.set(item.id, category.key as CapsuleCategoryKey);
    }
  }
};

/** Fetches every page of the official capsule_contents API for a given capsule item_id. */
export async function fetchCapsuleContents(capsuleId: number): Promise<CapsuleContentsSnapshot> {
  const firstPage = await requestCapsuleContentsPage(capsuleId, 1);

  if (firstPage.error !== '0') {
    throw new Error(`capsule_contents API returned error for capsule_id=${capsuleId}`);
  }

  const items = new Map<number, CapsuleContentsApiItem>();
  const categoryByItemId = new Map<number, CapsuleCategoryKey>();

  for (const item of [...firstPage.data, ...firstPage.bonusItems]) {
    items.set(item.id, item);
  }
  collectCategoryByItemId(firstPage.categories, categoryByItemId);

  for (let page = 2; page <= firstPage.totalPages; page++) {
    const nextPage = await requestCapsuleContentsPage(capsuleId, page);
    for (const item of nextPage.data) {
      items.set(item.id, item);
    }
    collectCategoryByItemId(nextPage.categories, categoryByItemId);
  }

  const resolvedItems = Array.from(items.values()).map((item) => {
    const category = categoryByItemId.get(item.id);
    return category ? { ...toCapsuleContentsItem(item), category } : toCapsuleContentsItem(item);
  });

  return {
    capsuleName: firstPage.capsule_name,
    capsuleTypeName: firstPage.capsule_type_name,
    items: resolvedItems,
  };
}

async function requestCapsuleContentsPage(
  capsuleId: number,
  page: number
): Promise<CapsuleContentsApiResponse> {
  const res = await axios.get<CapsuleContentsApiResponse>(CAPSULE_CONTENTS_URL, {
    params: { capsule_id: capsuleId, page, limit: PAGE_LIMIT },
    headers: neoHeaders,
    timeout: 30000,
  });

  return res.data;
}

export type CapsuleSyncTarget = {
  internal_id: number;
  item_id: number;
};

export type CapsuleSyncResult = {
  capsuleName: string;
  itemsFound: number;
  itemsCreated: number;
  dropsSynced: number;
};

/**
 * Syncs a single capsule's official contents into OpenableItems as authoritative rows
 * (opening_id = CAPSULE_CONTENTS_SYNC_OPENING_ID). Idempotent: replaces any previous
 * rows synced from this source for the same capsule.
 *
 * This only confirms *membership* ("this item can drop from this capsule") plus whether
 * an item is a rarer bonus/LE drop — the API doesn't expose real odds or draw mechanics,
 * so no prizePool/percentage is invented beyond the one case (category-affirming capsules)
 * where the API itself states the pool.
 */
export async function syncCapsuleContents(capsule: CapsuleSyncTarget): Promise<CapsuleSyncResult> {
  const snapshot = await fetchCapsuleContents(capsule.item_id);

  if (snapshot.items.length === 0) {
    return { capsuleName: snapshot.capsuleName, itemsFound: 0, itemsCreated: 0, dropsSynced: 0 };
  }

  const dropItemIds = snapshot.items.map((item) => item.item_id);

  let dbItems = await prisma.items.findMany({
    where: { item_id: { in: dropItemIds } },
    select: { item_id: true, internal_id: true },
  });

  const missingItems = snapshot.items.filter(
    (item) => !dbItems.some((dbItem) => dbItem.item_id === item.item_id)
  );

  let itemsCreated = 0;
  if (missingItems.length > 0) {
    const enqueueResult = await enqueueAndProcessItems(
      missingItems.map((item) => ({
        item_id: item.item_id,
        name: item.name,
        img: item.img,
        rarity: 500,
        type: 'nc',
      })),
      {
        language: 'en',
        meta: {
          itemdbVersion: 'capsule-contents-sync',
          dataSource: 'capsule-contents-sync',
        },
      }
    );
    itemsCreated = enqueueResult.process.created;

    if (itemsCreated > 0) {
      dbItems = await prisma.items.findMany({
        where: { item_id: { in: dropItemIds } },
        select: { item_id: true, internal_id: true },
      });
    }
  }

  const dropRows: Prisma.OpenableItemsCreateManyInput[] = [];
  for (const item of snapshot.items) {
    const dbItem = dbItems.find((x) => x.item_id === item.item_id);
    if (!dbItem) continue;

    dropRows.push({
      parent_iid: capsule.internal_id,
      item_iid: dbItem.internal_id,
      opening_id: CAPSULE_CONTENTS_SYNC_OPENING_ID,
      limitedEdition: item.isBonus,
      prizePool: item.category,
    });
  }

  if (dropRows.length === 0) {
    return {
      capsuleName: snapshot.capsuleName,
      itemsFound: snapshot.items.length,
      itemsCreated,
      dropsSynced: 0,
    };
  }

  await prisma.$transaction([
    prisma.openableItems.deleteMany({
      where: {
        parent_iid: capsule.internal_id,
        opening_id: CAPSULE_CONTENTS_SYNC_OPENING_ID,
      },
    }),
    prisma.openableItems.createMany({ data: dropRows, skipDuplicates: true }),
  ]);

  await markNcItemOpenableFromDrops(capsule.internal_id);
  await revalidateItem(capsule.internal_id, ItemRevalidateTags.drops(capsule.internal_id));

  return {
    capsuleName: snapshot.capsuleName,
    itemsFound: snapshot.items.length,
    itemsCreated,
    dropsSynced: dropRows.length,
  };
}
