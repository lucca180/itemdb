import { beforeEach, describe, expect, test, vi } from 'vitest';

const getManyItemsV2Mock = vi.hoisted(() => vi.fn());
const getItemV2Mock = vi.hoisted(() => vi.fn());
const afterMock = vi.hoisted(() => vi.fn((fn: () => unknown) => fn()));
const mgetMock = vi.hoisted(() => vi.fn());
const pipelineSetMock = vi.hoisted(() => vi.fn());
const pipelineExecMock = vi.hoisted(() => vi.fn());
const pipelineMock = vi.hoisted(() =>
  vi.fn(() => ({
    set: pipelineSetMock,
    exec: pipelineExecMock,
  }))
);

vi.mock('next/server', () => ({
  after: afterMock,
}));

vi.mock('@app/server/items/v2', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@app/server/items/v2')>();
  return {
    ...actual,
    getManyItemsV2: getManyItemsV2Mock,
    getItemV2: getItemV2Mock,
  };
});

vi.mock('@utils/api/redis', () => ({
  redis: {
    mget: mgetMock,
    pipeline: pipelineMock,
  },
}));

import {
  ITEM_CACHE_BATCH_MAX,
  canCacheMany,
  getCachedItemV2,
  getCachedManyItemsV2,
  itemCacheControl,
  itemCacheKey,
  resolveSinglePathParam,
  toManyCacheKeys,
  toMissQuery,
  wantsFresh,
  writeItemCache,
} from '@app/server/items/itemV2Cache';
import { getIntentTtl } from '@types';

describe('itemV2Cache helpers', () => {
  test('itemCacheKey includes type, key, and intent', () => {
    expect(itemCacheKey('id', '42', 'card')).toBe('iv2:item:id:42:card');
    expect(itemCacheKey('slug', 'Blue-Paint-Brush', 'minimal')).toBe(
      'iv2:item:slug:blue-paint-brush:minimal'
    );
  });

  test('getIntentTtl reads from itemIntents', () => {
    expect(getIntentTtl('minimal')).toBe(600);
    expect(getIntentTtl('card')).toBe(60);
    expect(getIntentTtl('pricer')).toBe(60);
    expect(getIntentTtl('full')).toBe(60);
  });

  test('toManyCacheKeys maps { type, data } to redis keys', () => {
    expect(toManyCacheKeys({ type: 'id', data: ['1', '1'] })).toEqual({
      type: 'id',
      keys: ['1'],
    });

    expect(
      toManyCacheKeys({
        type: 'name_image_id',
        data: [['Blue Paint Brush', 'img1']],
      })
    ).toEqual({
      type: 'name_image_id',
      keys: [`${encodeURI('blue paint brush')}_img1`],
      nameImagePairs: [['Blue Paint Brush', 'img1']],
    });

    expect(
      toManyCacheKeys({
        type: 'name_image_id',
        data: [
          ['Blue Paint Brush', 'img1'],
          ['blue paint brush', 'img1'],
        ],
      })
    ).toEqual({
      type: 'name_image_id',
      keys: [`${encodeURI('blue paint brush')}_img1`],
      nameImagePairs: [['Blue Paint Brush', 'img1']],
    });

    expect(toManyCacheKeys({ type: 'slug', data: ['Foo', 'foo'] })).toEqual({
      type: 'slug',
      keys: ['foo'],
    });
  });

  test('resolveSinglePathParam uses id for numeric paths', () => {
    expect(resolveSinglePathParam('42')).toEqual({ type: 'id', key: '42' });
    expect(resolveSinglePathParam('Blue-Paint-Brush')).toEqual({
      type: 'id_name',
      key: 'blue-paint-brush',
    });
  });

  test('toMissQuery rebuilds a { type, data } query for misses', () => {
    expect(toMissQuery('id', ['1', '2'])).toEqual({ type: 'id', data: ['1', '2'] });
    expect(
      toMissQuery('name_image_id', [`${encodeURI('blue paint brush')}_img1`], {
        nameImagePairs: [
          ['Blue Paint Brush', 'img1'],
          ['Other', 'img2'],
        ],
      })
    ).toEqual({
      type: 'name_image_id',
      data: [['Blue Paint Brush', 'img1']],
    });
  });

  test('canCacheMany respects ITEM_CACHE_BATCH_MAX', () => {
    expect(canCacheMany(ITEM_CACHE_BATCH_MAX)).toBe(true);
    expect(canCacheMany(ITEM_CACHE_BATCH_MAX + 1)).toBe(false);
    expect(canCacheMany(0)).toBe(false);
  });

  test('itemCacheControl and wantsFresh', () => {
    expect(wantsFresh('http://localhost/api/v2/items/1?fresh=1')).toBe(true);
    expect(wantsFresh('http://localhost/api/v2/items/1')).toBe(false);

    expect(itemCacheControl('minimal', { method: 'GET' })).toBe(
      'public, s-maxage=600, stale-while-revalidate=2400'
    );
    expect(itemCacheControl('card', { method: 'GET' })).toBe(
      'public, s-maxage=60, stale-while-revalidate=240'
    );
    expect(itemCacheControl('card', { method: 'POST' })).toBe('private, no-cache');
    expect(itemCacheControl('card', { fresh: true, method: 'GET' })).toBe('no-store');
  });
});

describe('itemV2Cache orchestrators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pipelineSetMock.mockReturnValue({ exec: pipelineExecMock });
    pipelineMock.mockReturnValue({
      set: pipelineSetMock,
      exec: pipelineExecMock,
    });
    afterMock.mockImplementation((fn: () => unknown) => fn());
  });

  test('getCachedManyItemsV2 serves full redis hits without prisma', async () => {
    mgetMock.mockResolvedValueOnce([
      JSON.stringify({ internal_id: 1, name: 'A' }),
      JSON.stringify({ internal_id: 2, name: 'B' }),
    ]);

    const result = await getCachedManyItemsV2(
      { type: 'id', data: ['1', '2'] },
      { intent: 'minimal', limit: 100, fresh: false }
    );

    expect(getManyItemsV2Mock).not.toHaveBeenCalled();
    expect(result.dbCount).toBe(0);
    expect(JSON.parse(result.body)).toEqual({
      '1': { internal_id: 1, name: 'A' },
      '2': { internal_id: 2, name: 'B' },
    });
  });

  test('getCachedManyItemsV2 fetches only misses and schedules writes via after', async () => {
    mgetMock.mockResolvedValueOnce([JSON.stringify({ internal_id: 1, name: 'A' }), null]);
    getManyItemsV2Mock.mockResolvedValueOnce({
      '2': { internal_id: 2, name: 'B' },
    });

    const result = await getCachedManyItemsV2(
      { type: 'id', data: ['1', '2'] },
      { intent: 'card', limit: 100, fresh: false }
    );

    expect(getManyItemsV2Mock).toHaveBeenCalledWith(
      { type: 'id', data: ['2'] },
      { intent: 'card', limit: 100 }
    );
    expect(result.dbCount).toBe(1);
    expect(JSON.parse(result.body)).toEqual({
      '1': { internal_id: 1, name: 'A' },
      '2': { internal_id: 2, name: 'B' },
    });
    expect(afterMock).toHaveBeenCalled();
    expect(pipelineSetMock).toHaveBeenCalled();
  });

  test('getCachedManyItemsV2 skips redis above batch max', async () => {
    const ids = Array.from({ length: ITEM_CACHE_BATCH_MAX + 1 }, (_, i) => String(i + 1));
    getManyItemsV2Mock.mockResolvedValueOnce(
      Object.fromEntries(ids.map((id) => [id, { internal_id: Number(id) }]))
    );

    const result = await getCachedManyItemsV2(
      { type: 'id', data: ids },
      { intent: 'minimal', limit: 10_000, fresh: false }
    );

    expect(mgetMock).not.toHaveBeenCalled();
    expect(afterMock).not.toHaveBeenCalled();
    expect(result.dbCount).toBe(ids.length);
  });

  test('getCachedManyItemsV2 fresh bypasses read but still schedules write', async () => {
    getManyItemsV2Mock.mockResolvedValueOnce({
      '1': { internal_id: 1, name: 'A' },
    });

    const result = await getCachedManyItemsV2(
      { type: 'id', data: ['1'] },
      { intent: 'minimal', limit: 100, fresh: true }
    );

    expect(mgetMock).not.toHaveBeenCalled();
    expect(result.dbCount).toBe(1);
    expect(afterMock).toHaveBeenCalled();
  });

  test('getCachedManyItemsV2 fails open to prisma when mget throws', async () => {
    mgetMock.mockRejectedValueOnce(new Error('redis down'));
    getManyItemsV2Mock.mockResolvedValueOnce({
      '1': { internal_id: 1 },
    });

    const result = await getCachedManyItemsV2(
      { type: 'id', data: ['1'] },
      { intent: 'minimal', limit: 100, fresh: false }
    );

    expect(getManyItemsV2Mock).toHaveBeenCalled();
    expect(result.dbCount).toBe(1);
  });

  test('getCachedManyItemsV2 uses DB-canonical keys for response and redis writes', async () => {
    mgetMock.mockResolvedValueOnce([null]);
    getManyItemsV2Mock.mockResolvedValueOnce({
      '42': { internal_id: 42, name: 'Padded' },
    });

    const result = await getCachedManyItemsV2(
      { type: 'id', data: ['042'] },
      { intent: 'minimal', limit: 100, fresh: false }
    );

    expect(result.dbCount).toBe(1);
    expect(JSON.parse(result.body)).toEqual({
      '42': { internal_id: 42, name: 'Padded' },
    });
    // Cached under DB key only — request "042" is not aliased.
    expect(pipelineSetMock).toHaveBeenCalledWith(
      'iv2:item:id:42:minimal',
      expect.any(String),
      'EX',
      600
    );
    expect(pipelineSetMock).not.toHaveBeenCalledWith(
      'iv2:item:id:042:minimal',
      expect.anything(),
      expect.anything(),
      expect.anything()
    );
  });

  test('getCachedManyItemsV2 returns DB name casing (v1 parity)', async () => {
    mgetMock.mockResolvedValueOnce([null]);
    getManyItemsV2Mock.mockResolvedValueOnce({
      'Blue Paint Brush': { internal_id: 9, name: 'Blue Paint Brush' },
    });

    const result = await getCachedManyItemsV2(
      { type: 'name', data: ['blue paint brush'] },
      { intent: 'minimal', limit: 100, fresh: false }
    );

    expect(result.dbCount).toBe(1);
    expect(JSON.parse(result.body)).toEqual({
      'Blue Paint Brush': { internal_id: 9, name: 'Blue Paint Brush' },
    });
  });

  test('getCachedManyItemsV2 hits redis regardless of request casing', async () => {
    mgetMock.mockResolvedValueOnce([JSON.stringify({ internal_id: 9, name: 'Blue Paint Brush' })]);

    const result = await getCachedManyItemsV2(
      { type: 'slug', data: ['Blue-Paint-Brush'] },
      { intent: 'minimal', limit: 100, fresh: false }
    );

    expect(mgetMock).toHaveBeenCalledWith('iv2:item:slug:blue-paint-brush:minimal');
    expect(getManyItemsV2Mock).not.toHaveBeenCalled();
    expect(JSON.parse(result.body)).toEqual({
      'blue-paint-brush': { internal_id: 9, name: 'Blue Paint Brush' },
    });
  });

  test('getCachedManyItemsV2 deduplicates repeated lookup keys', async () => {
    mgetMock.mockResolvedValueOnce([null]);
    getManyItemsV2Mock.mockResolvedValueOnce({
      '1': { internal_id: 1, name: 'A' },
    });

    const result = await getCachedManyItemsV2(
      { type: 'id', data: ['1', '1'] },
      { intent: 'minimal', limit: 100, fresh: false }
    );

    expect(mgetMock).toHaveBeenCalledWith('iv2:item:id:1:minimal');
    expect(getManyItemsV2Mock).toHaveBeenCalledWith(
      { type: 'id', data: ['1'] },
      { intent: 'minimal', limit: 100 }
    );
    expect(result.dbCount).toBe(1);
    expect(result.body).toBe(JSON.stringify({ '1': { internal_id: 1, name: 'A' } }));
  });

  test('getCachedItemV2 returns hit without prisma', async () => {
    mgetMock.mockResolvedValueOnce([JSON.stringify({ internal_id: 42, name: 'Cached' })]);

    const result = await getCachedItemV2(42, { intent: 'minimal', fresh: false });

    expect(result).toEqual({
      status: 'hit',
      body: JSON.stringify({ internal_id: 42, name: 'Cached' }),
    });
    expect(getItemV2Mock).not.toHaveBeenCalled();
  });

  test('getCachedItemV2 non-numeric path falls back to slug cache', async () => {
    mgetMock
      .mockResolvedValueOnce([null])
      .mockResolvedValueOnce([JSON.stringify({ internal_id: 42, slug: 'fresh' })]);

    const result = await getCachedItemV2('fresh', { intent: 'minimal', fresh: false });

    expect(mgetMock).toHaveBeenNthCalledWith(1, 'iv2:item:id_name:fresh:minimal');
    expect(mgetMock).toHaveBeenNthCalledWith(2, 'iv2:item:slug:fresh:minimal');
    expect(result).toEqual({
      status: 'hit',
      body: JSON.stringify({ internal_id: 42, slug: 'fresh' }),
    });
    expect(getItemV2Mock).not.toHaveBeenCalled();
  });

  test('getCachedItemV2 miss loads prisma and schedules write', async () => {
    mgetMock.mockResolvedValueOnce([null]);
    getItemV2Mock.mockResolvedValueOnce({
      internal_id: 42,
      name: 'Fresh',
      slug: 'fresh',
    });

    const result = await getCachedItemV2(42, { intent: 'minimal', fresh: false });

    expect(result.status).toBe('miss');
    expect(getItemV2Mock).toHaveBeenCalledWith(42, { intent: 'minimal' });
    expect(afterMock).toHaveBeenCalled();
  });

  test('writeItemCache sets lookup key and id alias', async () => {
    await writeItemCache('slug', 'card', [
      { key: 'blue-paint-brush', json: '{"internal_id":9}', internalId: 9 },
    ]);

    expect(pipelineSetMock).toHaveBeenCalledWith(
      'iv2:item:slug:blue-paint-brush:card',
      '{"internal_id":9}',
      'EX',
      60
    );
    expect(pipelineSetMock).toHaveBeenCalledWith(
      'iv2:item:id:9:card',
      '{"internal_id":9}',
      'EX',
      60
    );
  });
});
