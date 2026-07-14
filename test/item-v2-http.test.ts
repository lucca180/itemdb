import { beforeEach, describe, expect, test, vi } from 'vitest';

const getManyItemsV2Mock = vi.hoisted(() => vi.fn());
const getItemV2Mock = vi.hoisted(() => vi.fn());

vi.mock('@app/server/items/v2', () => ({
  getManyItemsV2: getManyItemsV2Mock,
  getItemV2: getItemV2Mock,
}));

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

  test('parses bracketed query params for many lookups', () => {
    const raw = parseManyItemsV2SearchParams(
      'http://localhost/api/v2/items/many?id[]=1&id[]=2&intent=minimal'
    );

    expect(parseManyItemsV2Query(raw)).toEqual({
      id: ['1', '2'],
      item_id: undefined,
      name_image_id: undefined,
      image_id: undefined,
      name: undefined,
      slug: undefined,
    });
    expect(raw.intent).toBe('minimal');
  });
});

describe('ItemV2 HTTP routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('GET /items/many uses minimal intent by default', async () => {
    getManyItemsV2Mock.mockResolvedValueOnce({ '1': { internal_id: 1 } });

    const response = await getMany(new Request('http://localhost/api/v2/items/many?id[]=1'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getManyItemsV2Mock).toHaveBeenCalledWith(expect.objectContaining({ id: ['1'] }), {
      intent: 'minimal',
      limit: 10_000,
    });
    expect(body).toEqual({ '1': { internal_id: 1 } });
  });

  test('POST /items/many rejects invalid intents', async () => {
    const response = await postMany(
      new Request('http://localhost/api/v2/items/many', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: ['1'], intent: 'everything' }),
      })
    );

    expect(response.status).toBe(400);
    expect(getManyItemsV2Mock).not.toHaveBeenCalled();
  });

  test('GET /items/[id_name] returns 404 when missing', async () => {
    getItemV2Mock.mockResolvedValueOnce(null);

    const response = await getById(new Request('http://localhost/api/v2/items/missing'), {
      params: Promise.resolve({ id_name: 'missing' }),
    });

    expect(response.status).toBe(404);
    expect(getItemV2Mock).toHaveBeenCalledWith('missing', { intent: 'minimal' });
  });

  test('GET /items/[id_name] returns the ItemV2 DTO', async () => {
    getItemV2Mock.mockResolvedValueOnce({
      internal_id: 42,
      name: 'Test Item',
    });

    const response = await getById(new Request('http://localhost/api/v2/items/42?intent=minimal'), {
      params: Promise.resolve({ id_name: '42' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getItemV2Mock).toHaveBeenCalledWith(42, { intent: 'minimal' });
    expect(body).toEqual({ internal_id: 42, name: 'Test Item' });
  });
});
