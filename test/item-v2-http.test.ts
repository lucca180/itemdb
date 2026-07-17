import { beforeEach, describe, expect, test, vi } from 'vitest';
import { NextRequest } from 'next/server';

const getCachedManyItemsV2Mock = vi.hoisted(() => vi.fn());
const getCachedItemV2Mock = vi.hoisted(() => vi.fn());
const trackItemQuotaMock = vi.hoisted(() => vi.fn());

vi.mock('@app/server/items/itemV2Cache', async () => {
  const actual = await vi.importActual<typeof import('@app/server/items/itemV2Cache')>(
    '@app/server/items/itemV2Cache'
  );
  return {
    ...actual,
    getCachedManyItemsV2: getCachedManyItemsV2Mock,
    getCachedItemV2: getCachedItemV2Mock,
  };
});

vi.mock('@utils/api/redis', async () => {
  const actual = await vi.importActual<typeof import('@utils/api/redis')>('@utils/api/redis');
  return {
    ...actual,
    trackItemQuota: trackItemQuotaMock,
  };
});

import { GET as getMany, POST as postMany } from '@app/api/v2/items/many/route';
import { GET as getById } from '@app/api/v2/items/[id_name]/route';
import { parseManyItemsV2Query, parseManyItemsV2SearchParams } from '@app/api/v2/items/parse';
import { parseItemIntent } from '@types';

describe('ItemV2 HTTP parsing', () => {
  test('parses intents from itemIntents with a default fallback', () => {
    expect(parseItemIntent(undefined, 'card')).toBe('card');
    expect(parseItemIntent('minimal', 'card')).toBe('minimal');
    expect(parseItemIntent('pricer', 'card')).toBe('pricer');
    expect(parseItemIntent('nope', 'card')).toBeNull();
  });

  test('parses { type, data } from query string', () => {
    const raw = parseManyItemsV2SearchParams(
      'http://localhost/api/v2/items/many?type=id&data[]=1&data[]=2&intent=minimal'
    );

    expect(parseManyItemsV2Query(raw)).toEqual({
      type: 'id',
      data: ['1', '2'],
    });
    expect(raw.intent).toBe('minimal');
  });

  test('parses { type, data } from body', () => {
    expect(
      parseManyItemsV2Query({
        type: 'slug',
        data: ['blue-paint-brush'],
        intent: 'card',
      })
    ).toEqual({ type: 'slug', data: ['blue-paint-brush'] });
  });

  test('rejects legacy flat lookup fields', () => {
    expect(parseManyItemsV2Query({ id: ['1'], intent: 'minimal' })).toBeNull();
  });
});

describe('ItemV2 HTTP routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('GET /items/many uses minimal intent by default and sets CDN Cache-Control', async () => {
    getCachedManyItemsV2Mock.mockResolvedValueOnce({
      body: JSON.stringify({ '1': { internal_id: 1 } }),
      dbCount: 1,
    });

    const response = await getMany(
      new NextRequest('http://localhost/api/v2/items/many?type=id&data[]=1')
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe(
      'public, s-maxage=600, stale-while-revalidate=2400'
    );
    expect(getCachedManyItemsV2Mock).toHaveBeenCalledWith(
      { type: 'id', data: ['1'] },
      {
        intent: 'minimal',
        limit: 10_000,
        fresh: false,
      }
    );
    expect(trackItemQuotaMock).toHaveBeenCalledWith(1, expect.any(NextRequest));
    expect(body).toEqual({ '1': { internal_id: 1 } });
  });

  test('GET /items/many cache hit does not count quota', async () => {
    getCachedManyItemsV2Mock.mockResolvedValueOnce({
      body: JSON.stringify({ '1': { internal_id: 1 } }),
      dbCount: 0,
    });

    await getMany(new NextRequest('http://localhost/api/v2/items/many?type=id&data[]=1'));

    expect(trackItemQuotaMock).not.toHaveBeenCalled();
  });

  test('POST /items/many rejects invalid intents', async () => {
    const response = await postMany(
      new NextRequest('http://localhost/api/v2/items/many', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'id', data: ['1'], intent: 'everything' }),
      })
    );

    expect(response.status).toBe(400);
    expect(getCachedManyItemsV2Mock).not.toHaveBeenCalled();
  });

  test('POST /items/many uses private Cache-Control', async () => {
    getCachedManyItemsV2Mock.mockResolvedValueOnce({
      body: '{}',
      dbCount: 0,
    });

    const response = await postMany(
      new NextRequest('http://localhost/api/v2/items/many', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'id', data: ['1'], intent: 'card' }),
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-cache');
  });

  test('GET /items/many?fresh=1 sets no-store', async () => {
    getCachedManyItemsV2Mock.mockResolvedValueOnce({
      body: JSON.stringify({ '1': { internal_id: 1 } }),
      dbCount: 1,
    });

    const response = await getMany(
      new NextRequest('http://localhost/api/v2/items/many?type=id&data[]=1&fresh=1')
    );

    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(getCachedManyItemsV2Mock).toHaveBeenCalledWith(expect.anything(), {
      intent: 'minimal',
      limit: 10_000,
      fresh: true,
    });
  });

  test('GET /items/[id_name] returns 404 when missing', async () => {
    getCachedItemV2Mock.mockResolvedValueOnce({ status: 'not_found' });

    const response = await getById(new NextRequest('http://localhost/api/v2/items/missing'), {
      params: Promise.resolve({ id_name: 'missing' }),
    });

    expect(response.status).toBe(404);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(getCachedItemV2Mock).toHaveBeenCalledWith('missing', {
      intent: 'minimal',
      fresh: false,
    });
  });

  test('GET /items/[id_name] returns the ItemV2 DTO and counts miss quota', async () => {
    getCachedItemV2Mock.mockResolvedValueOnce({
      status: 'miss',
      body: JSON.stringify({ internal_id: 42, name: 'Test Item' }),
    });

    const response = await getById(
      new NextRequest('http://localhost/api/v2/items/42?intent=minimal'),
      {
        params: Promise.resolve({ id_name: '42' }),
      }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe(
      'public, s-maxage=600, stale-while-revalidate=2400'
    );
    expect(getCachedItemV2Mock).toHaveBeenCalledWith(42, { intent: 'minimal', fresh: false });
    expect(trackItemQuotaMock).toHaveBeenCalledWith(1, expect.any(NextRequest));
    expect(body).toEqual({ internal_id: 42, name: 'Test Item' });
  });

  test('GET /items/[id_name] hit skips quota', async () => {
    getCachedItemV2Mock.mockResolvedValueOnce({
      status: 'hit',
      body: JSON.stringify({ internal_id: 42 }),
    });

    await getById(new NextRequest('http://localhost/api/v2/items/42'), {
      params: Promise.resolve({ id_name: '42' }),
    });

    expect(trackItemQuotaMock).not.toHaveBeenCalled();
  });
});
