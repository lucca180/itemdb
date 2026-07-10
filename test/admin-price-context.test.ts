import { beforeEach, describe, expect, test, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  listItems: {
    findMany: vi.fn(),
  },
  openableItems: {
    findMany: vi.fn(),
  },
  itemPrices: {
    updateMany: vi.fn(),
  },
  $queryRaw: vi.fn(),
}));

const getManyItemsMock = vi.hoisted(() => vi.fn());
const getServerCurrentUserMock = vi.hoisted(() => vi.fn());
const getItemDropsMock = vi.hoisted(() => vi.fn());
const createLogMock = vi.hoisted(() => vi.fn());

vi.mock('server-only', () => ({}));

vi.mock('@utils/prisma', () => ({
  default: prismaMock,
}));

vi.mock('@pages/api/v1/items/many', () => ({
  getManyItems: getManyItemsMock,
}));

vi.mock('@pages/api/v1/items/[id_name]/drops', () => ({
  getItemDrops: getItemDropsMock,
}));

vi.mock('@utils/auth/getServerCurrentUser', () => ({
  getServerCurrentUser: getServerCurrentUserMock,
}));

vi.mock('@services/ActionLogService', () => ({
  LogService: {
    createLog: createLogMock,
  },
}));

import { POST as applyPOST } from '@app/api/admin/price-context/apply/route';
import { POST as previewPOST } from '@app/api/admin/price-context/preview/route';
import { POST as sourcePOST } from '@app/api/admin/price-context/source/route';
import {
  MAX_PRICE_CONTEXT_ITEM_IDS,
  MAX_PRICE_CONTEXT_LENGTH,
  parseBulkItemIdentifiers,
} from '@app/api/admin/price-context/priceContextService';

const item = (id: number, name = `Item ${id}`) =>
  ({
    internal_id: id,
    name,
    image: `https://images.example/${id}.gif`,
    type: 'np',
    isNC: false,
    status: 'active',
  }) as any;

const price = (
  internal_id: number,
  item_iid: number,
  addedAt: string,
  priceContext: string | null = null,
  noInflation_id: number | null = null
) =>
  ({
    internal_id,
    item_iid,
    price: 123,
    addedAt: new Date(addedAt),
    priceContext,
    noInflation_id,
  }) as any;

const request = (body: unknown) =>
  new Request('http://localhost/api/admin/price-context', {
    method: 'POST',
    body: JSON.stringify(body),
  });

describe('admin price context route handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerCurrentUserMock.mockResolvedValue({ user: { id: 'admin-user', isAdmin: true } });
    getManyItemsMock.mockImplementation(({ id, name }: { id?: string[]; name?: string[] }) => {
      const items = {
        101: item(101, 'Alpha'),
        102: item(102, 'Beta'),
        103: item(103, 'Gamma'),
      } as Record<string, ReturnType<typeof item>>;

      const byId = Object.fromEntries(
        (id ?? []).flatMap((itemId) => (items[itemId] ? [[itemId, items[itemId]]] : []))
      );
      const byName = Object.fromEntries(
        (name ?? []).flatMap((itemName) => {
          const match = Object.values(items).find((loadedItem) => loadedItem.name === itemName);
          return match ? [[itemName, match]] : [];
        })
      );

      return { ...byId, ...byName };
    });
    getItemDropsMock.mockResolvedValue({
      pools: {
        'normal-1-1': {
          name: 'normal-1-1',
          items: [101, 102],
          openings: 2,
          totalDrops: 2,
          minDrop: 1,
          maxDrop: 1,
          isChance: false,
          isLE: false,
        },
        le: {
          name: 'le',
          items: [103],
          openings: 1,
          totalDrops: 1,
          minDrop: 1,
          maxDrop: 1,
          isChance: false,
          isLE: true,
        },
      },
      drops: {
        101: { item_iid: 101, dropRate: 50, notes: null, isLE: false, pool: 'normal-1-1' },
        102: { item_iid: 102, dropRate: 50, notes: null, isLE: false, pool: 'normal-1-1' },
        103: { item_iid: 103, dropRate: 10, notes: null, isLE: true, pool: 'le' },
      },
    });
  });

  test('rejects unauthorized users', async () => {
    getServerCurrentUserMock.mockResolvedValue({ user: null });

    const res = await previewPOST(request({ itemIds: [101], startDate: '2024-01-01' }));

    expect(res.status).toBe(401);
  });

  test('rejects invalid preview payloads', async () => {
    const res = await previewPOST(request({ itemIds: [], startDate: 'bad-date' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBeDefined();
  });

  test('rejects too many item IDs', async () => {
    const itemIds = Array.from({ length: MAX_PRICE_CONTEXT_ITEM_IDS + 1 }, (_, index) => index + 1);

    const res = await previewPOST(request({ itemIds, startDate: '2024-01-01' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe(`Too many item IDs (max ${MAX_PRICE_CONTEXT_ITEM_IDS})`);
  });

  test('rejects priceContext longer than the database limit', async () => {
    const res = await applyPOST(
      request({
        itemIds: [101],
        startDate: '2024-01-01',
        priceContext: 'x'.repeat(MAX_PRICE_CONTEXT_LENGTH + 1),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe(`priceContext exceeds ${MAX_PRICE_CONTEXT_LENGTH} characters`);
    expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
    expect(prismaMock.itemPrices.updateMany).not.toHaveBeenCalled();
  });

  test('loads source items from a selected list', async () => {
    prismaMock.listItems.findMany.mockResolvedValue([{ item_iid: 101 }, { item_iid: 102 }]);

    const res = await sourcePOST(
      request({
        source: 'list',
        selectedList: { internal_id: 55 },
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(prismaMock.listItems.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { list_id: 55, isHidden: false },
      })
    );
    expect(getManyItemsMock).toHaveBeenCalledWith({ id: ['101', '102'] });
    expect(body.items).toHaveLength(2);
  });

  test('loads source items from a direct list_id', async () => {
    prismaMock.listItems.findMany.mockResolvedValue([{ item_iid: 103 }]);

    const res = await sourcePOST(request({ source: 'list', listId: 77 }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(prismaMock.listItems.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { list_id: 77, isHidden: false },
      })
    );
    expect(body.items).toHaveLength(1);
  });

  test('loads source items from bulk text with ids and names', async () => {
    const res = await sourcePOST(
      request({
        source: 'bulk',
        text: '101, 102\nGamma',
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(getManyItemsMock).toHaveBeenCalledWith({ id: ['101', '102'] });
    expect(getManyItemsMock).toHaveBeenCalledWith({ name: ['Gamma'] });
    expect(body.items).toHaveLength(3);
    expect(body.notFound).toEqual([]);
  });

  test('returns not found identifiers from bulk text', async () => {
    const res = await sourcePOST(
      request({
        source: 'bulk',
        text: '101, Missing Item\n999',
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.items).toHaveLength(1);
    expect(body.items[0].internal_id).toBe(101);
    expect(body.notFound).toEqual(['Missing Item', '999']);
  });

  test('loads drop source items from the calculated drops route rules with optional prize pool', async () => {
    const res = await sourcePOST(
      request({ source: 'drops', parentItemId: 999, prizePool: 'normal-1-1' })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(getItemDropsMock).toHaveBeenCalledWith(999);
    expect(body.items).toHaveLength(2);
    expect(body.items.map((loadedItem: any) => loadedItem.internal_id)).toEqual([101, 102]);
  });

  test('preloads calculated drop pools with item counts', async () => {
    const res = await sourcePOST(request({ source: 'dropPools', parentItemId: 999 }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(getItemDropsMock).toHaveBeenCalledWith(999);
    expect(body.pools).toEqual([
      expect.objectContaining({ name: 'le', itemCount: 1 }),
      expect.objectContaining({ name: 'normal-1-1', itemCount: 2 }),
    ]);
  });

  test('previews first price after start date and skipped rows', async () => {
    prismaMock.$queryRaw.mockResolvedValue([
      price(2, 101, '2024-02-01T00:00:00.000Z', 'old context'),
    ]);

    const res = await previewPOST(request({ itemIds: [101, 102], startDate: '2024-01-01' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(prismaMock.$queryRaw).toHaveBeenCalledOnce();
    expect(body.targets).toBe(1);
    expect(body.rows[0].price.internal_id).toBe(2);
    expect(body.rows[0].price.priceContext).toBe('old context');
    expect(body.rows[1].skippedReason).toBe('no-price-after-start-date');
  });

  test('previews only inflation alert prices when requested', async () => {
    prismaMock.$queryRaw.mockResolvedValue([price(5, 101, '2024-03-01T00:00:00.000Z', null, 4)]);

    const res = await previewPOST(
      request({ itemIds: [101, 102], startDate: '2024-01-01', onlyInflationAlerts: true })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(prismaMock.$queryRaw).toHaveBeenCalledOnce();
    expect(body.rows[0].price.inflated).toBe(true);
    expect(body.rows[1].skippedReason).toBe('no-inflation-price-after-start-date');
  });

  test('applies context after recomputing target prices', async () => {
    prismaMock.$queryRaw.mockResolvedValue([
      price(10, 101, '2024-02-01T00:00:00.000Z'),
      price(11, 102, '2024-02-02T00:00:00.000Z'),
    ]);
    prismaMock.itemPrices.updateMany.mockResolvedValue({ count: 2 });

    const res = await applyPOST(
      request({
        itemIds: [101, 102],
        startDate: '2024-01-01',
        priceContext: 'Added to prize pool',
        onlyInflationAlerts: true,
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(prismaMock.itemPrices.updateMany).toHaveBeenCalledWith({
      where: { internal_id: { in: [10, 11] } },
      data: { priceContext: 'Added to prize pool' },
    });
    expect(prismaMock.$queryRaw).toHaveBeenCalledOnce();
    expect(body.updated).toBe(2);
    expect(body.skipped).toBe(0);
    expect(body.operation).toBe('set');
    expect(createLogMock).toHaveBeenCalledWith(
      'bulkPriceContextApply',
      expect.objectContaining({
        itemIds: [101, 102],
        priceIds: [10, 11],
        startDate: '2024-01-01',
        operation: 'set',
        priceContext: 'Added to prize pool',
        onlyInflationAlerts: true,
        updated: 2,
        skipped: 0,
        skippedItems: [],
      }),
      undefined,
      'admin-user'
    );
  });

  test('clears context after recomputing target prices', async () => {
    prismaMock.$queryRaw.mockResolvedValue([
      price(20, 101, '2024-02-01T00:00:00.000Z', 'old context'),
      price(21, 102, '2024-02-02T00:00:00.000Z', 'another context'),
    ]);
    prismaMock.itemPrices.updateMany.mockResolvedValue({ count: 2 });

    const res = await applyPOST(
      request({
        itemIds: [101, 102],
        startDate: '2024-01-01',
        operation: 'clear',
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(prismaMock.itemPrices.updateMany).toHaveBeenCalledWith({
      where: { internal_id: { in: [20, 21] } },
      data: { priceContext: null },
    });
    expect(body.updated).toBe(2);
    expect(body.skipped).toBe(0);
    expect(body.operation).toBe('clear');
    expect(createLogMock).toHaveBeenCalledWith(
      'bulkPriceContextClear',
      expect.objectContaining({
        itemIds: [101, 102],
        priceIds: [20, 21],
        startDate: '2024-01-01',
        operation: 'clear',
        priceContext: null,
        onlyInflationAlerts: false,
        updated: 2,
        skipped: 0,
        skippedItems: [],
      }),
      undefined,
      'admin-user'
    );
  });
});

describe('parseBulkItemIdentifiers', () => {
  test('splits comma and newline separated values', () => {
    expect(parseBulkItemIdentifiers('101, 102\n103')).toEqual(['101', '102', '103']);
  });

  test('deduplicates and trims tokens', () => {
    expect(parseBulkItemIdentifiers(' 101 ,101\nAlpha , Alpha ')).toEqual(['101', 'Alpha']);
  });
});
