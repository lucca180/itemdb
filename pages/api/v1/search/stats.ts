import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { verifyListJWT } from '@utils/api/api-utils';
import { buildSearchQueryParts } from '../../../../utils/search/queryBuilder';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

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
    mode: 'facets',
  });

  // Facet key -> column of the filtered rows. zone_label comes from the WearableData join below.
  const groups: { key: string; column: string }[] = [
    { key: 'category', column: 'category' },
    { key: 'isWearable', column: 'isWearable' },
    { key: 'status', column: 'status' },
    { key: 'type', column: 'type' },
    { key: 'isNeohome', column: 'isNeohome' },
    { key: 'isBD', column: 'isBD' },
    { key: 'canEat', column: 'canEat' },
    { key: 'canRead', column: 'canRead' },
    { key: 'canPlay', column: 'canPlay' },
    { key: 'zone_label', column: 'zone_label' },
    { key: 'saleStatus', column: 'stats' },
  ];

  // Reads the filtered rows once and aggregates in JS. A CTE referenced by one UNION ALL
  // branch per facet is re-evaluated for each reference in MariaDB, which made this ~7× slower
  // (benchmarked with scripts/bench-color-search.ts).
  const resultRaw = (await prisma.$queryRaw`
    SELECT temp.internal_id, temp.category, temp.isWearable, temp.status, temp.type,
      temp.isNeohome, temp.isBD, temp.canEat, temp.canRead, temp.canPlay, temp.stats,
      w.item_iid as zone_item_iid, w.zone_label as zone_label
    FROM (
      ${queryParts.tempQuery}
    ) as temp
    LEFT JOIN WearableData w ON w.item_iid = temp.internal_id AND w.isCanonical = 1
    ${queryParts.whereQuery}
  `) as any[];

  const result: { [id: string]: { [id: string]: number } | number } = {};
  // Items already counted per facet value — the zone join can repeat an item's row.
  const counted = new Map<string, Set<number>>();

  for (const group of groups) result[group.key] = {};

  const addCount = (groupKey: string, value: unknown) => {
    const groupResult = result[groupKey] as { [id: string]: number };
    let name = value?.toString() || 'Unknown';
    name = name === '0' ? 'false' : name === '1' ? 'true' : name;
    groupResult[name] = (groupResult[name] ?? 0) + 1;
  };

  for (const data of resultRaw) {
    const internalId = Number(data.internal_id);

    for (const group of groups) {
      // Zone counts every canonical wearable row, like the INNER JOIN count(*) it replaces.
      if (group.key === 'zone_label') {
        if (data.zone_item_iid != null) addCount(group.key, data.zone_label);
        continue;
      }

      // Other facets count distinct items per value.
      const value = data[group.column];
      const dedupeKey = `${group.key}\u0000${value}`;
      const ids = counted.get(dedupeKey) ?? new Set<number>();
      if (ids.has(internalId)) continue;

      ids.add(internalId);
      counted.set(dedupeKey, ids);
      addCount(group.key, value);
    }
  }

  return result;
};
