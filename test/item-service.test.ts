import { beforeEach, describe, expect, test, vi } from 'vitest';

const getItemV2Mock = vi.hoisted(() => vi.fn());
const getManyItemsV2Mock = vi.hoisted(() => vi.fn());
const getCachedItemV2Mock = vi.hoisted(() => vi.fn());
const getCachedManyItemsV2Mock = vi.hoisted(() => vi.fn());

vi.mock('@app/server/items/v2', () => ({
  getItemV2: getItemV2Mock,
  getManyItemsV2: getManyItemsV2Mock,
}));

vi.mock('@app/server/items/itemV2Cache', () => ({
  getCachedItemV2: getCachedItemV2Mock,
  getCachedManyItemsV2: getCachedManyItemsV2Mock,
}));

// The loaders pull in Prisma/Umami; stub them since they are not under test here.
vi.mock('@services/item/latestItems', () => ({ getLatestItemsV2: vi.fn() }));
vi.mock('@services/item/trendingItems', () => ({ getTrendingItemsV2: vi.fn() }));
vi.mock('@services/item/mallItems', () => ({ getNCMallItemsDataV2: vi.fn() }));
vi.mock('@services/item/latestPricedItems', () => ({ getLatestPricedItemsV2: vi.fn() }));

import { ItemService } from '@services/ItemService';

describe('ItemService.getItem', () => {
  beforeEach(() => vi.clearAllMocks());

  test('cached:false calls the engine directly', async () => {
    const item = { internal_id: 1 };
    getItemV2Mock.mockResolvedValue(item);

    const result = await ItemService.getItem(1, { intent: 'card' });

    expect(getItemV2Mock).toHaveBeenCalledWith(1, { intent: 'card' });
    expect(getCachedItemV2Mock).not.toHaveBeenCalled();
    expect(result).toBe(item);
  });

  test('cached:true parses the cache body', async () => {
    const item = { internal_id: 42 };
    getCachedItemV2Mock.mockResolvedValue({ status: 'hit', body: JSON.stringify(item) });

    const result = await ItemService.getItem(42, { intent: 'card', cached: true });

    expect(getCachedItemV2Mock).toHaveBeenCalledWith(42, { intent: 'card', fresh: false });
    expect(getItemV2Mock).not.toHaveBeenCalled();
    expect(result).toEqual(item);
  });

  test('cached:true returns null on not_found', async () => {
    getCachedItemV2Mock.mockResolvedValue({ status: 'not_found' });

    const result = await ItemService.getItem(999, { cached: true });

    expect(result).toBeNull();
  });
});

describe('ItemService.getManyItems', () => {
  beforeEach(() => vi.clearAllMocks());

  test('cached:false calls the engine directly', async () => {
    const items = { '1': { internal_id: 1 } };
    getManyItemsV2Mock.mockResolvedValue(items);

    const result = await ItemService.getManyItems({ type: 'id', data: ['1'] }, { intent: 'card' });

    expect(getManyItemsV2Mock).toHaveBeenCalledWith(
      { type: 'id', data: ['1'] },
      { intent: 'card', limit: undefined }
    );
    expect(getCachedManyItemsV2Mock).not.toHaveBeenCalled();
    expect(result).toBe(items);
  });

  test('cached:true parses the cache body', async () => {
    const items = { '42': { internal_id: 42 } };
    getCachedManyItemsV2Mock.mockResolvedValue({ body: JSON.stringify(items), dbCount: 0 });

    const result = await ItemService.getManyItems(
      { type: 'id', data: ['42'] },
      { intent: 'card', cached: true }
    );

    expect(getCachedManyItemsV2Mock).toHaveBeenCalledWith(
      { type: 'id', data: ['42'] },
      { intent: 'card', fresh: false, limit: 60000 }
    );
    expect(getManyItemsV2Mock).not.toHaveBeenCalled();
    expect(result).toEqual(items);
  });
});
