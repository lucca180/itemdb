import { ItemService } from '@services/ItemService';
import { parseItemIntent } from '@types';
import type { SearchFilters } from '@types';
import { verifyListJWT } from '@utils/api/api-utils';
import { trackItemQuota } from '@utils/api/redis';
import queryString from 'query-string';
import { after } from 'next/server';
import type { NextRequest } from 'next/server';

const MAX_LIMIT = 3000;

/**
 * GET /api/v2/search — ItemV2 search results (default intent `card`).
 *
 * Filters/sort/pagination mirror `/api/v1/search`; only the response shape
 * changes. `totalResults` is opt-in via `?includeStats=true` (default skips the
 * window count). Facets/stats and omni stay on v1. No CDN cache in this phase;
 * ban/rate-limit come from `proxy.ts`.
 */
export async function GET(request: NextRequest) {
  const reqQuery = queryString.parse(request.url.split('?')[1] ?? '', {
    arrayFormat: 'bracket',
  }) as Record<string, unknown>;

  const query = (reqQuery.s as string)?.trim() ?? '';

  const intent = parseItemIntent(reqQuery.intent, 'card');
  if (!intent) {
    return Response.json({ error: 'Invalid intent' }, { status: 400 });
  }

  reqQuery.page = parseInt(reqQuery.page as string) || 1;
  reqQuery.limit = Math.min(parseInt(reqQuery.limit as string) || 48, MAX_LIMIT);

  const includeStats = reqQuery.includeStats === 'true';
  const list_id = parseInt(reqQuery.list_id as string) || 0;

  if (list_id && !isNaN(list_id)) {
    const listJWT = request.headers.get('x-itemdb-list-jwt') ?? undefined;
    if (!listJWT || !verifyListJWT(listJWT, list_id)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const result = await ItemService.search(query, reqQuery as SearchFilters, {
    intent,
    includeStats,
    list: list_id ? { id: list_id, includeHidden: false } : undefined,
  });

  // Search reads are always Prisma-backed (no cache this phase) → count them all.
  // Quota is off the hot path — schedule it after the response is sent.
  if (result.content.length > 0) {
    after(() => trackItemQuota(result.content.length, request));
  }

  return Response.json(result, {
    status: 200,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
