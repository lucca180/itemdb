import { useCallback, useEffect, useState } from 'react';
import type { UserList } from '@types';

export type ExtendedUserList = UserList & {
  hasChanged?: boolean;
};

export type ListsEditState = {
  lists: { [list_id: number]: ExtendedUserList };
  listsIds: number[];
};

// one virtualized row: a group header or a chunk of cards (group mode rows are styled
// to look like a single box per group, since ViewportList can't wrap rows in a container)
export type ListsRow =
  | { type: 'group'; key: string; group: string }
  | { type: 'lists'; key: string; lists: ExtendedUserList[]; inGroup: boolean; isLast: boolean };

// UserListCard is 375px wide + 40px left margin (for the overlapping cover), with a 16px gap
const CARD_OUTER_WIDTH = 415;
const CARD_GAP = 16;
// used on the server and before the first measure: prerenders full desktop rows
const DEFAULT_ROW_SIZE = 3;

export function buildListsState(lists: UserList[]): ListsEditState {
  const listsIds = lists.map((list) => list.internal_id);
  const listsMap: { [list_id: number]: ExtendedUserList } = {};

  lists.forEach((list) => {
    listsMap[list.internal_id] = list;
  });

  return { listsIds, lists: listsMap };
}

function groupUserLists(
  lists: { [list_id: number]: ExtendedUserList },
  listsIds: number[]
): { group: string; lists: ExtendedUserList[] }[] {
  const groups: { [key: string]: ExtendedUserList[] } = {};

  listsIds.forEach((id) => {
    const list = lists[id];
    if (!list) return;
    const groupTag = list.userTag ?? '';

    if (!groups[groupTag]) groups[groupTag] = [];
    groups[groupTag].push(list);
  });

  return Object.entries(groups)
    .map(([group, groupLists]) => ({
      group,
      lists: groupLists,
    }))
    .sort((a, b) => {
      if (a.group === '') return 1;
      if (b.group === '') return -1;
      return a.group.localeCompare(b.group);
    });
}

function chunkLists(lists: ExtendedUserList[], size: number) {
  const chunks: ExtendedUserList[][] = [];
  for (let i = 0; i < lists.length; i += size) chunks.push(lists.slice(i, i + size));
  return chunks;
}

export function buildListsRows(
  lists: { [list_id: number]: ExtendedUserList },
  listsIds: number[],
  isGroupMode: boolean,
  rowSize: number
): ListsRow[] {
  if (!isGroupMode) {
    const allLists = listsIds.map((id) => lists[id]).filter(Boolean);

    return chunkLists(allLists, rowSize).map((chunk, i) => ({
      type: 'lists',
      key: `row-${i}`,
      lists: chunk,
      inGroup: false,
      isLast: false,
    }));
  }

  return groupUserLists(lists, listsIds).flatMap(({ group, lists: groupLists }) => {
    const chunks = chunkLists(groupLists, rowSize);

    return [
      { type: 'group', key: `group-${group}`, group } as ListsRow,
      ...chunks.map((chunk, i): ListsRow => ({
        type: 'lists',
        key: `group-${group}-row-${i}`,
        lists: chunk,
        inGroup: true,
        isLast: i === chunks.length - 1,
      })),
    ];
  });
}

/**
 * How many list cards fit side by side in the measured container. Breakpoints don't work
 * here: 3 cards need ~1277px, which lands between `xl` and `2xl` depending on scrollbar/padding.
 * Returns a callback ref, so the measure follows the container when it remounts (edit mode).
 * `inset` is the horizontal padding rows add inside the container (group boxes).
 */
export function useListsRowSize(inset = 0) {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));

    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  const ref = useCallback((node: HTMLElement | null) => setElement(node), []);

  if (width === null) return [ref, DEFAULT_ROW_SIZE] as const;

  const fit = Math.floor((width - inset + CARD_GAP) / (CARD_OUTER_WIDTH + CARD_GAP));
  return [ref, Math.max(1, fit)] as const;
}
