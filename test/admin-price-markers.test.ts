import { beforeEach, describe, expect, test, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  manualPriceMarker: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  manualPriceMarkerItem: {
    createMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  items: {
    findMany: vi.fn(),
  },
  $transaction: vi.fn(),
}));

const getServerCurrentUserMock = vi.hoisted(() => vi.fn());
const createLogMock = vi.hoisted(() => vi.fn());
const revalidateTagMock = vi.hoisted(() => vi.fn());

vi.mock('server-only', () => ({}));

vi.mock('next/cache', () => ({
  revalidateTag: revalidateTagMock,
}));

vi.mock('@utils/prisma', () => ({
  default: prismaMock,
}));

vi.mock('@utils/auth/getServerCurrentUser', () => ({
  getServerCurrentUser: getServerCurrentUserMock,
}));

vi.mock('@services/ActionLogService', () => ({
  LogService: {
    createLog: createLogMock,
  },
}));

import { GET as listGET } from '@app/api/admin/price-markers/route';
import { POST as createPOST } from '@app/api/admin/price-markers/create/route';
import {
  PATCH as patchPATCH,
  DELETE as deleteDELETE,
} from '@app/api/admin/price-markers/[id]/route';

const markerRow = (overrides: Record<string, unknown> = {}) => ({
  internal_id: 10,
  badgeText: 'Released',
  title: 'Grand Event',
  description: null,
  color: '#123456',
  startAt: new Date('2024-03-01T00:00:00.000Z'),
  endAt: null,
  isPoint: false,
  createdBy: 'admin-1',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  items: [
    { item: { internal_id: 101, name: 'Item 101', image: 'https://img/101.gif' } },
    { item: { internal_id: 102, name: 'Item 102', image: 'https://img/102.gif' } },
  ],
  ...overrides,
});

const jsonRequest = (body: unknown, method = 'POST') =>
  new Request('http://localhost/api/admin/price-markers', {
    method,
    body: JSON.stringify(body),
  });

const idContext = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.clearAllMocks();
  getServerCurrentUserMock.mockResolvedValue({ user: { id: 'admin-1', isAdmin: true } });
  prismaMock.$transaction.mockImplementation(async (fn: (tx: typeof prismaMock) => unknown) =>
    fn(prismaMock)
  );
  prismaMock.items.findMany.mockImplementation(
    async ({ where }: { where: { internal_id: { in: number[] } } }) =>
      where.internal_id.in.map((internal_id) => ({ internal_id }))
  );
});

describe('price-markers auth', () => {
  test('rejects non-admins on GET', async () => {
    getServerCurrentUserMock.mockResolvedValue({ user: { id: 'u', isAdmin: false } });
    const res = await listGET();
    expect(res.status).toBe(401);
  });

  test('rejects non-admins on create', async () => {
    getServerCurrentUserMock.mockResolvedValue({ user: null });
    const res = await createPOST(jsonRequest({}));
    expect(res.status).toBe(401);
  });
});

describe('create manual marker', () => {
  test('creates a marker and logs the action', async () => {
    prismaMock.manualPriceMarker.create.mockResolvedValue({ internal_id: 10 });
    prismaMock.manualPriceMarkerItem.createMany.mockResolvedValue({ count: 2 });
    prismaMock.manualPriceMarker.findUniqueOrThrow.mockResolvedValue(markerRow());

    const res = await createPOST(
      jsonRequest({
        title: 'Grand Event',
        badgeText: 'Released',
        color: '#123456',
        startAt: '2024-03-01',
        isPoint: false,
        itemIds: [101, 102],
      })
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.marker.internal_id).toBe(10);
    expect(data.affectedItemIds).toEqual([101, 102]);
    expect(prismaMock.manualPriceMarker.create).toHaveBeenCalledOnce();
    expect(createLogMock).toHaveBeenCalledWith(
      'manualPriceMarkerCreate',
      expect.objectContaining({ markerId: 10, itemIds: [101, 102] }),
      '10',
      'admin-1'
    );
    // markers + root tag per affected item
    expect(revalidateTagMock).toHaveBeenCalledWith('item-101-markers', 'max');
    expect(revalidateTagMock).toHaveBeenCalledWith('item-102-markers', 'max');
  });

  test('rejects when badgeText is empty and title/description are missing', async () => {
    const res = await createPOST(
      jsonRequest({
        title: null,
        badgeText: '',
        description: null,
        color: '#123456',
        startAt: '2024-03-01',
        itemIds: [1],
      })
    );
    expect(res.status).toBe(400);
    expect(prismaMock.manualPriceMarker.create).not.toHaveBeenCalled();
  });

  test('rejects auto badge (null) without title or description', async () => {
    const res = await createPOST(
      jsonRequest({
        title: null,
        badgeText: null,
        description: null,
        color: '#123456',
        startAt: '2024-03-01',
        itemIds: [1],
      })
    );

    expect(res.status).toBe(400);
    expect(prismaMock.manualPriceMarker.create).not.toHaveBeenCalled();
  });

  test('accepts auto badge when paired with a title', async () => {
    prismaMock.manualPriceMarker.create.mockResolvedValue({ internal_id: 12 });
    prismaMock.manualPriceMarkerItem.createMany.mockResolvedValue({ count: 1 });
    prismaMock.manualPriceMarker.findUniqueOrThrow.mockResolvedValue(
      markerRow({
        internal_id: 12,
        badgeText: null,
        title: 'Sale',
        description: null,
        items: [{ item: { internal_id: 1, name: 'Item 1', image: null } }],
      })
    );

    const res = await createPOST(
      jsonRequest({
        title: 'Sale',
        badgeText: null,
        description: null,
        color: '#123456',
        startAt: '2024-03-01',
        itemIds: [1],
      })
    );

    expect(res.status).toBe(200);
    expect(prismaMock.manualPriceMarker.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ badgeText: null, title: 'Sale' }),
      })
    );
  });

  test('persists empty string badgeText to hide the badge', async () => {
    prismaMock.manualPriceMarker.create.mockResolvedValue({ internal_id: 13 });
    prismaMock.manualPriceMarkerItem.createMany.mockResolvedValue({ count: 1 });
    prismaMock.manualPriceMarker.findUniqueOrThrow.mockResolvedValue(
      markerRow({
        internal_id: 13,
        badgeText: '',
        title: 'Only title',
        description: null,
        items: [{ item: { internal_id: 1, name: 'Item 1', image: null } }],
      })
    );

    const res = await createPOST(
      jsonRequest({
        title: 'Only title',
        badgeText: '',
        description: null,
        color: '#123456',
        startAt: '2024-03-01',
        itemIds: [1],
      })
    );

    expect(res.status).toBe(200);
    expect(prismaMock.manualPriceMarker.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ badgeText: '', title: 'Only title' }),
      })
    );
  });

  test('accepts a marker with only description', async () => {
    prismaMock.manualPriceMarker.create.mockResolvedValue({ internal_id: 11 });
    prismaMock.manualPriceMarkerItem.createMany.mockResolvedValue({ count: 1 });
    prismaMock.manualPriceMarker.findUniqueOrThrow.mockResolvedValue(
      markerRow({
        internal_id: 11,
        badgeText: null,
        title: null,
        description: 'Only notes',
        items: [{ item: { internal_id: 1, name: 'Item 1', image: null } }],
      })
    );

    const res = await createPOST(
      jsonRequest({
        title: null,
        badgeText: null,
        description: 'Only notes',
        color: '#123456',
        startAt: '2024-03-01',
        itemIds: [1],
      })
    );

    expect(res.status).toBe(200);
    expect(prismaMock.manualPriceMarker.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          badgeText: null,
          title: null,
          description: 'Only notes',
        }),
      })
    );
  });

  test('rejects missing startAt', async () => {
    const res = await createPOST(jsonRequest({ badgeText: 'x', color: '#ffffff', itemIds: [1] }));
    expect(res.status).toBe(400);
    expect(prismaMock.manualPriceMarker.create).not.toHaveBeenCalled();
  });

  test('rejects invalid color', async () => {
    const res = await createPOST(
      jsonRequest({
        title: 'T',
        badgeText: 'B',
        color: 'red',
        startAt: '2024-03-01',
        itemIds: [1],
      })
    );
    expect(res.status).toBe(400);
  });

  test('rejects empty item selection', async () => {
    const res = await createPOST(
      jsonRequest({ title: 'T', badgeText: 'B', color: '#fff', startAt: '2024-03-01', itemIds: [] })
    );
    expect(res.status).toBe(400);
  });

  test('drops endAt when the marker is a single point', async () => {
    prismaMock.manualPriceMarker.create.mockResolvedValue({ internal_id: 14 });
    prismaMock.manualPriceMarkerItem.createMany.mockResolvedValue({ count: 1 });
    prismaMock.manualPriceMarker.findUniqueOrThrow.mockResolvedValue(
      markerRow({ internal_id: 14, isPoint: true, endAt: null })
    );

    const res = await createPOST(
      jsonRequest({
        title: 'Event',
        color: '#123456',
        startAt: '2024-03-01',
        endAt: '2024-03-20',
        isPoint: true,
        itemIds: [1],
      })
    );

    expect(res.status).toBe(200);
    expect(prismaMock.manualPriceMarker.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isPoint: true, endAt: null }),
      })
    );
  });

  test('rejects endAt before startAt', async () => {
    const res = await createPOST(
      jsonRequest({
        title: 'T',
        badgeText: 'B',
        color: '#ffffff',
        startAt: '2024-03-10',
        endAt: '2024-03-01',
        itemIds: [1],
      })
    );
    expect(res.status).toBe(400);
  });
});

describe('update manual marker', () => {
  test('returns 404 when marker missing', async () => {
    prismaMock.manualPriceMarker.findUnique.mockResolvedValue(null);
    const res = await patchPATCH(jsonRequest({ title: 'x' }, 'PATCH'), idContext('10'));
    expect(res.status).toBe(404);
  });

  test('rejects clearing auto badge without another label', async () => {
    prismaMock.manualPriceMarker.findUnique.mockResolvedValue(
      markerRow({ badgeText: null, title: 'Sale', description: null })
    );
    const res = await patchPATCH(
      jsonRequest({ badgeText: '', title: null }, 'PATCH'),
      idContext('10')
    );
    expect(res.status).toBe(400);
    expect(prismaMock.manualPriceMarker.update).not.toHaveBeenCalled();
  });

  test('rejects patching endAt before the stored startAt', async () => {
    prismaMock.manualPriceMarker.findUnique.mockResolvedValue(
      markerRow({
        startAt: new Date('2024-03-10T18:00:00.000Z'),
        endAt: new Date('2024-03-20T18:00:00.000Z'),
      })
    );

    const res = await patchPATCH(jsonRequest({ endAt: '2024-03-01' }, 'PATCH'), idContext('10'));

    expect(res.status).toBe(400);
    expect(prismaMock.manualPriceMarker.update).not.toHaveBeenCalled();
  });

  test('coerces same-day ranges into a single point', async () => {
    prismaMock.manualPriceMarker.create.mockResolvedValue({ internal_id: 15 });
    prismaMock.manualPriceMarkerItem.createMany.mockResolvedValue({ count: 1 });
    prismaMock.manualPriceMarker.findUniqueOrThrow.mockResolvedValue(
      markerRow({ internal_id: 15, isPoint: true, endAt: null })
    );

    const res = await createPOST(
      jsonRequest({
        title: 'Same day',
        color: '#123456',
        startAt: '2024-03-10',
        endAt: '2024-03-10',
        isPoint: false,
        itemIds: [1],
      })
    );

    expect(res.status).toBe(200);
    expect(prismaMock.manualPriceMarker.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isPoint: true, endAt: null }),
      })
    );
  });

  test('normalizes date-only inputs to 18:00 UTC like list series dates', async () => {
    prismaMock.manualPriceMarker.create.mockResolvedValue({ internal_id: 16 });
    prismaMock.manualPriceMarkerItem.createMany.mockResolvedValue({ count: 1 });
    prismaMock.manualPriceMarker.findUniqueOrThrow.mockResolvedValue(
      markerRow({ internal_id: 16 })
    );

    const res = await createPOST(
      jsonRequest({
        title: 'Dated',
        color: '#123456',
        startAt: '2024-03-10',
        itemIds: [1],
      })
    );

    expect(res.status).toBe(200);
    expect(prismaMock.manualPriceMarker.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          startAt: new Date('2024-03-10T18:00:00.000Z'),
        }),
      })
    );
  });

  test('rejects unknown item IDs with 400', async () => {
    prismaMock.items.findMany.mockResolvedValue([{ internal_id: 1 }]);

    const res = await createPOST(
      jsonRequest({
        title: 'Missing items',
        color: '#123456',
        startAt: '2024-03-01',
        itemIds: [1, 999],
      })
    );

    expect(res.status).toBe(400);
    expect(prismaMock.manualPriceMarker.create).not.toHaveBeenCalled();
  });

  test('rejects clearing all label fields', async () => {
    prismaMock.manualPriceMarker.findUnique.mockResolvedValue(markerRow());
    const res = await patchPATCH(
      jsonRequest({ title: null, badgeText: '', description: null }, 'PATCH'),
      idContext('10')
    );
    expect(res.status).toBe(400);
    expect(prismaMock.manualPriceMarker.update).not.toHaveBeenCalled();
  });

  test('clears a stored endAt when switching to single point', async () => {
    prismaMock.manualPriceMarker.findUnique.mockResolvedValue(
      markerRow({ endAt: new Date('2024-04-01T00:00:00.000Z') })
    );
    prismaMock.manualPriceMarker.update.mockResolvedValue({ internal_id: 10 });
    prismaMock.manualPriceMarker.findUniqueOrThrow.mockResolvedValue(
      markerRow({ isPoint: true, endAt: null })
    );

    const res = await patchPATCH(jsonRequest({ isPoint: true }, 'PATCH'), idContext('10'));

    expect(res.status).toBe(200);
    expect(prismaMock.manualPriceMarker.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isPoint: true, endAt: null }),
      })
    );
  });

  test('diffs item associations and revalidates union of items', async () => {
    prismaMock.manualPriceMarker.findUnique.mockResolvedValue(
      markerRow({
        items: [
          { item: { internal_id: 101, name: 'Item 101', image: null } },
          { item: { internal_id: 102, name: 'Item 102', image: null } },
        ],
      })
    );
    prismaMock.manualPriceMarker.update.mockResolvedValue({ internal_id: 10 });
    prismaMock.manualPriceMarkerItem.deleteMany.mockResolvedValue({ count: 1 });
    prismaMock.manualPriceMarkerItem.createMany.mockResolvedValue({ count: 1 });
    prismaMock.manualPriceMarker.findUniqueOrThrow.mockResolvedValue(
      markerRow({ items: [{ item: { internal_id: 103, name: 'Item 103', image: null } }] })
    );

    const res = await patchPATCH(jsonRequest({ itemIds: [102, 103] }, 'PATCH'), idContext('10'));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(new Set(data.affectedItemIds)).toEqual(new Set([101, 102, 103]));
    expect(prismaMock.manualPriceMarkerItem.deleteMany).toHaveBeenCalledWith({
      where: { marker_id: 10, item_iid: { in: [101] } },
    });
    expect(prismaMock.manualPriceMarkerItem.createMany).toHaveBeenCalledWith({
      data: [{ marker_id: 10, item_iid: 103 }],
      skipDuplicates: true,
    });
  });
});

describe('delete manual marker', () => {
  test('hard deletes and logs affected items', async () => {
    prismaMock.manualPriceMarker.findUnique.mockResolvedValue(markerRow());
    prismaMock.manualPriceMarker.delete.mockResolvedValue(markerRow());

    const res = await deleteDELETE(jsonRequest({}, 'DELETE'), idContext('10'));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.affectedItemIds).toEqual([101, 102]);
    expect(prismaMock.manualPriceMarker.delete).toHaveBeenCalledWith({
      where: { internal_id: 10 },
    });
    expect(createLogMock).toHaveBeenCalledWith(
      'manualPriceMarkerDelete',
      expect.objectContaining({ markerId: 10, itemIds: [101, 102] }),
      '10',
      'admin-1'
    );
  });

  test('returns 404 when deleting a missing marker', async () => {
    prismaMock.manualPriceMarker.findUnique.mockResolvedValue(null);
    const res = await deleteDELETE(jsonRequest({}, 'DELETE'), idContext('999'));
    expect(res.status).toBe(404);
  });
});
