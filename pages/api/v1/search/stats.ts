/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { Prisma } from '@prisma/client';
import Color from 'color';
import { parseFilters } from '../../../../utils/parseFilters';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET')
    throw new Error(`The HTTP ${req.method} method is not supported at this route.`);

  const query = (req.query.s as string)?.trim() ?? '';
  const result = await getSearchStats(query);

  res.json(result);
}

export const getSearchStats = async (resQuery: string, list_id = 0, includeHidden = false) => {
  const originalQuery = resQuery.trim() ?? '';
  const [, newQuery] = parseFilters(originalQuery, false);

  const query = newQuery;

  const fulltext = Prisma.sql`MATCH (a.name) AGAINST (${query} IN BOOLEAN MODE) OR a.name LIKE ${`%${originalQuery}%`}`;

  const isColorSearch = query.match(/#[0-9A-Fa-f]{6}$/gm);

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
  ];

  const hiddenQuery = !includeHidden ? Prisma.sql`AND isHidden = 0` : Prisma.empty;
  let l, a, b;

  if (isColorSearch) {
    const color = Color(query);
    [l, a, b] = color.lab().array();
  }

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
    else column = Prisma.sql`a.category`;

    const sqlQuery = prisma.$queryRaw`
      SELECT ${column}, count(*) as count
      FROM Items as a
      ${
        !!l
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

      where (${fulltext}) and a.canonical_id is null 
      
      ${!!l ? Prisma.sql`and d.dist is not null` : Prisma.empty}
      
      ${
        list_id
          ? Prisma.sql`AND exists (SELECT 1 FROM ListItems WHERE list_id = ${list_id} and item_iid = a.internal_id ${hiddenQuery})`
          : Prisma.empty
      }

      group by ${column}
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
