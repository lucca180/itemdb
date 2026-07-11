import type { ItemData, ListItemInfo, User, UserList } from '@types';
import { sortListItems } from '@utils/utils';

export const LIST_PRELOAD_LIMIT = 30;
export const LIST_FULL_SERVER_LOAD_THRESHOLD = 500;

/**
 * Loading tiers, cache scopes, merge races, filters vs search — see README.md in this folder.
 */

export type ListItemsData = {
  itemMap: { [id: number]: ListItemInfo };
  infoIds: number[];
  itemInfo: ListItemInfo[];
  items: { [id: string]: ItemData };
};

export type ListCore = {
  list: UserList;
  canEdit: boolean;
  isOwner: boolean;
  viewer: User | null;
};

/** Serializable subset passed to the client — never includes `viewer`. */
export type ListPageClientCore = Pick<ListCore, 'list' | 'canEdit' | 'isOwner'>;

/** Uses `UserList.itemCount` (`visibleItemCount` in DB), not loaded item rows. */
export function getListLoadingStrategy(
  itemCount: number,
  options?: { editorNeedsFullLoad?: boolean }
) {
  const needsFullLoadByCount = itemCount > LIST_PRELOAD_LIMIT;
  const needsEditorActionLoad = !!options?.editorNeedsFullLoad && !needsFullLoadByCount;
  const needsFullLoad = needsFullLoadByCount || needsEditorActionLoad;

  return {
    needsFullLoad,
    useSuspenseFullLoad: needsFullLoadByCount && itemCount <= LIST_FULL_SERVER_LOAD_THRESHOLD,
    useDeferredFullLoad: needsFullLoadByCount && itemCount > LIST_FULL_SERVER_LOAD_THRESHOLD,
    useActionFullLoad:
      needsEditorActionLoad ||
      (needsFullLoadByCount && itemCount > LIST_FULL_SERVER_LOAD_THRESHOLD),
  };
}

export function getSortedListItemInfo(
  itemInfos: ListItemInfo[],
  listData: UserList,
  itemData: { [id: string]: ItemData }
): { infoIds: number[]; itemMap: { [id: number]: ListItemInfo } } {
  const sortedItemInfo = [...itemInfos].sort((a, b) =>
    sortListItems(a, b, listData.sortBy, listData.sortDir, itemData)
  );
  const infoIds: number[] = [];
  const itemMap: { [id: number]: ListItemInfo } = {};

  for (const itemInfo of sortedItemInfo) {
    infoIds.push(itemInfo.internal_id);
    itemMap[itemInfo.internal_id] = itemInfo;
  }

  return { infoIds, itemMap };
}
