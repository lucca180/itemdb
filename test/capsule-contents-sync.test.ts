import { beforeEach, describe, expect, test, vi } from 'vitest';
import axios from 'axios';
import {
  buildCapsuleSyncPreview,
  fetchCapsuleContents,
  type CapsuleContentsItem,
} from '@utils/item/capsuleContentsSync';

vi.mock('axios');

const mockedGet = vi.mocked(axios.get);

beforeEach(() => {
  mockedGet.mockReset();
});

const apiItem = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 1,
  name: 'Test Item',
  imageFile: 'abc123',
  tier: 4,
  tierLabel: 'Standard',
  isBonus: false,
  category: 'Wearable',
  ...overrides,
});

describe('fetchCapsuleContents', () => {
  test('builds a full images.neopets.com URL from imageFile and drops the raw category', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        error: '0',
        capsule_id: 123,
        capsule_type: 2,
        capsule_type_name: 'Mystery Capsule',
        capsule_name: 'Test Capsule',
        data: [apiItem({ id: 1, imageFile: 'abc123' })],
        bonusItems: [],
        totalItems: 1,
        totalPages: 1,
        page: 1,
        limit: 50,
      },
    });

    const snapshot = await fetchCapsuleContents(123);

    expect(snapshot.items).toHaveLength(1);
    expect(snapshot.items[0]).toEqual({
      item_id: 1,
      name: 'Test Item',
      img: 'https://images.neopets.com/items/abc123.gif',
      isBonus: false,
    });
    expect(snapshot.items[0]).not.toHaveProperty('category');
  });

  test('paginates through totalPages and merges bonusItems from the first page only', async () => {
    mockedGet
      .mockResolvedValueOnce({
        data: {
          error: '0',
          capsule_id: 123,
          capsule_type: 2,
          capsule_type_name: 'Mystery Capsule',
          capsule_name: 'Test Capsule',
          data: [apiItem({ id: 1, imageFile: 'page1' })],
          bonusItems: [apiItem({ id: 99, imageFile: 'bonus', isBonus: true })],
          totalItems: 2,
          totalPages: 2,
          page: 1,
          limit: 1,
        },
      })
      .mockResolvedValueOnce({
        data: {
          error: '0',
          capsule_id: 123,
          capsule_type: 2,
          capsule_type_name: 'Mystery Capsule',
          capsule_name: 'Test Capsule',
          data: [apiItem({ id: 2, imageFile: 'page2' })],
          bonusItems: [apiItem({ id: 99, imageFile: 'bonus', isBonus: true })],
          totalItems: 2,
          totalPages: 2,
          page: 2,
          limit: 1,
        },
      });

    const snapshot = await fetchCapsuleContents(123);

    expect(mockedGet).toHaveBeenCalledTimes(2);
    const itemIds = snapshot.items.map((item) => item.item_id).sort();
    expect(itemIds).toEqual([1, 2, 99]);
    expect(snapshot.items.find((item) => item.item_id === 99)?.isBonus).toBe(true);
  });

  test('resolves per-item category from categories[].items, page by page', async () => {
    mockedGet
      .mockResolvedValueOnce({
        data: {
          error: '0',
          capsule_id: 123,
          capsule_type: 3,
          capsule_type_name: 'Retired Mystery Capsule',
          capsule_name: 'Test Capsule',
          data: [apiItem({ id: 1, imageFile: 'clothing-item' })],
          categories: [
            { key: 'clothing', name: 'Clothing', count: 1, items: [apiItem({ id: 1 })] },
            { key: 'accessories', name: 'Accessories', count: 1, items: [] },
            { key: 'trinkets', name: 'Trinkets', count: 1, items: [] },
          ],
          bonusItems: [],
          totalItems: 2,
          totalPages: 2,
          page: 1,
          limit: 1,
        },
      })
      .mockResolvedValueOnce({
        data: {
          error: '0',
          capsule_id: 123,
          capsule_type: 3,
          capsule_type_name: 'Retired Mystery Capsule',
          capsule_name: 'Test Capsule',
          data: [apiItem({ id: 2, imageFile: 'trinket-item' })],
          categories: [
            { key: 'clothing', name: 'Clothing', count: 1, items: [] },
            { key: 'accessories', name: 'Accessories', count: 1, items: [] },
            { key: 'trinkets', name: 'Trinkets', count: 1, items: [apiItem({ id: 2 })] },
          ],
          bonusItems: [],
          totalItems: 2,
          totalPages: 2,
          page: 2,
          limit: 1,
        },
      });

    const snapshot = await fetchCapsuleContents(123);

    expect(snapshot.items.find((item) => item.item_id === 1)?.category).toBe('clothing');
    expect(snapshot.items.find((item) => item.item_id === 2)?.category).toBe('trinkets');
  });

  test('capsules without a categories breakdown leave category undefined', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        error: '0',
        capsule_id: 123,
        capsule_type: 2,
        capsule_type_name: 'Mystery Capsule',
        capsule_name: 'Test Capsule',
        data: [apiItem({ id: 1 })],
        categories: [],
        bonusItems: [],
        totalItems: 1,
        totalPages: 1,
        page: 1,
        limit: 50,
      },
    });

    const snapshot = await fetchCapsuleContents(123);
    expect(snapshot.items[0]).not.toHaveProperty('category');
  });

  test('throws when the API reports an error', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        error: '1',
        capsule_id: 123,
        capsule_type: 0,
        capsule_type_name: '',
        capsule_name: '',
        data: [],
        bonusItems: [],
        totalItems: 0,
        totalPages: 0,
        page: 1,
        limit: 50,
      },
    });

    await expect(fetchCapsuleContents(123)).rejects.toThrow(/error/i);
  });
});

describe('buildCapsuleSyncPreview', () => {
  const snapshotItem = (item_id: number, overrides: Partial<CapsuleContentsItem> = {}) => ({
    item_id,
    name: `Item ${item_id}`,
    img: `https://images.neopets.com/items/${item_id}.gif`,
    isBonus: false,
    ...overrides,
  });

  const dbItem = (internal_id: number, item_id: number) => ({
    internal_id,
    item_id,
    name: `Db ${item_id}`,
    image: null,
  });

  test('classifies added, changed, unchanged, removed and new items', () => {
    const preview = buildCapsuleSyncPreview(
      {
        capsuleName: 'Test Capsule',
        capsuleTypeName: 'Mystery Capsule',
        items: [
          snapshotItem(1),
          snapshotItem(2, { isBonus: true }),
          snapshotItem(3, { category: 'clothing' }),
          snapshotItem(4),
          snapshotItem(5),
        ],
      },
      [dbItem(11, 1), dbItem(12, 2), dbItem(13, 3), dbItem(14, 4), dbItem(16, 6)],
      [
        { item_iid: 11, limitedEdition: false, prizePool: null },
        { item_iid: 12, limitedEdition: false, prizePool: null },
        { item_iid: 13, limitedEdition: false, prizePool: 'Clothing' },
        { item_iid: 16, limitedEdition: true, prizePool: null },
      ]
    );

    const byName = Object.fromEntries(preview.items.map((row) => [row.name, row]));

    expect(preview.itemsFound).toBe(5);
    expect(byName['Item 1'].status).toBe('unchanged');
    expect(byName['Item 2']).toMatchObject({
      status: 'changed',
      isLE: true,
      previous: { isLE: false, pool: null },
    });
    expect(byName['Item 3'].status).toBe('unchanged');
    expect(byName['Item 4']).toMatchObject({ status: 'added', item_iid: 14 });
    expect(byName['Item 5']).toMatchObject({ status: 'added', item_iid: null });
    expect(byName['Db 6']).toMatchObject({ status: 'removed', item_iid: 16, isLE: true });
  });

  test('an empty snapshot changes nothing', () => {
    const preview = buildCapsuleSyncPreview(
      { capsuleName: 'Empty', capsuleTypeName: 'Mystery Capsule', items: [] },
      [dbItem(11, 1)],
      [{ item_iid: 11, limitedEdition: false, prizePool: null }]
    );

    expect(preview.items).toEqual([]);
  });
});
