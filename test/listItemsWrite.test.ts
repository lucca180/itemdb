import { describe, expect, test, vi, beforeEach } from 'vitest';
import { applyDynamicItemChanges, hideItems } from '@services/list/listItemsWrite';

const mockCountSql = vi.fn();
const mockTransaction = vi.fn();
const mockUpdateMany = vi.fn();
const mockDeleteMany = vi.fn();
const mockCreateMany = vi.fn();
const mockUserListUpdate = vi.fn();

vi.mock('@utils/prisma', () => ({
  default: {
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock('@services/list/listCount', () => ({
  countSql: (...args: unknown[]) => mockCountSql(...args),
}));

describe('listItemsWrite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCountSql.mockResolvedValue(1);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      const tx = {
        listItems: {
          updateMany: mockUpdateMany,
          deleteMany: mockDeleteMany,
          createMany: mockCreateMany,
        },
        userList: { update: mockUserListUpdate },
        $executeRaw: vi.fn(),
      };
      return fn(tx);
    });
  });

  test('hideItems updates items, touches list and recounts', async () => {
    mockUpdateMany.mockResolvedValue({ count: 2 });
    mockUserListUpdate.mockResolvedValue({});

    await hideItems(10, [1, 2]);

    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { list_id: 10, item_iid: { in: [1, 2] } },
      data: { isHidden: true },
    });
    expect(mockUserListUpdate).toHaveBeenCalled();
    expect(mockCountSql).toHaveBeenCalledWith(10, expect.any(Object));
  });

  test('applyDynamicItemChanges runs writes and count in one transaction', async () => {
    mockCreateMany.mockResolvedValue({ count: 1 });

    await applyDynamicItemChanges(5, {
      create: [{ list_id: 5, item_iid: 99 }],
    });

    expect(mockCreateMany).toHaveBeenCalledWith({
      data: [{ list_id: 5, item_iid: 99 }],
    });
    expect(mockCountSql).toHaveBeenCalledWith(5, expect.any(Object));
  });

  test('applyDynamicItemChanges is a no-op when there are no changes', async () => {
    await applyDynamicItemChanges(5, {});

    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockCountSql).not.toHaveBeenCalled();
  });
});
