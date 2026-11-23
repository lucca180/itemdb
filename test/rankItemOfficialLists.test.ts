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

  // NOW is 2026-11-08T12:00Z: 60 days before is 2026-09-09T12:00Z
  const recentEnd = { seriesStart: '2026-09-01T00:00:00Z', seriesEnd: '2026-10-01T00:00:00Z' };
  const oldEnd = { seriesStart: '2026-07-01T00:00:00Z', seriesEnd: '2026-08-01T00:00:00Z' };

  it('puts series that ended less than 60 days ago before newer and smaller lists', () => {
    const lists = [
      list(1, { itemCount: 5, createdAt: '2026-11-01T00:00:00Z' }),
      list(2, { itemCount: 5000, ...recentEnd }),
    ];
    expect(ids(rankItemOfficialLists(lists, NOW))).toEqual([2, 1]);
  });

  it('puts contexts before recently ended series', () => {
    const lists = [list(1, { itemCount: 10, ...recentEnd }), list(2, { itemCount: 500 })];
    expect(ids(rankItemOfficialLists(lists, NOW, new Set([2])))).toEqual([2, 1]);
  });

  it('puts series that ended 60+ days ago after small lists and before other big lists', () => {
    const lists = [
      list(1, { itemCount: 400 }),
      list(2, { itemCount: 5000, ...oldEnd }),
      list(3, { itemCount: 10, createdAt: '2025-01-01T00:00:00Z' }),
      list(4, { itemCount: 20, createdAt: '2026-01-01T00:00:00Z', ...oldEnd }),
    ];
    // list 4 is small and newer than list 3, but its old series skips the creation date rule;
    // lists 2 and 4 share the series date, so size breaks the tie
    expect(ids(rankItemOfficialLists(lists, NOW))).toEqual([3, 4, 2, 1]);
  });

  it('counts a series that ended exactly 60 days ago as old', () => {
    const lists = [
      list(1, { itemCount: 500 }),
      list(2, { itemCount: 1000, seriesEnd: '2026-09-09T12:00:00Z' }),
    ];
    expect(ids(rankItemOfficialLists(lists, NOW))).toEqual([2, 1]);
  });

  it('orders active series by most recent series date, before highlights', () => {
    const lists = [
      list(1, {
        itemCount: 5,
        highlight: true,
        seriesStart: '2026-10-01T00:00:00Z',
        seriesEnd: '2026-12-01T00:00:00Z',
      }),
      list(2, { itemCount: 900, ...activeSeries }),
    ];
    expect(ids(rankItemOfficialLists(lists, NOW))).toEqual([2, 1]);
  });

  it('orders recently ended series by most recent series date, falling back to the end date', () => {
    const lists = [
      list(1, { itemCount: 5, ...recentEnd }),
      list(2, {
        itemCount: 5,
        seriesStart: '2026-09-20T00:00:00Z',
        seriesEnd: '2026-10-20T00:00:00Z',
      }),
      list(3, { itemCount: 5, seriesEnd: '2026-10-10T00:00:00Z' }),
    ];
    expect(ids(rankItemOfficialLists(lists, NOW))).toEqual([3, 2, 1]);
  });

  it('orders big lists with old series by most recent series date before size', () => {
    const lists = [
      list(1, {
        itemCount: 400,
        seriesStart: '2026-05-01T00:00:00Z',
        seriesEnd: '2026-06-01T00:00:00Z',
      }),
      list(2, { itemCount: 5000, ...oldEnd }),
    ];
    expect(ids(rankItemOfficialLists(lists, NOW))).toEqual([2, 1]);
  });

  it('treats upcoming series as no series', () => {
    const lists = [
      list(1, {
        itemCount: 400,
        seriesStart: '2026-12-01T00:00:00Z',
        seriesEnd: '2026-12-31T00:00:00Z',
      }),
      list(2, { itemCount: 300 }),
    ];
    expect(ids(rankItemOfficialLists(lists, NOW))).toEqual([2, 1]);
  });

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
