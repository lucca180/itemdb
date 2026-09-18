import { beforeEach, describe, expect, test, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  itemProcess: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  items: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
  },
}));

const detectWearableMock = vi.hoisted(() => vi.fn());

vi.mock('@utils/prisma', () => ({
  default: prismaMock,
}));

vi.mock('@utils/item/detectWearable', () => ({
  detectWearable: detectWearableMock,
}));

import type { ItemProcess } from '@prisma/generated/client';
import { updateOrAddDB, type ProcessContext } from '@utils/item/processItemQueue';

const itemProcess = (overrides: Partial<ItemProcess> = {}): ItemProcess =>
  ({
    internal_id: 1,
    item_id: null,
    name: 'Item',
    description: null,
    image: 'https://images.neopets.com/items/item.gif',
    image_id: 'item_image',
    category: null,
    rarity: null,
    weight: null,
    isNC: false,
    isBD: false,
    type: 'np',
    est_val: null,
    specialType: null,
    status: null,
    releaseDate: null,
    retiredDate: null,
    isWearable: false,
    addedAt: new Date(),
    updatedAt: new Date(),
    ip_address: null,
    language: 'en',
    hash: null,
    manual_check: null,
    processed: false,
    meta: null,
    ...overrides,
  }) as ItemProcess;

const newCtx = (): ProcessContext => ({ usedSlugs: new Set(), manualChecks: [] });

// Distinguish the two `items.findMany` calls (dbItemList vs dbSlugItems) by their where shape.
function mockFindMany(dbItemList: unknown[], dbSlugItems: unknown[] = []) {
  prismaMock.items.findMany.mockImplementation(
    async ({ where }: { where: Record<string, unknown> }) => {
      if ('slug' in where) return dbSlugItems;
      return dbItemList;
    }
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.itemProcess.findFirst.mockResolvedValue(null); // no pre-existing manual_check
  detectWearableMock.mockResolvedValue(false);
  mockFindMany([]);
});

describe('updateOrAddDB dedup guard', () => {
  test('rename pattern (image matches, name differs, item_id absent) → name conflict, no create', async () => {
    prismaMock.items.findFirst.mockResolvedValueOnce({ internal_id: 999 }); // renameGuard hit

    const result = await updateOrAddDB(
      itemProcess({ name: 'Fluttering Faerie Skeith', image_id: 'nostalgic_faerie_skeith' }),
      newCtx()
    );

    expect(result).toBeUndefined();
    expect(prismaMock.items.findFirst).toHaveBeenCalledTimes(1);
    expect(prismaMock.itemProcess.update).toHaveBeenCalledWith({
      data: { manual_check: "'name' Merge Conflict with (999)" },
      where: { internal_id: 1 },
    });
  });

  test('re-art pattern (name matches, image differs, item_id absent) → image conflict, no create', async () => {
    prismaMock.items.findFirst
      .mockResolvedValueOnce(null) // renameGuard miss
      .mockResolvedValueOnce({ internal_id: 888 }); // reArtGuard hit

    const result = await updateOrAddDB(
      itemProcess({ name: 'Existing Name', image_id: 'new_redesigned_art' }),
      newCtx()
    );

    expect(result).toBeUndefined();
    expect(prismaMock.items.findFirst).toHaveBeenCalledTimes(2);
    expect(prismaMock.itemProcess.update).toHaveBeenCalledWith({
      data: { manual_check: "'image' Merge Conflict with (888)" },
      where: { internal_id: 1 },
    });
  });

  test('regression: name+image match an existing row but item_id differs → still creates, no guard query', async () => {
    mockFindMany([{ internal_id: 42, item_id: 111, name: 'Same Name', image_id: 'same_img' }]);

    const result = await updateOrAddDB(
      itemProcess({ item_id: 555, name: 'Same Name', image_id: 'same_img' }),
      newCtx()
    );

    expect(result).toBeDefined();
    expect(result?.item_id).toBe(555);
    expect(prismaMock.items.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.itemProcess.update).not.toHaveBeenCalled();
  });

  test('regression: genuinely new item (no signal matches anything) → still creates', async () => {
    prismaMock.items.findFirst.mockResolvedValue(null); // both guards miss

    const result = await updateOrAddDB(
      itemProcess({ name: 'Totally New Item', image_id: 'brand_new_image' }),
      newCtx()
    );

    expect(result).toBeDefined();
    expect(result?.name).toBe('Totally New Item');
    expect(prismaMock.items.findFirst).toHaveBeenCalledTimes(2);
    expect(prismaMock.itemProcess.update).not.toHaveBeenCalled();
  });

  test('guard queries only match "established" rows (item_id not null)', async () => {
    prismaMock.items.findFirst.mockResolvedValue(null);

    await updateOrAddDB(itemProcess({ name: 'X', image_id: 'y' }), newCtx());

    const [renameCall, reArtCall] = prismaMock.items.findFirst.mock.calls;
    expect(renameCall[0].where.item_id).toEqual({ not: null });
    expect(reArtCall[0].where.item_id).toEqual({ not: null });
  });
});
