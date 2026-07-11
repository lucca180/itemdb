import { describe, expect, it } from 'vitest';
import type { ItemData, ListItemInfo, UserList } from '@types';
import { getSortedListItemInfo } from '@app/[locale]/lists/[username]/[list_id]/listPage';

describe('getSortedListItemInfo', () => {
  it('sorts and maps list item info without mutating the input array', () => {
    const first = { internal_id: 1, item_iid: 101, order: 2 } as ListItemInfo;
    const second = { internal_id: 2, item_iid: 102, order: 1 } as ListItemInfo;
    const itemInfos = [first, second];
    const items = {
      101: { internal_id: 101, name: 'First' } as ItemData,
      102: { internal_id: 102, name: 'Second' } as ItemData,
    };
    const list = { sortBy: 'custom', sortDir: 'asc' } as UserList;

    const result = getSortedListItemInfo(itemInfos, list, items);

    expect(result.infoIds).toEqual([2, 1]);
    expect(result.itemMap).toEqual({ 1: first, 2: second });
    expect(itemInfos).toEqual([first, second]);
  });
});
