/**
 * Shared list filters for NC trade tabs.
 * Lives outside client components so server loaders can call these functions.
 */
import type { UserList } from '@types';

export function filterSeekingLists(lists?: UserList[]) {
  return lists?.filter((list) => list.purpose === 'seeking' && !list.official) ?? [];
}

export function filterTradingLists(lists?: UserList[]) {
  return lists?.filter((list) => list.purpose === 'trading' && !list.official) ?? [];
}
