import { describe, expect, it } from 'vitest';
import type { ListItemInfo, UserList } from '@types';
import { isListSeriesActive, rankItemOfficialLists } from '@services/ListService';

const NOW = Date.parse('2026-11-08T12:00:00Z');

function list(
  id: number,
  opts: {
    itemCount?: number | null;
    highlight?: boolean;
    seriesStart?: string | null;
    seriesEnd?: string | null;
    createdAt?: string;
  } = {}
): UserList {
  return {
    internal_id: id,
    itemCount: opts.itemCount ?? null,
    seriesStart: opts.seriesStart ?? null,
    seriesEnd: opts.seriesEnd ?? null,
    createdAt: opts.createdAt ?? '2020-01-01T00:00:00.000Z',
    itemInfo: [{ isHighlight: !!opts.highlight } as ListItemInfo],
  } as UserList;
}

const ids = (lists: UserList[]) => lists.map((l) => l.internal_id);

describe('isListSeriesActive', () => {
  it('is active only strictly between start and end', () => {
    const active = { seriesStart: '2026-11-01T18:00:00Z', seriesEnd: '2026-11-16T18:00:00Z' };
    expect(isListSeriesActive(active, NOW)).toBe(true);
    expect(isListSeriesActive(active, Date.parse(active.seriesStart))).toBe(false);
    expect(isListSeriesActive(active, Date.parse(active.seriesEnd))).toBe(false);
  });

  it('requires both dates', () => {
    expect(isListSeriesActive({ seriesStart: '2026-11-01T18:00:00Z', seriesEnd: null }, NOW)).toBe(
      false
    );
    expect(isListSeriesActive({ seriesStart: null, seriesEnd: '2026-12-01T18:00:00Z' }, NOW)).toBe(
      false
    );
  });
});

describe('rankItemOfficialLists', () => {
  const activeSeries = { seriesStart: '2026-11-01T18:00:00Z', seriesEnd: '2026-11-16T18:00:00Z' };

  it('orders lists with 300+ items by smallest first', () => {
    const lists = [
      list(1, { itemCount: 3996 }),
      list(2, { itemCount: 300 }),
      list(3, { itemCount: 401 }),
    ];
    expect(ids(rankItemOfficialLists(lists, NOW))).toEqual([2, 3, 1]);
  });

  it('orders lists under 300 items by newest first, before bigger lists', () => {
    const lists = [
      list(1, { itemCount: 300, createdAt: '2026-10-01T00:00:00Z' }),
      list(2, { itemCount: 10, createdAt: '2021-01-01T00:00:00Z' }),
      list(3, { itemCount: 299, createdAt: '2025-01-01T00:00:00Z' }),
      list(4, { itemCount: 5, createdAt: '2023-01-01T00:00:00Z' }),
    ];
    expect(ids(rankItemOfficialLists(lists, NOW))).toEqual([3, 4, 2, 1]);
  });

  it('breaks creation date ties by size', () => {
    const createdAt = '2024-05-05T00:00:00Z';
    const lists = [list(1, { itemCount: 50, createdAt }), list(2, { itemCount: 20, createdAt })];
    expect(ids(rankItemOfficialLists(lists, NOW))).toEqual([2, 1]);
  });

  it('puts lists with a context before newer and smaller lists', () => {
    const lists = [
      list(1, { itemCount: 5, createdAt: '2026-11-01T00:00:00Z' }),
      list(2, { itemCount: 5000, createdAt: '2010-01-01T00:00:00Z' }),
    ];
    expect(ids(rankItemOfficialLists(lists, NOW, new Set([2])))).toEqual([2, 1]);
  });

  it('puts highlights before contexts', () => {
    const lists = [list(1, { itemCount: 10 }), list(2, { itemCount: 500, highlight: true })];
    expect(ids(rankItemOfficialLists(lists, NOW, new Set([1])))).toEqual([2, 1]);
  });

  it('puts active series before highlights, contexts and size', () => {
    const lists = [
      list(1, { itemCount: 5, highlight: true }),
      list(2, { itemCount: 9000, ...activeSeries }),
      list(3, {
        itemCount: 1,
        seriesStart: '2026-10-01T18:00:00Z',
        seriesEnd: '2026-10-31T18:00:00Z',
      }),
    ];
    expect(ids(rankItemOfficialLists(lists, NOW, new Set([3])))).toEqual([2, 1, 3]);
  });

  it('applies the date and size rules inside each group', () => {
    const lists = [
      list(1, { itemCount: 900, highlight: true }),
      list(2, { itemCount: 50, highlight: true, createdAt: '2022-01-01T00:00:00Z' }),
      list(3, { itemCount: 60, highlight: true, createdAt: '2025-01-01T00:00:00Z' }),
    ];
    expect(ids(rankItemOfficialLists(lists, NOW))).toEqual([3, 2, 1]);
  });

  it('sends lists without a count last and keeps incoming order on ties', () => {
    const lists = [
      list(1, { itemCount: null }),
      list(2, { itemCount: 400 }),
      list(3, { itemCount: 400 }),
    ];
    expect(ids(rankItemOfficialLists(lists, NOW))).toEqual([2, 3, 1]);
  });

  it('does not mutate the input', () => {
    const lists = [list(1, { itemCount: 2 }), list(2, { itemCount: 1 })];
    rankItemOfficialLists(lists, NOW);
    expect(ids(lists)).toEqual([1, 2]);
  });
});
