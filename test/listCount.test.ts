import { describe, expect, test, vi, beforeEach } from 'vitest';
import { fillCount, fillCounts, updateCount } from '@services/list/listCount';

const mockFindUnique = vi.fn();
const mockExecuteRaw = vi.fn();

vi.mock('@utils/prisma', () => ({
  default: {
    userList: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
    $executeRaw: (...args: unknown[]) => mockExecuteRaw(...args),
  },
}));

describe('listCount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecuteRaw.mockResolvedValue(1);
    mockFindUnique.mockResolvedValue({ visibleItemCount: 6 });
  });

  test('fillCount returns existing value without query', async () => {
    const result = await fillCount({ internal_id: 1, visibleItemCount: 5 });

    expect(result).toBe(5);
    expect(mockExecuteRaw).not.toHaveBeenCalled();
  });

  test('fillCount updates when null', async () => {
    const result = await fillCount({ internal_id: 7470, visibleItemCount: null });

    expect(result).toBe(6);
    expect(mockExecuteRaw).toHaveBeenCalled();
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { internal_id: 7470 },
      select: { visibleItemCount: true },
    });
  });

  test('fillCounts only updates lists with null', async () => {
    const lists = [
      { internal_id: 1, visibleItemCount: 3 },
      { internal_id: 2, visibleItemCount: null },
    ] as const;

    mockFindUnique.mockResolvedValue({ visibleItemCount: 10 });

    await fillCounts([...lists]);

    expect(mockExecuteRaw).toHaveBeenCalledTimes(1);
    expect(lists[1].visibleItemCount).toBe(10);
    expect(lists[0].visibleItemCount).toBe(3);
  });

  test('updateCount persists count', async () => {
    mockFindUnique.mockResolvedValue({ visibleItemCount: 4 });

    const result = await updateCount(99);

    expect(result).toBe(4);
    expect(mockExecuteRaw).toHaveBeenCalled();
  });
});
