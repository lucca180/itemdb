import { beforeEach, describe, expect, test, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  userList: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  listItems: {
    findMany: vi.fn(),
  },
  dataCollecting: {
    findMany: vi.fn(),
    createMany: vi.fn(),
    updateMany: vi.fn(),
  },
}));

const getManyItemsMock = vi.hoisted(() => vi.fn());
const upsertItemsMock = vi.hoisted(() => vi.fn());
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

vi.mock('@services/ListService', () => ({
  ListService: { upsertItems: upsertItemsMock },
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
  listPendingSuggestions,
  resolveSuggestions,
  submitListSuggestion,
  SuggestionInputError,
} from '@services/ListSuggestionService';
import { LIST_SUGGESTION_TYPE } from '@utils/list/listSuggestionsConstants';
import { POST as resolvePOST } from '@app/api/admin/list-suggestions/route';
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

const officialList = (overrides: Record<string, unknown> = {}) => ({
  internal_id: 7,
  name: 'Official List',
  slug: 'official-list',
  official: true,
  dynamicType: null,
  ...overrides,
});

const itemsMap = (iids: number[]) =>
  Object.fromEntries(iids.map((iid) => [iid, { internal_id: iid, name: `Item ${iid}` }]));

const expectCode = async (promise: Promise<unknown>, code: string) => {
  await expect(promise).rejects.toBeInstanceOf(SuggestionInputError);
  await expect(promise).rejects.toMatchObject({ code });
};

beforeEach(() => {
  vi.clearAllMocks();
  hookSendMock.mockResolvedValue(undefined);
  prismaMock.userList.findUnique.mockResolvedValue(officialList());
  prismaMock.listItems.findMany.mockResolvedValue([]);
  prismaMock.dataCollecting.findMany.mockResolvedValue([]);
  prismaMock.dataCollecting.createMany.mockResolvedValue({ count: 0 });
  prismaMock.dataCollecting.updateMany.mockResolvedValue({ count: 0 });
  getManyItemsMock.mockImplementation(async ({ data }: { data: string[] }) =>
    itemsMap(data.map(Number))
  );
});

describe('submitListSuggestion', () => {
  test('requires a logged in, non-banned user', async () => {
    await expectCode(
      submitListSuggestion({ listId: 7, itemIids: [1], user: null }),
      'unauthorized'
    );
    await expectCode(
      submitListSuggestion({ listId: 7, itemIids: [1], user: user({ banned: true }) }),
      'forbidden'
    );
    await expectCode(
      submitListSuggestion({ listId: 7, itemIids: [1], user: user({ xp: -300 }) }),
      'forbidden'
    );
  });

  test('rejects non-official and dynamic lists', async () => {
    prismaMock.userList.findUnique.mockResolvedValueOnce(officialList({ official: false }));
    await expectCode(
      submitListSuggestion({ listId: 7, itemIids: [1], user: user() }),
      'invalid-list'
    );

    prismaMock.userList.findUnique.mockResolvedValueOnce(officialList({ dynamicType: 'addOnly' }));
    await expectCode(
      submitListSuggestion({ listId: 7, itemIids: [1], user: user() }),
      'invalid-list'
    );

    expect(prismaMock.dataCollecting.createMany).not.toHaveBeenCalled();
  });

  test('limits the number of items per submission', async () => {
    await expectCode(
      submitListSuggestion({
        listId: 7,
        itemIids: Array.from({ length: 11 }, (_, i) => i + 1),
        user: user(),
      }),
      'too-many-items'
    );
  });

  test('skips items already in the list and pending from the same user', async () => {
    prismaMock.listItems.findMany.mockResolvedValue([{ item_iid: 1 }]);
    prismaMock.dataCollecting.findMany.mockResolvedValue([{ item_iid: 2 }]);

    const result = await submitListSuggestion({
      listId: 7,
      itemIids: [1, 2, 3, 3],
      note: '  found it in the shop  ',
      user: user(),
      ip: '127.0.0.1',
    });

    expect(result).toEqual({ created: [3], skipped: [1, 2] });
    expect(prismaMock.dataCollecting.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          type: LIST_SUGGESTION_TYPE,
          item_iid: 3,
          subject_id: 7,
          note: 'found it in the shop',
          user_id: 'user-1',
          ip_address: '127.0.0.1',
        }),
      ],
    });
  });

  test('throws when every item is already in the list', async () => {
    prismaMock.listItems.findMany.mockResolvedValue([{ item_iid: 1 }]);

    await expectCode(
      submitListSuggestion({ listId: 7, itemIids: [1], user: user() }),
      'already-in-list'
    );
    expect(prismaMock.dataCollecting.createMany).not.toHaveBeenCalled();
  });

  test('ignores item ids that do not exist', async () => {
    getManyItemsMock.mockResolvedValue({});

    await expectCode(
      submitListSuggestion({ listId: 7, itemIids: [999], user: user() }),
      'invalid-items'
    );
  });
});

describe('listPendingSuggestions', () => {
  test('groups by list and item and hides items already in the list', async () => {
    prismaMock.dataCollecting.findMany.mockResolvedValue([
      {
        item_iid: 1,
        subject_id: 7,
        note: 'note b',
        addedAt: new Date('2026-01-02'),
        user: { username: 'b' },
      },
      {
        item_iid: 1,
        subject_id: 7,
        note: null,
        addedAt: new Date('2026-01-01'),
        user: { username: 'a' },
      },
      { item_iid: 2, subject_id: 7, note: null, addedAt: new Date('2026-01-01'), user: null },
    ]);
    prismaMock.userList.findMany.mockResolvedValue([
      { internal_id: 7, name: 'Official List', slug: null, cover_url: null, colorHex: null },
    ]);
    prismaMock.listItems.findMany.mockResolvedValue([{ list_id: 7, item_iid: 2 }]);

    const groups = await listPendingSuggestions();

    expect(groups).toHaveLength(1);
    expect(groups[0].items).toHaveLength(1);
    expect(groups[0].items[0]).toMatchObject({
      item_iid: 1,
      lastAt: new Date('2026-01-02').toJSON(),
    });
    expect(groups[0].items[0].requests.map((r) => r.username)).toEqual(['b', 'a']);
  });
});

describe('resolveSuggestions', () => {
  const admin = user({ id: 'admin-1', isAdmin: true });

  test('approve adds the items to the list and marks requests as processed', async () => {
    prismaMock.dataCollecting.updateMany.mockResolvedValue({ count: 2 });

    const result = await resolveSuggestions({
      listId: 7,
      itemIids: [3, 4],
      action: 'approve',
      admin,
    });

    expect(result).toEqual({ success: true, resolved: 2 });
    expect(upsertItemsMock).toHaveBeenCalledWith(7, [
      { item_iid: '3', capValue: undefined, amount: undefined, imported: false },
      { item_iid: '4', capValue: undefined, amount: undefined, imported: false },
    ]);
    expect(revalidateTagMock).toHaveBeenCalled();
    expect(prismaMock.dataCollecting.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        subject_id: 7,
        item_iid: { in: [3, 4] },
        processed: false,
      }),
      data: expect.objectContaining({ processed: true, approved: true }),
    });
    expect(createLogMock).toHaveBeenCalled();
  });

  test('reject only marks requests as processed', async () => {
    await resolveSuggestions({ listId: 7, itemIids: [3], action: 'reject', admin });

    expect(upsertItemsMock).not.toHaveBeenCalled();
    expect(revalidateTagMock).not.toHaveBeenCalled();
    expect(prismaMock.dataCollecting.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ processed: true, approved: false }),
      })
    );
  });

  test('rejects invalid actions and item ids', async () => {
    await expectCode(
      resolveSuggestions({ listId: 7, itemIids: [3], action: 'delete', admin }),
      'invalid-action'
    );
    await expectCode(
      resolveSuggestions({ listId: 7, itemIids: 'nope', action: 'approve', admin }),
      'invalid-items'
    );
    expect(prismaMock.dataCollecting.updateMany).not.toHaveBeenCalled();
  });

  test('rejects non-official lists', async () => {
    prismaMock.userList.findUnique.mockResolvedValue(officialList({ official: false }));

    await expectCode(
      resolveSuggestions({ listId: 7, itemIids: [3], action: 'approve', admin }),
      'invalid-list'
    );
    expect(upsertItemsMock).not.toHaveBeenCalled();
  });
});

describe('POST /api/admin/list-suggestions', () => {
  const request = (body: unknown) =>
    new Request('http://localhost/api/admin/list-suggestions', {
      method: 'POST',
      body: JSON.stringify(body),
    });

  test('returns 401 for non-admins', async () => {
    getServerCurrentUserMock.mockResolvedValue({ user: user() });

    const res = await resolvePOST(request({ listId: 7, itemIids: [1], action: 'approve' }));
    expect(res.status).toBe(401);
  });

  test('returns 400 for an invalid action', async () => {
    getServerCurrentUserMock.mockResolvedValue({ user: user({ isAdmin: true }) });

    const res = await resolvePOST(request({ listId: 7, itemIids: [1], action: 'delete' }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid-action' });
  });

  test('resolves suggestions for admins', async () => {
    getServerCurrentUserMock.mockResolvedValue({ user: user({ isAdmin: true }) });
    prismaMock.dataCollecting.updateMany.mockResolvedValue({ count: 1 });

    const res = await resolvePOST(request({ listId: 7, itemIids: [1], action: 'reject' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, resolved: 1 });
  });
});
