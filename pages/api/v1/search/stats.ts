import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { Prisma } from '@prisma/generated/client';
import { verifyListJWT } from '@utils/api-utils';
import { buildSearchQueryParts } from './queryBuilder';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET')
    throw new Error(`The HTTP ${req.method} method is not supported at this route.`);

  const query = (req.query.s as string)?.trim() ?? '';
  const forceCategory = req.query.forceCategory as string | undefined;
  const isRestock = req.query.isRestock === 'true' || undefined;

  const listId = req.query.list_id ? Number(req.query.list_id) : undefined;

  const list = listId ? { id: listId, includeHidden: false } : undefined;

  if (listId && !isNaN(listId)) {
    const listJWT = req.headers['x-itemdb-list-jwt'] as string | undefined;

    if (!listJWT) return res.status(401).json({ error: 'Unauthorized' });

    if (!verifyListJWT(listJWT, listId)) return res.status(401).json({ error: 'Unauthorized' });
  }

  const result = await getSearchStats(query, {
    list,
    forceCategory,
    isRestock,
  });

  res.json(result);
}

type SearchStatsParams = {
  list?: {
    id: number;
    includeHidden?: boolean;
  };
  forceCategory?: string;
  isRestock?: boolean;
};

export const getSearchStats = async (resQuery: string, params?: SearchStatsParams) => {
  const { list, forceCategory, isRestock } = params || {};
  const queryParts = buildSearchQueryParts({
    query: resQuery.trim() ?? '',
    list,
    forceCategory,
    isRestock,
    applyQueryFilters: false,
  });
  const zoneQueryParts = buildSearchQueryParts({
    query: resQuery.trim() ?? '',
    list,
    forceCategory,
    isRestock,
    includeZone: true,
    applyQueryFilters: false,
  });

  const groups: { key: string; column: Prisma.Sql; source: 'filtered' | 'zone_filtered' }[] = [
    { key: 'category', column: Prisma.sql`filtered.category`, source: 'filtered' },
    { key: 'isWearable', column: Prisma.sql`filtered.isWearable`, source: 'filtered' },
    { key: 'status', column: Prisma.sql`filtered.status`, source: 'filtered' },
    { key: 'type', column: Prisma.sql`filtered.type`, source: 'filtered' },
    { key: 'isNeohome', column: Prisma.sql`filtered.isNeohome`, source: 'filtered' },
    { key: 'isBD', column: Prisma.sql`filtered.isBD`, source: 'filtered' },
    { key: 'canEat', column: Prisma.sql`filtered.canEat`, source: 'filtered' },
    { key: 'canRead', column: Prisma.sql`filtered.canRead`, source: 'filtered' },
    { key: 'canPlay', column: Prisma.sql`filtered.canPlay`, source: 'filtered' },
    { key: 'zone_label', column: Prisma.sql`zone_filtered.zone_label`, source: 'zone_filtered' },
    { key: 'saleStatus', column: Prisma.sql`filtered.stats`, source: 'filtered' },
  ];

  const statsQueries = groups.map((group) => {
    return Prisma.sql`
      SELECT ${group.key} as facet, ${group.column} as value, count(*) as count
      FROM ${Prisma.raw(group.source)}
      group by ${group.column}
    `;
  });

  const resultRaw = (await prisma.$queryRaw`
    WITH filtered AS (
      SELECT *
      FROM (
        ${queryParts.tempQuery}
      ) as temp
      ${queryParts.whereQuery}
    ),
    zone_filtered AS (
      SELECT *
      FROM (
        ${zoneQueryParts.tempQuery}
      ) as temp
      ${zoneQueryParts.whereQuery}
    )
    ${Prisma.join(statsQueries, ' UNION ALL ')}
  `) as any[];

  const result: { [id: string]: { [id: string]: number } | number } = {};

  for (const group of groups) result[group.key] = {};

  for (const data of resultRaw) {
    const group = data.facet?.toString();
    const groupResult = result[group] as { [id: string]: number } | undefined;

    if (!groupResult) continue;

    let name = data.value?.toString() || 'Unknown';
    name = name === '0' ? 'false' : name === '1' ? 'true' : name;
    groupResult[name] = groupResult[name]
      ? groupResult[name] + Number(data.count)
      : Number(data.count);
  }

  return result;
};
