import { ListService } from '@services/ListService';
import { expect, test, describe } from 'vitest';

const testList = {
  list_id: 7470,
  username: 'lucca',
  hiddenItem: 5099,
  listCount: 6,
};

const privateList = 651;

describe.concurrent('List Service tests', () => {
  test("Get user's list as guest", async () => {
    const listService = ListService.init();
    const lists = await listService.getUserLists({ username: 'lucca' });

    const hasHidden = lists.some((l) => l.visibility !== 'public');

    expect(lists.length).toBeGreaterThan(0);
    expect(hasHidden).toBe(false);
  });

  test("Get user's list as owner", async () => {
    const listService = ListService.initUser({
      id: 'Ty0G4IOIm4dr3IYJpMx8bIFMs433',
      username: 'lucca',
    } as any);
    const lists = await listService.getUserLists({ username: 'lucca' });

    const hasHidden = lists.some((l) => l.visibility !== 'public');

    expect(lists.length).toBeGreaterThan(0);
    expect(hasHidden).toBe(true);
  });

  describe.concurrent('Valid List as Guest tests', () => {
    const listService = ListService.init();

    test('Get List', async () => {
      const list = await listService.getList({
        listId: testList.list_id,
        username: testList.username,
      });

      expect(list).not.toBeNull();
      expect(list?.itemCount).toBe(testList.listCount);
    });

    test('Get List Item Data', async () => {
      const listItemsRes = await listService.getListItems({
        listId: testList.list_id,
        username: testList.username,
      });

      expect(listItemsRes?.length).toBe(testList.listCount);
      expect(listItemsRes?.find((i) => i.internal_id === testList.hiddenItem)).toBeUndefined();
    });

    test('Get List Item Info', async () => {
      const listItemsProm = listService.getListItemInfo({
        listId: testList.list_id,
        username: testList.username,
      });

      const listItemsRes = await listItemsProm;

      expect(listItemsRes?.length).toBe(testList.listCount);
      expect(listItemsRes?.find((i) => i.isHidden)).toBeUndefined();
    });

    test('Preload List Items', async () => {
      const preloadData = await listService.preloadListItems({
        listId: testList.list_id,
        username: testList.username,
      });

      expect(preloadData?.items.length).toBe(testList.listCount);
      expect(preloadData?.items.find((i) => i.item_iid === testList.hiddenItem)).toBeUndefined();
      expect(Object.keys(preloadData?.itemData || {}).length).toBeLessThanOrEqual(
        testList.listCount
      );
    });
  });

  describe.concurrent('Valid List as Owner tests', () => {
    const listService = ListService.initUser({
      id: 'Ty0G4IOIm4dr3IYJpMx8bIFMs433',
      username: 'lucca',
    } as any);

    test('Get List', async () => {
      const list = await listService.getList({
        listId: testList.list_id,
        username: testList.username,
      });

      expect(list).not.toBeNull();
      expect(list?.itemCount).toBe(testList.listCount);
    });

    test('Get List Item Data', async () => {
      const listItemsRes = await listService.getListItems({
        listId: testList.list_id,
        username: testList.username,
      });

      expect(listItemsRes?.length).toBe(testList.listCount + 1);
      expect(listItemsRes?.find((i) => i.internal_id === testList.hiddenItem)).toBeDefined();
    });

    test('Get List Item Info', async () => {
      const listItemsRes = await listService.getListItemInfo({
        listId: testList.list_id,
        username: testList.username,
      });

      expect(listItemsRes?.length).toBe(testList.listCount + 1);
      expect(listItemsRes?.find((i) => i.isHidden)).toBeDefined();
    });

    test('Preload List Items', async () => {
      const preloadData = await listService.preloadListItems({
        listId: testList.list_id,
        username: testList.username,
      });

      expect(preloadData?.items.length).toBe(testList.listCount);
      expect(preloadData?.items.find((i) => i.item_iid === testList.hiddenItem)).toBeUndefined();
      expect(Object.keys(preloadData?.itemData || {}).length).toBeLessThanOrEqual(
        testList.listCount
      );
    });
  });

  describe.concurrent('Private List as Guest tests', () => {
    const listService = ListService.init();

    test('Get List', async () => {
      const list = await listService.getList({
        listId: privateList,
        username: testList.username,
      });

      expect(list).toBeNull();
    });

    test('Get List Item Data', async () => {
      const listItemsRes = await listService.getListItems({
        listId: privateList,
        username: testList.username,
      });

      expect(listItemsRes).toBeNull();
    });

    test('Get List Item Info', async () => {
      const listItemsRes = await listService.getListItemInfo({
        listId: privateList,
        username: testList.username,
      });

      expect(listItemsRes).toBeNull();
    });

    test('Preload List Items', async () => {
      const preloadData = await listService.preloadListItems({
        listId: privateList,
        username: testList.username,
      });

      expect(preloadData).toBeNull();
    });
  });
});
