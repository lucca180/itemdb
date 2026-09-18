import { beforeEach, describe, expect, test, vi } from 'vitest';
import axios from 'axios';
import { fetchCapsuleContents } from '@utils/item/capsuleContentsSync';

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
