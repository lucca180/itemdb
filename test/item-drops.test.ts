import { beforeEach, describe, expect, test, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  $queryRaw: vi.fn(),
  items: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  openableItems: {
    findMany: vi.fn(),
  },
  wearableData: {
    findMany: vi.fn(),
  },
}));

const getManyItemsMock = vi.hoisted(() => vi.fn());

vi.mock('@utils/prisma', () => ({
  default: prismaMock,
}));

vi.mock('@utils/redis', () => ({
  redis_setDataCount: vi.fn(),
}));

vi.mock('@utils/googleCloud', () => ({
  CheckAuth: vi.fn(),
}));

vi.mock('@utils/revalidateItem', () => ({
  ItemRevalidateTags: {
    drops: vi.fn(),
  },
  revalidateItem: vi.fn(),
}));

vi.mock('@pages/api/v1/items/many', () => ({
  getManyItems: getManyItemsMock,
}));

import { getItemDrops, getItemParent } from '@pages/api/v1/items/[id_name]/drops';
import {
  AUTHORITATIVE_OPENING_IDS,
  NC_DROP_SUPPORT,
  NP_DROP_SUPPORT_RULES,
} from '@utils/itemDropEvidence';

const PARENT_ITEM_ID = 10;
const INVERSE_PARENT_ITEM_ID = 20;
const ACCEPTED_DROP_ID = 101;
const REJECTED_DROP_ID = 102;
const NP_NEUTRAL_SUPPORT = NP_DROP_SUPPORT_RULES.neutral.minimum;

const item = (isNC: boolean) => ({
  internal_id: PARENT_ITEM_ID,
  name: 'Test Container',
  flags: null,
  isNC,
  canOpen: 'true',
  canPlay: 'unknown',
  canEat: 'unknown',
  canRead: 'unknown',
});

const drop = (
  opening_id: string,
  item_iid: number,
  overrides: Partial<{
    notes: string | null;
    prizePool: string | null;
    limitedEdition: boolean;
    isManual: boolean;
  }> = {}
) => ({
  internal_id: Math.random(),
  parent_iid: PARENT_ITEM_ID,
  opening_id,
  item_iid,
  ip_address: null,
  addedAt: new Date(),
  notes: overrides.notes ?? null,
  prizePool: overrides.prizePool ?? null,
  limitedEdition: overrides.limitedEdition ?? false,
  isManual: overrides.isManual ?? false,
});

const communityDrops = (count: number, itemId: number, prefix = 'opening') =>
  Array.from({ length: count }, (_, index) => drop(`${prefix}-${index + 1}`, itemId));

describe('getItemDrops statistical filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.wearableData.findMany.mockResolvedValue([]);
    getManyItemsMock.mockResolvedValue({});
  });

  test('filters rejected community candidates before building pools and odds', async () => {
    prismaMock.items.findFirst.mockResolvedValue(item(false));
    prismaMock.openableItems.findMany.mockResolvedValue([
      ...communityDrops(NP_NEUTRAL_SUPPORT, ACCEPTED_DROP_ID),
      drop('other-opening', REJECTED_DROP_ID),
    ]);

    const result = await getItemDrops(PARENT_ITEM_ID);

    expect(Object.keys(result?.drops ?? {})).toEqual([String(ACCEPTED_DROP_ID)]);
    expect(result?.pools.unknown.items).toEqual([ACCEPTED_DROP_ID]);
  });

  test('uses the configured NC support in the endpoint calculation', async () => {
    prismaMock.items.findFirst.mockResolvedValue(item(true));
    prismaMock.openableItems.findMany.mockResolvedValue(
      communityDrops(Math.max(0, NC_DROP_SUPPORT - 1), ACCEPTED_DROP_ID)
    );

    expect(await getItemDrops(PARENT_ITEM_ID)).toBeNull();

    prismaMock.openableItems.findMany.mockResolvedValue(
      communityDrops(NC_DROP_SUPPORT, ACCEPTED_DROP_ID)
    );

    expect(Object.keys((await getItemDrops(PARENT_ITEM_ID))?.drops ?? {})).toEqual([
      String(ACCEPTED_DROP_ID),
    ]);
  });

  test('keeps authoritative drops without releasing unrelated candidates', async () => {
    prismaMock.items.findFirst.mockResolvedValue(item(false));
    prismaMock.openableItems.findMany.mockResolvedValue([
      drop(AUTHORITATIVE_OPENING_IDS[0], ACCEPTED_DROP_ID, {
        prizePool: 'normal',
        isManual: true,
      }),
      drop('opening-1', REJECTED_DROP_ID),
    ]);

    const result = await getItemDrops(PARENT_ITEM_ID);

    expect(Object.keys(result?.drops ?? {})).toEqual([String(ACCEPTED_DROP_ID)]);
    expect(result?.drops[REJECTED_DROP_ID]).toBeUndefined();
  });

  test('uses the same statistical acceptance for inverse parent results', async () => {
    prismaMock.$queryRaw.mockResolvedValue(
      communityDrops(NP_NEUTRAL_SUPPORT, ACCEPTED_DROP_ID).map((row) => ({
        ...row,
        parent_iid: INVERSE_PARENT_ITEM_ID,
        parent_flags: null,
        parent_name: 'Parent Container',
      }))
    );
    prismaMock.items.findMany.mockResolvedValue([
      {
        ...item(false),
        internal_id: INVERSE_PARENT_ITEM_ID,
        name: 'Parent Container',
      },
    ]);
    prismaMock.openableItems.findMany.mockResolvedValue([
      ...communityDrops(NP_NEUTRAL_SUPPORT, ACCEPTED_DROP_ID).map((row) => ({
        ...row,
        parent_iid: INVERSE_PARENT_ITEM_ID,
      })),
      { ...drop('other-opening', REJECTED_DROP_ID), parent_iid: INVERSE_PARENT_ITEM_ID },
    ]);
    getManyItemsMock.mockResolvedValue({
      [INVERSE_PARENT_ITEM_ID]: {
        internal_id: INVERSE_PARENT_ITEM_ID,
        item_id: INVERSE_PARENT_ITEM_ID,
      },
    });

    const result = await getItemParent(101);

    expect(result.parents_iid).toEqual([INVERSE_PARENT_ITEM_ID]);
    expect(result.itemData).toEqual([
      {
        internal_id: INVERSE_PARENT_ITEM_ID,
        item_id: INVERSE_PARENT_ITEM_ID,
      },
    ]);
  });
});
