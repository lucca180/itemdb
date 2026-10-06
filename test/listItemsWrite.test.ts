import { describe, expect, test, vi, beforeEach } from 'vitest';
import { applyDynamicItemChanges, hideItems, upsertItems } from '@services/list/listItemsWrite';

const mockCountSql = vi.fn();
const mockTransaction = vi.fn();
const mockUpdateMany = vi.fn();
const mockDeleteMany = vi.fn();
const mockCreateMany = vi.fn();
const mockUserListUpdate = vi.fn();
const mockExecuteRaw = vi.fn();

vi.mock('@utils/prisma', () => ({
  default: {
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock('@services/list/listCount', () => ({
  countSql: (...args: unknown[]) => mockCountSql(...args),
}));

vi.mock('@services/list/listItemsV2Cache', () => ({
  invalidateListItemIds: vi.fn(),
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
        $executeRaw: mockExecuteRaw,
      };
      return fn(tx);
    });
  });

  const sqlText = (query: { strings: readonly string[] }) => query.strings.join('?');

  test('upsertItems is a no-op when there are no items', async () => {
    expect(await upsertItems(10, [])).toBeNull();
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  test('upsertItems only overwrites capValue/amount when provided', async () => {
    await upsertItems(10, [
      { item_iid: '1', capValue: '5', amount: '3', imported: true },
      { item_iid: '2', capValue: undefined, amount: '4', imported: true },
      { item_iid: '3', capValue: undefined, amount: undefined, imported: false },
      { item_iid: '4', capValue: '', amount: undefined, imported: false },
    ]);

    expect(mockExecuteRaw).toHaveBeenCalledTimes(3);
    const [full, amountOnly, none] = mockExecuteRaw.mock.calls.map(([q]) => q);

    expect(sqlText(full)).toContain('capValue = VALUES(capValue)');
    expect(sqlText(full)).toContain('amount = VALUES(amount)');
    expect(full.values).toEqual([10, 1, 5, 3, true]);

    expect(sqlText(amountOnly)).not.toContain('capValue = VALUES(capValue)');
    expect(sqlText(amountOnly)).toContain('amount = VALUES(amount)');
    expect(amountOnly.values).toEqual([10, 2, 0, 4, true]);

    expect(sqlText(none)).not.toContain('capValue = VALUES(capValue)');
    expect(sqlText(none)).not.toContain('amount = VALUES(amount)');
    expect(none.values).toEqual([10, 3, 0, 1, false, 10, 4, 0, 1, false]);

    expect(mockCountSql).toHaveBeenCalledWith(10, expect.any(Object));
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
      skipDuplicates: true,
    });
    expect(mockCountSql).toHaveBeenCalledWith(5, expect.any(Object));
  });

  test('applyDynamicItemChanges is a no-op when there are no changes', async () => {
    await applyDynamicItemChanges(5, {});

    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockCountSql).not.toHaveBeenCalled();
  });

  test('applyDynamicItemChanges retries on P2034 write conflicts', async () => {
    const conflict = Object.assign(new Error('write conflict'), { code: 'P2034' });
    mockTransaction
      .mockRejectedValueOnce(conflict)
      .mockImplementationOnce(async (fn: (tx: unknown) => unknown) => {
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
    mockCreateMany.mockResolvedValue({ count: 1 });

    await applyDynamicItemChanges(5, {
      create: [{ list_id: 5, item_iid: 99 }],
    });

    expect(mockTransaction).toHaveBeenCalledTimes(2);
    expect(mockCreateMany).toHaveBeenCalledWith({
      data: [{ list_id: 5, item_iid: 99 }],
      skipDuplicates: true,
    });
  });
});
