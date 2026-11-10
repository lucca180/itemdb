import { describe, expect, it } from 'vitest';
import { buildListPriceHistory, type ListPricePoint } from '@utils/list/listPriceHistory';

const at = (iso: string) => new Date(iso);
const p = (item_iid: number, value: number, iso: string): ListPricePoint => ({
  item_iid,
  value,
  addedAt: at(iso),
});

describe('buildListPriceHistory', () => {
  it('does not double count items priced on the same day', () => {
    const amounts = new Map([
      [1, 1],
      [2, 1],
    ]);

    const points = buildListPriceHistory(amounts, [
      p(1, 100, '2026-01-01T10:00:00Z'),
      p(2, 50, '2026-01-01T12:00:00Z'),
    ]);

    expect(points).toEqual([{ date: '2026-01-01', value: 150, pricedItems: 2 }]);
  });

  it('keeps only the last price of an item within a day', () => {
    const points = buildListPriceHistory(new Map([[1, 1]]), [
      p(1, 100, '2026-01-01T01:00:00Z'),
      p(1, 120, '2026-01-01T20:00:00Z'),
    ]);

    expect(points).toEqual([{ date: '2026-01-01', value: 120, pricedItems: 1 }]);
  });

  it('carries forward previous prices and multiplies by amount', () => {
    const amounts = new Map([
      [1, 2],
      [2, 3],
    ]);

    const points = buildListPriceHistory(amounts, [
      p(2, 10, '2026-01-03T00:00:00Z'),
      p(1, 100, '2026-01-01T00:00:00Z'),
      p(1, 90, '2026-01-05T00:00:00Z'),
    ]);

    expect(points).toEqual([
      { date: '2026-01-01', value: 200, pricedItems: 1 },
      { date: '2026-01-03', value: 230, pricedItems: 2 },
      { date: '2026-01-05', value: 210, pricedItems: 2 },
    ]);
  });

  it('buckets by UTC day, not local time', () => {
    const points = buildListPriceHistory(new Map([[1, 1]]), [
      p(1, 100, '2026-01-01T23:30:00Z'),
      p(1, 200, '2026-01-02T00:30:00Z'),
    ]);

    expect(points.map((x) => x.date)).toEqual(['2026-01-01', '2026-01-02']);
  });

  it('ignores items outside the list and non-positive prices', () => {
    const points = buildListPriceHistory(new Map([[1, 1]]), [
      p(1, 0, '2026-01-01T00:00:00Z'),
      p(99, 500, '2026-01-01T00:00:00Z'),
      p(1, 40, '2026-01-02T00:00:00Z'),
    ]);

    expect(points).toEqual([{ date: '2026-01-02', value: 40, pricedItems: 1 }]);
  });

  it('samples one point per period with the total at the end of each window', () => {
    // 2026-01-01 is epoch day 20454 = 2922 × 7, so its 7-day window is 2026-01-01..2026-01-07
    const points = buildListPriceHistory(
      new Map([[1, 1]]),
      [
        p(1, 100, '2026-01-01T00:00:00Z'),
        p(1, 110, '2026-01-04T00:00:00Z'),
        p(1, 120, '2026-01-07T23:00:00Z'),
        p(1, 130, '2026-01-08T00:00:00Z'),
      ],
      7
    );

    expect(points).toEqual([
      { date: '2026-01-07', value: 120, pricedItems: 1 },
      { date: '2026-01-08', value: 130, pricedItems: 1 },
    ]);
  });

  it('cuts points before `since` but keeps totals from the full history', () => {
    const amounts = new Map([
      [1, 1],
      [2, 1],
    ]);

    const points = buildListPriceHistory(
      amounts,
      [
        p(1, 80, '2019-01-01T00:00:00Z'),
        p(1, 100, '2020-05-01T00:00:00Z'), // stable since before the cutoff
        p(2, 50, '2023-12-20T00:00:00Z'),
        p(2, 60, '2024-02-01T00:00:00Z'),
      ],
      1,
      at('2024-01-01T00:00:00Z')
    );

    expect(points).toEqual([
      { date: '2024-01-01', value: 150, pricedItems: 2 },
      { date: '2024-02-01', value: 160, pricedItems: 2 },
    ]);
  });

  it('keeps one point at `since` when nothing changed after it', () => {
    const points = buildListPriceHistory(
      new Map([[1, 1]]),
      [p(1, 100, '2020-05-01T00:00:00Z')],
      1,
      at('2024-01-01T00:00:00Z')
    );

    expect(points).toEqual([{ date: '2024-01-01', value: 100, pricedItems: 1 }]);
  });

  it('does not add a cutoff point when a change falls on `since`', () => {
    const points = buildListPriceHistory(
      new Map([[1, 1]]),
      [p(1, 100, '2020-05-01T00:00:00Z'), p(1, 120, '2024-01-01T08:00:00Z')],
      1,
      at('2024-01-01T00:00:00Z')
    );

    expect(points).toEqual([{ date: '2024-01-01', value: 120, pricedItems: 1 }]);
  });

  it('returns no points without prices', () => {
    expect(buildListPriceHistory(new Map([[1, 1]]), [])).toEqual([]);
  });
});
