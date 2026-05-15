import { describe, expect, test } from 'vitest';
import { getSearchStats } from '../pages/api/v1/search/stats';
import { doSearch } from '../pages/api/v1/search';
import { SearchStats } from '@types';
import { asSearchFilters, searchStatsCases, sumStats } from './search-test-utils';

type SearchStatsGroup = Exclude<keyof SearchStats, 'total'>;

const comparableGroups: SearchStatsGroup[] = [
  'category',
  'isWearable',
  'status',
  'type',
  'isNeohome',
  'isBD',
  'canEat',
  'canRead',
  'canPlay',
  'zone_label',
  'saleStatus',
];

describe('Search Stats API tests', () => {
  test.concurrent.each(searchStatsCases)(
    '$description',
    async ({ query, statsParams, searchFilters }) => {
      const [stats, searchResult] = await Promise.all([
        getSearchStats(query, statsParams) as Promise<SearchStats>,
        doSearch(query, asSearchFilters(searchFilters), true, 0, false, true),
      ]);

      for (const group of comparableGroups) {
        expect(stats[group]).toBeDefined();
        expect(typeof stats[group]).toBe('object');
      }

      expect(sumStats(stats.category)).toBe(searchResult.totalResults);
      expect(sumStats(stats.type)).toBe(searchResult.totalResults);
      expect(sumStats(stats.status)).toBe(searchResult.totalResults);
    },
    30_000
  );
});
