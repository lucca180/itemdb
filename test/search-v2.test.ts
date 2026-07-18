import { describe, expect, test } from 'vitest';
import { doSearch } from '../pages/api/v1/search';
import { doSearchV2 } from '@app/server/search/searchV2';
import { asSearchFilters, consistentPageCases } from './search-test-utils';

describe('Search v2 parity', () => {
  test.concurrent.each(consistentPageCases)(
    '$description matches v1 items and returns ItemV2 card shape',
    async ({ query }) => {
      const filters = asSearchFilters(query);

      const [v1, v2] = await Promise.all([
        doSearch(query.s, filters, true, 0, false, false),
        doSearchV2(query.s, filters, { intent: 'card', includeStats: true }),
      ]);

      // Same envelope: filters/sort/pagination are shared with v1.
      expect(v2.totalResults).toBe(v1.totalResults);
      expect(v2.page).toBe(v1.page);
      expect(v2.resultsPerPage).toBe(v1.resultsPerPage);

      // Same items, same order.
      expect(v2.content.map((item) => item.internal_id)).toEqual(
        v1.content.map((item) => item.internal_id)
      );

      // ItemV2 card shape.
      for (const item of v2.content) {
        expect(typeof item.internal_id).toBe('number');
        expect(item.image).toEqual(
          expect.objectContaining({ url: expect.any(String), id: expect.any(String) })
        );
        expect(['np', 'nc', 'pb']).toContain(item.type);

        // `price` is the acquisition price union (np | ncMall) or null.
        if (item.price) expect(['np', 'ncMall']).toContain(item.price.type);

        // `ncValue` only ever appears on NC items with a known trade value.
        if (item.ncValue) {
          expect(item.type).toBe('nc');
          expect(['itemdb', 'lebron']).toContain(item.ncValue.source);
        }
      }
    },
    30_000
  );
});
