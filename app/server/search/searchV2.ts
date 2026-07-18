import prisma from '@utils/prisma';
import { Prisma } from '@prisma/generated/client';
import { buildSearchQueryParts } from '@utils/search/queryBuilder';
import { searchRowToItemV2 } from '@app/server/search/searchRowToItemV2';
import type { RawItemV2Row } from '@app/server/items/v2';
import type { ItemIntent, ItemV2For, SearchFilters } from '@types';

const ENV_FUZZY_SEARCH = process.env.HAS_FUZZY_SEARCH === 'true';

export type DoSearchV2Options<I extends ItemIntent> = {
  /** Response preset. Defaults to `card` (the search default). */
  intent?: I;
  /**
   * Include `count(*) OVER()` to populate `totalResults`. Defaults to `false` —
   * callers must opt in, since the extra window count is not free.
   */
  includeStats?: boolean;
  /** Restrict results to a list (adds the `listitems` EXISTS predicate). */
  list?: { id: number; includeHidden?: boolean };
};

export type SearchV2Result<I extends ItemIntent> = {
  content: ItemV2For<I>[];
  page: number;
  totalResults: number;
  resultsPerPage: number;
};

/**
 * ItemV2 search. Reuses the v1 query builder (filters/sort/pagination stay
 * identical) and maps the raw rows to ItemV2 via `searchRowToItemV2` — the
 * `queryBuilder` projection is untouched.
 */
export async function doSearchV2<I extends ItemIntent = 'card'>(
  query: string,
  filters?: SearchFilters,
  options: DoSearchV2Options<I> = {}
): Promise<SearchV2Result<I>> {
  const intent = (options.intent ?? 'card') as I;
  const includeStats = options.includeStats ?? false;

  const queryParts = buildSearchQueryParts({
    query,
    filters,
    list: options.list?.id
      ? { id: options.list.id, includeHidden: options.list.includeHidden }
      : undefined,
    enableFuzzySearch: ENV_FUZZY_SEARCH,
    mode: 'items',
  });

  const statsQuery = includeStats ? Prisma.sql`,count(*) OVER() AS full_count` : Prisma.empty;

  const resultRaw = (await prisma.$queryRaw`
    SELECT * ${statsQuery} FROM (
      ${queryParts.tempQuery}
    ) as temp
    ${queryParts.whereQuery}
    ${queryParts.sortQuery}
    ${queryParts.sortDir === 'desc' ? Prisma.sql`DESC` : Prisma.sql`ASC`}
    LIMIT ${queryParts.limit} OFFSET ${queryParts.page * queryParts.limit}
  `) as RawItemV2Row[];

  const content = resultRaw.map((row) => searchRowToItemV2(row, intent));

  return {
    content,
    page: queryParts.page + 1,
    totalResults: Number(resultRaw?.[0]?.full_count ?? resultRaw.length),
    resultsPerPage: queryParts.limit,
  };
}
