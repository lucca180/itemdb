import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { ItemData, SearchFilters } from '../../../../types';
import { Prisma } from '@prisma/generated/client';
import queryString from 'query-string';
import { defaultFilters, parseFilters } from '../../../../utils/parseFilters';
import { redis_setDataCount } from '@utils/redis';
import { rawToItemData } from '../items/many';
import { verifyListJWT } from '@utils/api-utils';
import * as Sentry from '@sentry/nextjs';
import { buildSearchQueryParts } from './queryBuilder';

const ENV_FUZZY_SEARCH = process.env.HAS_FUZZY_SEARCH === 'true';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' || !req.url)
    return res.status(405).json({ error: 'Method not allowed' });

  const reqQuery = queryString.parse(req.url.split('?')[1], {
    arrayFormat: 'bracket',
  }) as any;
  const query = (reqQuery.s as string)?.trim() ?? '';
  const skipStats = reqQuery.skipStats === 'true';
  const onlyStats = reqQuery.onlyStats === 'true';

  reqQuery.page = parseInt(reqQuery.page as string) || 1;
  reqQuery.limit = parseInt(reqQuery.limit as string) || 48;
  reqQuery.limit = Math.min(reqQuery.limit, 3000);
  const list_id = parseInt(reqQuery.list_id as string) || 0;

  if (list_id && !isNaN(list_id)) {
    const listJWT = req.headers['x-itemdb-list-jwt'] as string | undefined;

    if (!listJWT) return res.status(401).json({ error: 'Unauthorized' });

    if (!verifyListJWT(listJWT, list_id)) return res.status(401).json({ error: 'Unauthorized' });
  }

  const startTime = performance.now();
  const result = await doSearch(query, reqQuery, !skipStats, list_id, false, onlyStats);
  const duration = performance.now() - startTime;

  if (!onlyStats) trackUsage(query, reqQuery, duration);

  redis_setDataCount(result.content.length, req);

  res.json(result);
}

export async function doSearch(
  query: string,
  filters?: SearchFilters,
  includeStats = true,
  list_id = 0,
  includeHidden = false,
  onlyStats = false
) {
  const queryParts = buildSearchQueryParts({
    query,
    filters,
    list: list_id ? { id: list_id, includeHidden } : undefined,
    enableFuzzySearch: ENV_FUZZY_SEARCH,
    mode: onlyStats ? 'count' : 'items',
  });
  const statsQuery =
    !includeStats && !onlyStats ? Prisma.sql`` : Prisma.sql`,count(*) OVER() AS full_count`;

  const resultRaw = (await prisma.$queryRaw`
    SELECT ${!onlyStats ? Prisma.sql`*` : Prisma.sql`1`} ${statsQuery} FROM (
      ${queryParts.tempQuery}
    ) as temp
    ${queryParts.whereQuery}
    ${!onlyStats ? queryParts.sortQuery : Prisma.empty}
    ${!onlyStats ? (queryParts.sortDir === 'desc' ? Prisma.sql`DESC` : Prisma.sql`ASC`) : Prisma.empty}
    LIMIT ${queryParts.limit} OFFSET ${queryParts.page * queryParts.limit}
  `) as any[];

  const filteredResult = onlyStats ? [] : resultRaw;

  const itemList: ItemData[] = filteredResult.map((result: any) => rawToItemData(result));

  return {
    content: itemList,
    page: queryParts.page + 1,
    totalResults: parseInt(resultRaw?.[0]?.full_count ?? resultRaw.length),
    resultsPerPage: queryParts.limit,
  };
}

const trackUsage = (query: string, filters: SearchFilters, duration: number) => {
  const originalQuery = query;
  const [queryFilters, querySanitized] = parseFilters(originalQuery, false);

  query = querySanitized.trim() ?? '';

  filters = { ...queryFilters, ...filters };

  const usage: any = {};

  const fullFields = ['sortBy', 'sortDir', 'mode', 'limit', 'type', 'zone'];
  const skipFields = ['page', 'skipStats'];

  for (const [key, value] of Object.entries(filters)) {
    if (
      typeof value === 'undefined' ||
      value === null ||
      (value as any)?.length === 0 ||
      value === defaultFilters[key as keyof typeof defaultFilters] ||
      skipFields.includes(key)
    )
      continue;

    if (fullFields.includes(key)) {
      if (Array.isArray(value)) {
        const arr = usage[key] ?? [];
        arr.push(...value);
        usage[key] = arr;
      } else {
        usage[key] = value;
      }
    } else usage[key] = (usage[key] ?? 0) + 1;
  }

  Sentry.metrics.count('api.search', 1, {
    attributes: usage,
  });

  Sentry.metrics.distribution('api.search.duration', duration, {
    unit: 'milliseconds',
    attributes: usage,
  });
};
