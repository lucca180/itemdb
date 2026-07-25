'use server';

import { doSearch } from '@pages/api/v1/search';
import { getSearchStats } from '@pages/api/v1/search/stats';
import type { SearchV2Result } from '@app/server/search/searchV2';
import { ItemService } from '@services/ItemService';
import type { SearchFilters, SearchStats } from '@types';
import { verifyListJWT } from '@utils/api/api-utils';

type ListScope = { id: number; includeHidden: boolean };
const MAX_SEARCH_LIMIT = 192;

function normalizeInteger(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.trunc(parsed), min), max);
}

function normalizeQuery(query: unknown) {
  return typeof query === 'string' ? query.trim() : '';
}

function normalizeFilters(filters: SearchFilters): SearchFilters {
  if (!filters || typeof filters !== 'object') {
    throw new Error('Invalid search filters');
  }

  return {
    ...filters,
    list_id: normalizeInteger(filters.list_id, 0, 0, Number.MAX_SAFE_INTEGER),
    limit: normalizeInteger(filters.limit, 48, 1, MAX_SEARCH_LIMIT),
    page: normalizeInteger(filters.page, 1, 1, Number.MAX_SAFE_INTEGER),
  };
}

/**
 * Authorize list-scoped search like the v1 API: the page resolves the list
 * once and signs a short-lived JWT; actions just verify it in memory (no DB).
 */
function resolveListScope(
  list_id: number | undefined | null,
  listJWT: string | undefined | null
): ListScope | undefined {
  const id = Number(list_id);
  if (!id || Number.isNaN(id)) return undefined;

  if (!listJWT || !verifyListJWT(listJWT, id)) {
    throw new Error('Unauthorized');
  }

  return { id, includeHidden: false };
}

/** Page of ItemV2 card results (replaces GET /api/v1/search?skipStats). */
export async function runSearch(
  query: string,
  filters: SearchFilters,
  listJWT?: string | null
): Promise<SearchV2Result<'card'>> {
  const normalizedFilters = normalizeFilters(filters);
  const list = resolveListScope(normalizedFilters.list_id, listJWT);

  return ItemService.search(normalizeQuery(query), normalizedFilters, {
    intent: 'card',
    includeStats: false,
    list,
  });
}

/** Total hit count for pagination (reuses v1 onlyStats count). */
export async function runSearchCount(
  query: string,
  filters: SearchFilters,
  listJWT?: string | null
): Promise<number> {
  const normalizedFilters = normalizeFilters(filters);
  const list = resolveListScope(normalizedFilters.list_id, listJWT);

  const result = await doSearch(
    normalizeQuery(query),
    normalizedFilters,
    false,
    list?.id ?? 0,
    list?.includeHidden ?? false,
    true
  );

  return result.totalResults;
}

/** Facet stats for the filter sidebar/modal (replaces GET /api/v1/search/stats). */
export async function loadSearchStats(
  query: string,
  list_id?: number | null,
  listJWT?: string | null
): Promise<SearchStats | null> {
  const normalizedListId = normalizeInteger(list_id, 0, 0, Number.MAX_SAFE_INTEGER);
  const list = resolveListScope(normalizedListId, listJWT);
  return getSearchStats(normalizeQuery(query), { list }) as Promise<SearchStats>;
}
