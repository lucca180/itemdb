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
  } = {}
): UserList {
  return {
    internal_id: id,
    itemCount: opts.itemCount ?? null,
    seriesStart: opts.seriesStart ?? null,
    seriesEnd: opts.seriesEnd ?? null,
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
  it('orders by smallest list first', () => {
    const lists = [
      list(1, { itemCount: 3996 }),
      list(2, { itemCount: 264 }),
      list(3, { itemCount: 401 }),
    ];
    expect(ids(rankItemOfficialLists(lists, NOW))).toEqual([2, 3, 1]);
  });

  it('puts highlights before smaller lists', () => {
    const lists = [list(1, { itemCount: 10 }), list(2, { itemCount: 500, highlight: true })];
    expect(ids(rankItemOfficialLists(lists, NOW))).toEqual([2, 1]);
  });

  it('puts active series before highlights and size', () => {
    const lists = [
      list(1, { itemCount: 5, highlight: true }),
      list(2, {
        itemCount: 9000,
        seriesStart: '2026-11-01T18:00:00Z',
        seriesEnd: '2026-11-16T18:00:00Z',
      }),
      list(3, {
        itemCount: 1,
        seriesStart: '2026-10-01T18:00:00Z',
        seriesEnd: '2026-10-31T18:00:00Z',
      }),
    ];
    expect(ids(rankItemOfficialLists(lists, NOW))).toEqual([2, 1, 3]);
  });

  it('sends lists without a count last and keeps incoming order on ties', () => {
    const lists = [
      list(1, { itemCount: null }),
      list(2, { itemCount: 20 }),
      list(3, { itemCount: 20 }),
    ];
    expect(ids(rankItemOfficialLists(lists, NOW))).toEqual([2, 3, 1]);
  });

  it('does not mutate the input', () => {
    const lists = [list(1, { itemCount: 2 }), list(2, { itemCount: 1 })];
    rankItemOfficialLists(lists, NOW);
    expect(ids(lists)).toEqual([1, 2]);
  });
});
