import { beforeEach, describe, expect, test, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  itemPrices: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  dataCollecting: {
    count: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn(),
    updateMany: vi.fn(),
  },
}));

const getManyItemsMock = vi.hoisted(() => vi.fn());
const createLogMock = vi.hoisted(() => vi.fn());
const revalidateTagMock = vi.hoisted(() => vi.fn());
const getServerCurrentUserMock = vi.hoisted(() => vi.fn());
const hookSendMock = vi.hoisted(() => vi.fn());

vi.mock('server-only', () => ({}));

vi.mock('next/cache', () => ({
  revalidateTag: revalidateTagMock,
}));

vi.mock('@utils/prisma', () => ({
  default: prismaMock,
}));

vi.mock('@services/ItemService', () => ({
  ItemService: { getManyItems: getManyItemsMock },
}));

vi.mock('@services/ActionLogService', () => ({
  LogService: { createLog: createLogMock },
}));

vi.mock('@utils/auth/getServerCurrentUser', () => ({
  getServerCurrentUser: getServerCurrentUserMock,
}));

// never hit the real Discord webhook from tests (.env is loaded by vitest setup)
vi.mock('@tycrek/discord-hookr', () => {
  class Webhook {
    addEmbed() {}
    send = hookSendMock;
  }
  class EmbedBuilder {
    setAuthor() {
      return this;
    }
    setTitle() {
      return this;
    }
    setURL() {
      return this;
    }
    setThumbnail() {
      return this;
    }
    setDescription() {
      return this;
    }
    addField() {
      return this;
    }
  }
  return { Webhook, EmbedBuilder };
});

import {
  listPendingPriceContextSuggestions,
  PriceContextSuggestionError,
  resolvePriceContextSuggestions,
  submitPriceContextSuggestion,
} from '@services/PriceContextSuggestionService';
import {
  MAX_PRICE_CONTEXT_SUGGESTION_LENGTH,
  MAX_PRICE_CONTEXT_SUGGESTIONS_PER_DAY,
  PRICE_CONTEXT_SUGGESTION_TYPE,
} from '@utils/prices/priceContextSuggestionConstants';
import { POST as resolvePOST } from '@app/api/admin/price-context/suggestions/route';
import type { User } from '@types';

const user = (overrides: Partial<User> = {}) =>
  ({
    id: 'user-1',
    username: 'tester',
    isAdmin: false,
    banned: false,
    xp: 100,
    ...overrides,
  }) as User;

const decimal = (value: number) => ({ toNumber: () => value });

const priceRow = (overrides: Record<string, unknown> = {}) => ({
  internal_id: 50,
  item_iid: 9,
  price: decimal(1000),
  addedAt: new Date('2026-11-01T00:00:00Z'),
  priceContext: null,
  manual_check: null,
  noInflation_id: null,
  ...overrides,
});

const expectCode = async (promise: Promise<unknown>, code: string) => {
  await expect(promise).rejects.toBeInstanceOf(PriceContextSuggestionError);
  await expect(promise).rejects.toMatchObject({ code });
};

beforeEach(() => {
  vi.clearAllMocks();
  hookSendMock.mockResolvedValue(undefined);
  prismaMock.itemPrices.findUnique.mockResolvedValue(priceRow());
  prismaMock.itemPrices.findMany.mockResolvedValue([]);
  prismaMock.itemPrices.update.mockResolvedValue(priceRow());
  prismaMock.dataCollecting.count.mockResolvedValue(0);
  prismaMock.dataCollecting.create.mockResolvedValue({});
  prismaMock.dataCollecting.findMany.mockResolvedValue([]);
  prismaMock.dataCollecting.updateMany.mockResolvedValue({ count: 0 });
  getManyItemsMock.mockImplementation(async ({ data }: { data: string[] }) =>
    Object.fromEntries(data.map((iid) => [iid, { internal_id: Number(iid), name: `Item ${iid}` }]))
  );
});

describe('submitPriceContextSuggestion', () => {
  test('stores the trimmed context for the price entry', async () => {
    await expect(
      submitPriceContextSuggestion({
        priceId: 50,
        context: '  Restocked in a new shop  ',
        user: user(),
        ip: '1.2.3.4',
      })
    ).resolves.toEqual({ success: true });

    expect(prismaMock.dataCollecting.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: PRICE_CONTEXT_SUGGESTION_TYPE,
        item_iid: 9,
        subject_id: 50,
        note: 'Restocked in a new shop',
        user_id: 'user-1',
        ip_address: '1.2.3.4',
      }),
    });
  });

  test('rejects banned users', async () => {
    await expectCode(
      submitPriceContextSuggestion({ priceId: 50, context: 'x', user: user({ banned: true }) }),
      'forbidden'
    );
  });

  test('validates the context text', async () => {
    await expectCode(
      submitPriceContextSuggestion({ priceId: 50, context: '   ', user: null, ip: '1.2.3.4' }),
      'empty-context'
    );
    await expectCode(
      submitPriceContextSuggestion({
        priceId: 50,
        context: 'a'.repeat(MAX_PRICE_CONTEXT_SUGGESTION_LENGTH + 1),
        user: null,
        ip: '1.2.3.4',
      }),
      'context-too-long'
    );
  });

  test('rejects missing and unconfirmed prices', async () => {
    await expectCode(
      submitPriceContextSuggestion({ priceId: 'abc', context: 'x', user: null }),
      'invalid-price'
    );

    prismaMock.itemPrices.findUnique.mockResolvedValueOnce(null);
    await expectCode(
      submitPriceContextSuggestion({ priceId: 50, context: 'x', user: null }),
      'invalid-price'
    );

    prismaMock.itemPrices.findUnique.mockResolvedValueOnce(priceRow({ manual_check: 'pending' }));
    await expectCode(
      submitPriceContextSuggestion({ priceId: 50, context: 'x', user: null }),
      'invalid-price'
    );
  });

  test('accepts corrections but not the current context', async () => {
    prismaMock.itemPrices.findUnique.mockResolvedValue(priceRow({ priceContext: 'Old context' }));

    await expectCode(
      submitPriceContextSuggestion({ priceId: 50, context: ' Old context ', user: user() }),
      'same-as-current'
    );
    await expect(
      submitPriceContextSuggestion({ priceId: 50, context: 'Better context', user: user() })
    ).resolves.toEqual({ success: true });
  });

  test('dedupes pending suggestions by ip for logged-out users', async () => {
    prismaMock.dataCollecting.count.mockResolvedValueOnce(1).mockResolvedValueOnce(0);

    await expectCode(
      submitPriceContextSuggestion({ priceId: 50, context: 'x', user: null, ip: '1.2.3.4' }),
      'already-suggested'
    );

    expect(prismaMock.dataCollecting.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        subject_id: 50,
        processed: false,
        user_id: null,
        ip_address: '1.2.3.4',
      }),
    });
    expect(prismaMock.dataCollecting.create).not.toHaveBeenCalled();
  });

  test('rate limits by ip per day', async () => {
    prismaMock.dataCollecting.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(MAX_PRICE_CONTEXT_SUGGESTIONS_PER_DAY);

    await expectCode(
      submitPriceContextSuggestion({ priceId: 50, context: 'x', user: user(), ip: '1.2.3.4' }),
      'too-many-requests'
    );
  });
});

describe('listPendingPriceContextSuggestions', () => {
  test('groups by price and drops deleted/unconfirmed prices', async () => {
    prismaMock.dataCollecting.findMany.mockResolvedValue([
      {
        subject_id: 50,
        note: 'Newest',
        addedAt: new Date('2026-11-10T00:00:00Z'),
        user: { username: 'a' },
      },
      {
        subject_id: 99,
        note: 'Deleted price',
        addedAt: new Date('2026-11-09T00:00:00Z'),
        user: null,
      },
      { subject_id: 50, note: 'Older', addedAt: new Date('2026-11-08T00:00:00Z'), user: null },
    ]);
    prismaMock.itemPrices.findMany.mockResolvedValue([
      priceRow({ priceContext: 'Current', noInflation_id: 3 }),
    ]);

    const groups = await listPendingPriceContextSuggestions();

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      item_iid: 9,
      price: { price_id: 50, value: 1000, inflated: true, context: 'Current' },
      requests: [
        { username: 'a', context: 'Newest' },
        { username: null, context: 'Older' },
      ],
      lastAt: '2026-11-10T00:00:00.000Z',
    });
    expect(prismaMock.itemPrices.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ internal_id: { in: [50, 99] }, manual_check: null }),
      })
    );
  });
});

describe('resolvePriceContextSuggestions', () => {
  const admin = user({ id: 'admin-1', isAdmin: true });

  test('approve writes the context and resolves every pending suggestion', async () => {
    prismaMock.dataCollecting.updateMany.mockResolvedValue({ count: 2 });

    await expect(
      resolvePriceContextSuggestions({
        priceId: 50,
        action: 'approve',
        context: ' Edited by admin ',
        admin,
      })
    ).resolves.toEqual({ success: true, resolved: 2 });

    expect(prismaMock.itemPrices.update).toHaveBeenCalledWith({
      where: { internal_id: 50 },
      data: { priceContext: 'Edited by admin' },
    });
    expect(prismaMock.dataCollecting.updateMany).toHaveBeenCalledWith({
      where: { type: PRICE_CONTEXT_SUGGESTION_TYPE, subject_id: 50, processed: false },
      data: expect.objectContaining({ processed: true, approved: true }),
    });
    expect(revalidateTagMock).toHaveBeenCalled();
    expect(createLogMock).toHaveBeenCalledWith(
      'priceContextSuggestion',
      { action: 'approve', priceId: 50 },
      '9',
      'admin-1'
    );
  });

  test('reject only marks suggestions as processed', async () => {
    await resolvePriceContextSuggestions({ priceId: 50, action: 'reject', admin });

    expect(prismaMock.itemPrices.update).not.toHaveBeenCalled();
    expect(prismaMock.dataCollecting.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ approved: false }) })
    );
  });

  test('validates action, price and approved context', async () => {
    await expectCode(
      resolvePriceContextSuggestions({ priceId: 50, action: 'delete', admin }),
      'invalid-action'
    );
    await expectCode(
      resolvePriceContextSuggestions({ priceId: 0, action: 'reject', admin }),
      'invalid-price'
    );
    await expectCode(
      resolvePriceContextSuggestions({ priceId: 50, action: 'approve', context: ' ', admin }),
      'empty-context'
    );

    prismaMock.itemPrices.findUnique.mockResolvedValueOnce(null);
    await expectCode(
      resolvePriceContextSuggestions({ priceId: 50, action: 'reject', admin }),
      'invalid-price'
    );
  });
});

describe('POST /api/admin/price-context/suggestions', () => {
  const request = (body: unknown) =>
    new Request('http://localhost/api/admin/price-context/suggestions', {
      method: 'POST',
      body: JSON.stringify(body),
    });

  test('returns 401 for non-admins', async () => {
    getServerCurrentUserMock.mockResolvedValue({ user: user() });

    const res = await resolvePOST(request({ priceId: 50, action: 'reject' }));
    expect(res.status).toBe(401);
  });

  test('returns 400 for an invalid action', async () => {
    getServerCurrentUserMock.mockResolvedValue({ user: user({ isAdmin: true }) });

    const res = await resolvePOST(request({ priceId: 50, action: 'delete' }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid-action' });
  });

  test('resolves suggestions for admins', async () => {
    getServerCurrentUserMock.mockResolvedValue({ user: user({ isAdmin: true }) });
    prismaMock.dataCollecting.updateMany.mockResolvedValue({ count: 1 });

    const res = await resolvePOST(request({ priceId: 50, action: 'reject' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, resolved: 1 });
  });
});
