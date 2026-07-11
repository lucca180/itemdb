import type { ItemData, ListItemInfo, SearchFilters } from '@types';
import { getFiltersDiff } from '@utils/parseFilters';
import { sortListItems } from '@utils/utils';

export type ExtendedListItemInfo = ListItemInfo & { hasChanged?: boolean };

export type ListSortInfo = { sortBy: string; sortDir: string };

export type MergeListItemsOptions = {
  /** Generation captured when the async request started — stale responses are ignored. */
  mergeGeneration?: number;
  /** True when data arrives from the Suspense slot (not the client action path). */
  fromSuspense?: boolean;
  /** Use list metadata sort (e.g. after refresh); omit to keep the user's current sort. */
  sortFromList?: ListSortInfo;
};

export type ListQtyCount = {
  totalQty: number;
  hidden: number;
  visible: number;
  visibleQty: number;
};

/** Server-side filters are active (search filters modal), not client-only name search. */
export function hasServerFilters(filters: SearchFilters): boolean {
  return Object.keys(getFiltersDiff(filters)).length > 0;
}

/** Client-side name search applied on top of the loaded item rows. */
export function filterItemInfoIdsBySearch(
  itemInfoIds: number[],
  itemInfo: Record<number, ListItemInfo>,
  items: Record<string, ItemData>,
  searchQuery: string
): number[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  if (!normalizedQuery) return itemInfoIds;

  return itemInfoIds.filter((id) =>
    items[itemInfo[id]?.item_iid]?.name.toLowerCase().includes(normalizedQuery)
  );
}

export function buildListSortTypes(isStampList: boolean) {
  return {
    name: 'name',
    price: 'price',
    rarity: 'rarity',
    color: 'color',
    custom: isStampList ? 'album-order' : 'custom',
    addedAt: 'added-at',
    faerieFest: 'recycling-points',
    item_id: 'item-id',
    quantity: 'quantity',
    price_qty: 'price-quantity',
  };
}

/**
 * Item counts for the header label and tooltip.
 * While a tiered full load is in progress, the tooltip unique count uses the DB value.
 */
export function computeListQtyCount(params: {
  displayedItemInfoIds: number[];
  itemInfo: Record<number, ListItemInfo>;
  isLoading: boolean;
  needsFullLoad: boolean;
  isServerFiltered: boolean;
  cachedVisibleCount: number;
}): ListQtyCount {
  const {
    displayedItemInfoIds,
    itemInfo,
    isLoading,
    needsFullLoad,
    isServerFiltered,
    cachedVisibleCount,
  } = params;

  const useDbUniqueCount = isLoading && needsFullLoad && !isServerFiltered;

  const countObj: ListQtyCount = {
    totalQty: 0,
    hidden: 0,
    visible: 0,
    visibleQty: 0,
  };

  displayedItemInfoIds.forEach((id) => {
    countObj.totalQty += itemInfo[id]?.amount ?? 1;

    if (itemInfo[id]?.isHidden) {
      countObj.hidden += 1;
    } else {
      countObj.visible += 1;
      countObj.visibleQty += itemInfo[id]?.amount ?? 1;
    }
  });

  if (useDbUniqueCount) {
    countObj.visible = cachedVisibleCount;
  }

  return countObj;
}

/** Returns false when a merge should be dropped (stale generation or active server filters + Suspense). */
export function shouldMergeListItems(
  options: MergeListItemsOptions | undefined,
  currentGeneration: number,
  skipSuspenseMerge: boolean
): boolean {
  if (options?.mergeGeneration !== undefined && currentGeneration !== options.mergeGeneration) {
    return false;
  }
  if (options?.fromSuspense && skipSuspenseMerge) {
    return false;
  }
  return true;
}

/** Re-sort visible rows client-side without persisting to the server. */
export function sortItemInfoIds(
  itemInfo: Record<number, ListItemInfo>,
  sortBy: string,
  sortDir: string,
  items: Record<string, ItemData>
): number[] {
  return Object.values(itemInfo)
    .sort((a, b) => sortListItems(a, b, sortBy, sortDir, items))
    .map((item) => item.internal_id);
}

export type DragSortResult = {
  itemInfoIds: number[];
  itemInfo: Record<number, ExtendedListItemInfo>;
  hasChanges: boolean;
};

/** Apply a drag-and-drop reorder for non-highlight items in custom sort mode. */
export function applyDragSortOrder(
  itemInfoIds: number[],
  itemInfo: Record<number, ExtendedListItemInfo>,
  newOrder: number[]
): DragSortResult | null {
  const highlights = itemInfoIds.filter((id) => itemInfo[id].isHighlight);
  const currentOrder = itemInfoIds.filter((id) => !itemInfo[id].isHighlight);

  if (
    currentOrder.length === newOrder.length &&
    currentOrder.every((id, index) => id === newOrder[index])
  ) {
    return null;
  }

  const newInfo = { ...itemInfo };
  let changed = false;

  for (let i = 0; i < newOrder.length; i++) {
    if (newInfo[newOrder[i]].order === i) continue;
    newInfo[newOrder[i]] = {
      ...newInfo[newOrder[i]],
      order: i,
      hasChanged: true,
    };
    changed = true;
  }

  return {
    itemInfoIds: [...newOrder, ...highlights],
    itemInfo: newInfo,
    hasChanges: changed,
  };
}
