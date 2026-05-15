import { expect, test, describe } from 'vitest';
import { doSearch } from '../pages/api/v1/search';
import {
  asSearchFilters,
  consistentPageCases,
  itemdb,
  productionComparisonCases,
} from './search-test-utils';

describe('Search API tests', () => {
  test.concurrent.each(productionComparisonCases)(
    '$description',
    async ({ query }) => {
      const itemdbAPI = itemdb.get('/search', {
        params: {
          ...query,
          limit: 1,
          onlyStats: true,
        },
      });

      const candidateAPI = doSearch(
        query.s,
        asSearchFilters(query),
        false,
        undefined,
        undefined,
        true
      );

      const [itemdbResponse, candidateResponse] = await Promise.all([itemdbAPI, candidateAPI]);

      expect(itemdbResponse.status).toBe(200);
      const data = itemdbResponse.data as Awaited<ReturnType<typeof doSearch>>;
      expect(data.totalResults).toEqual(candidateResponse.totalResults);
    },
    30_000
  );

  test.concurrent.each(consistentPageCases)(
    '$description returns consistent pages',
    async ({ query }) => {
      const [pageResult, countResult] = await Promise.all([
        doSearch(query.s, asSearchFilters(query), true, 0, false, false),
        doSearch(query.s, asSearchFilters(query), true, 0, false, true),
      ]);

      expect(pageResult.totalResults).toBe(countResult.totalResults);
      expect(pageResult.content.length).toBeLessThanOrEqual(Number(query.limit ?? 48));
      expect(new Set(pageResult.content.map((item) => item.internal_id)).size).toBe(
        pageResult.content.length
      );
    },
    30_000
  );
});
