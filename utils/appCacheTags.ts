/** Home page tags — must match `'use cache'` tags in App Router home sections. */
export const HOME_CACHE_TAGS = [
  'home-latest-items',
  'home-latest-nc-mall',
  'home-latest-wearable-items',
  'home-trending-items',
  'home-trending-lists',
  'home-latest-articles',
  'home-latest-prices',
  'home-event-card-lists',
  'home-new-item-count',
] as const;

export type HomeCacheTag = (typeof HOME_CACHE_TAGS)[number];

/**
 * Item page Data Cache scopes — one tag per card/loader (`item-{id}-{scope}`).
 * Every `'use cache'` loader on the item page should use `itemSectionCacheTags(id, scope)`.
 */
export const ITEM_PAGE_CACHE_SCOPES = [
  'mme',
  'dye',
  'recipes',
  'parent',
  'similar',
  'avy',
  'auction',
  'trade',
  'petpet',
  'drops',
  'drop-items',
  'nc-insights',
  'nc-mall',
  'lebron',
  'last-seen',
  'effects',
  'wearable',
  'colors',
  'lists',
  'np-prices',
  'trade-lists',
] as const;

export type ItemPageCacheScope = (typeof ITEM_PAGE_CACHE_SCOPES)[number];

/** Umbrella tag — present on every item section cache for broad invalidation. */
export type ItemRootCacheTag = `item-${number}`;

/** Section-scoped tag — invalidates a single card/loader. */
export type ItemSectionCacheTag = `item-${number}-${ItemPageCacheScope}`;

export type ItemScopedCacheTag = ItemRootCacheTag | ItemSectionCacheTag;

export type AppCacheTag = HomeCacheTag | ItemScopedCacheTag;

export function itemRootTag(internalId: number): ItemRootCacheTag {
  return `item-${internalId}`;
}

export function itemSectionTag(internalId: number, scope: ItemPageCacheScope): ItemSectionCacheTag {
  return `item-${internalId}-${scope}`;
}

/**
 * Tags for item page section caches: root (PATCH item / delete) + section scope (targeted admin edits).
 */
export function itemSectionCacheTags(
  internalId: number,
  scope: ItemPageCacheScope
): readonly [ItemRootCacheTag, ItemSectionCacheTag] {
  return [itemRootTag(internalId), itemSectionTag(internalId, scope)];
}

/** Presets for `revalidateItem` — map admin mutations to the smallest tag set. */
export const ItemRevalidateTags = {
  /** Item PATCH/DELETE — invalidates every section carrying the root tag. */
  root: (internalId: number) => [itemRootTag(internalId)] as const,

  effects: (internalId: number) =>
    [itemSectionTag(internalId, 'effects'), itemSectionTag(internalId, 'wearable')] as const,

  drops: (internalId: number) =>
    [itemSectionTag(internalId, 'drops'), itemSectionTag(internalId, 'drop-items')] as const,

  petpet: (internalId: number) => [itemSectionTag(internalId, 'petpet')] as const,

  colors: (internalId: number) => [itemSectionTag(internalId, 'colors')] as const,

  /** Outfit / general preview regeneration. */
  preview: (internalId: number) =>
    [itemSectionTag(internalId, 'wearable'), itemSectionTag(internalId, 'avy')] as const,
} as const;

export const HomeRevalidateTags = {
  latestItems: 'home-latest-items',
  latestNcMall: 'home-latest-nc-mall',
  latestWearableItems: 'home-latest-wearable-items',
  trendingItems: 'home-trending-items',
  trendingLists: 'home-trending-lists',
  latestArticles: 'home-latest-articles',
  latestPrices: 'home-latest-prices',
  eventCardLists: 'home-event-card-lists',
  newItemCount: 'home-new-item-count',
} as const satisfies Record<string, HomeCacheTag>;

const ITEM_ROOT_TAG_PATTERN = /^item-(\d+)$/;
const ITEM_SECTION_TAG_PATTERN = /^item-(\d+)-([a-z][a-z0-9-]*)$/;

export function parseItemTagInternalId(tag: ItemScopedCacheTag): number {
  const rootMatch = tag.match(ITEM_ROOT_TAG_PATTERN);
  if (rootMatch) return Number(rootMatch[1]);

  const sectionMatch = tag.match(ITEM_SECTION_TAG_PATTERN);
  if (sectionMatch) return Number(sectionMatch[1]);

  throw new Error(`Invalid item cache tag: ${tag}`);
}

export function parseItemSectionTag(tag: ItemSectionCacheTag): {
  internalId: number;
  scope: ItemPageCacheScope;
} {
  const match = tag.match(ITEM_SECTION_TAG_PATTERN);
  if (!match) throw new Error(`Invalid item section cache tag: ${tag}`);

  const scope = match[2] as ItemPageCacheScope;
  if (!(ITEM_PAGE_CACHE_SCOPES as readonly string[]).includes(scope)) {
    throw new Error(`Unknown item page cache scope in tag: ${tag}`);
  }

  return { internalId: Number(match[1]), scope };
}

export function isAppCacheTag(tag: string): tag is AppCacheTag {
  if ((HOME_CACHE_TAGS as readonly string[]).includes(tag)) return true;

  if (ITEM_ROOT_TAG_PATTERN.test(tag)) return true;

  const sectionMatch = tag.match(ITEM_SECTION_TAG_PATTERN);
  if (sectionMatch) {
    return (ITEM_PAGE_CACHE_SCOPES as readonly string[]).includes(sectionMatch[2]);
  }

  return false;
}

/** Ensures item-scoped tags reference the same internal id (dev aid). */
export function assertTagsMatchInternalId(internalId: number, tags: readonly AppCacheTag[]): void {
  if (process.env.NODE_ENV === 'production') return;

  for (const tag of tags) {
    if (
      tag.startsWith('item-') &&
      parseItemTagInternalId(tag as ItemScopedCacheTag) !== internalId
    ) {
      throw new Error(`Tag ${tag} does not match internalId ${internalId}`);
    }
  }
}
