import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { Prisma } from '@prisma/generated/client';
import Color from 'color';
import { parseFilters } from '../../../../utils/parseFilters';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET')
    throw new Error(`The HTTP ${req.method} method is not supported at this route.`);

  const query = (req.query.s as string)?.trim() ?? '';
  const forceCategory = req.query.forceCategory as string | undefined;
  const isRestock = req.query.isRestock === 'true' || undefined;
  const result = await getSearchStats(query, {
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
  const originalQuery = resQuery.trim() ?? '';
  const [, newQuery] = parseFilters(originalQuery, false);

  const query = newQuery;
  const isColorSearch = query.match(/#[0-9A-Fa-f]{6}$/gm);
  let l, a, b;

  if (isColorSearch) {
    const color = Color(query);
    [l, a, b] = color.lab().array();
  }

  const fulltext =
    !isColorSearch && (query || originalQuery)
      ? Prisma.sql`and (MATCH (a.name) AGAINST (${query} IN BOOLEAN MODE) OR a.name LIKE ${`%${originalQuery}%`})`
      : Prisma.empty;

  const groups = [
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

  const hiddenQuery = !list?.includeHidden ? Prisma.sql`AND isHidden = 0` : Prisma.empty;

  const queries = [];

  for (const group of groups) {
    let column;
    if (group === 'isWearable') column = Prisma.sql`a.isWearable`;
    else if (group === 'isNeohome') column = Prisma.sql`a.isNeohome`;
    else if (group === 'status') column = Prisma.sql`a.status`;
    else if (group === 'type') column = Prisma.sql`a.type`;
    else if (group === 'isBD') column = Prisma.sql`a.isBD`;
    else if (group === 'canEat') column = Prisma.sql`a.canEat`;
    else if (group === 'canRead') column = Prisma.sql`a.canRead`;
    else if (group === 'canPlay') column = Prisma.sql`a.canPlay`;
    else if (group === 'zone_label') column = Prisma.sql`w.zone_label`;
    else if (group === 'saleStatus') column = Prisma.sql`s.stats as saleStatus`;
    else column = Prisma.sql`a.category`;

    const groupBy = group === 'saleStatus' ? Prisma.sql`s.stats` : column;

    const sqlQuery = prisma.$queryRaw`
      SELECT ${column}, count(*) as count
      FROM Items as a

      ${
        group === 'saleStatus'
          ? Prisma.sql`LEFT JOIN SaleStats as s on a.internal_id = s.item_iid and s.isLatest = 1`
          : Prisma.empty
      }

      ${
        isColorSearch
          ? Prisma.sql`LEFT JOIN (
            SELECT image_id, min((POWER(lab_l-${l},2)+POWER(lab_a-${a},2)+POWER(lab_b-${b},2))) as dist
            FROM ItemColor
            GROUP BY image_id 
            having dist <= 750
        ) as d on a.image_id = d.image_id
      `
          : Prisma.empty
      }
      
      ${
        group === 'zone_label'
          ? Prisma.sql`LEFT JOIN WearableData w on w.item_iid = a.internal_id and w.isCanonical = 1`
          : Prisma.empty
      }

      where 1 = 1 ${fulltext} and a.canonical_id is null 
      
      ${!!isColorSearch ? Prisma.sql`and d.dist is not null` : Prisma.empty}
      
      ${
        list?.id
          ? Prisma.sql`AND exists (SELECT 1 FROM ListItems WHERE list_id = ${list.id} and item_iid = a.internal_id ${hiddenQuery})`
          : Prisma.empty
      }

      ${forceCategory ? Prisma.sql`AND a.category = ${forceCategory}` : Prisma.empty}

      ${isRestock ? Prisma.sql`AND a.rarity <= 100` : Prisma.empty}

      group by ${groupBy}
    `;

    queries.push(sqlQuery);
  }

  const resultRaw = await Promise.all(queries);
  const result: { [id: string]: { [id: string]: number } | number } = {};

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const groupData = resultRaw[i] as any[];
    const x: { [id: string]: number } = {};

    for (const data of groupData) {
      let name = data[group]?.toString() || 'Unknown';
      name = name === '0' ? 'false' : name === '1' ? 'true' : name;
      x[name] = x[name] ? x[name] + Number(data.count) : Number(data.count);
    }

    result[group] = x;
  }

  return result;
};
