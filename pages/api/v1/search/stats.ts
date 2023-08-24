/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { Items, Prisma } from '@prisma/client';
import Color from 'color';
import { parseFilters } from '../../../../utils/parseFilters';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET')
    throw new Error(`The HTTP ${req.method} method is not supported at this route.`);

  const originalQuery = (req.query.s as string)?.trim() ?? '';
  // if(!query) return res.status(400).json({error: 'invalid search query'});
  const [filters, newQuery] = parseFilters(originalQuery, false);

  const query = newQuery;

  const isColorSearch = query.match(/#[0-9A-Fa-f]{6}$/gm);

  const groups = ['category', 'isWearable', 'status', 'type', 'isNeohome'] as (keyof Items)[];

  if (isColorSearch) {
    const color = Color(query);
    const [l, a, b] = color.lab().array();

    const queries = [];

    for (const group of groups) {
      let column;
      if (group === 'isWearable') column = Prisma.sql`a.isWearable`;
      else if (group === 'isNeohome') column = Prisma.sql`a.isNeohome`;
      else if (group === 'status') column = Prisma.sql`a.status`;
      else if (group === 'type') column = Prisma.sql`a.type`;
      else column = Prisma.sql`a.category`;

      const sqlQuery = prisma.$queryRaw`
        SELECT ${column}, count(*) as count
        FROM Items as a
        LEFT JOIN (
            SELECT image_id, min((POWER(lab_l-${l},2)+POWER(lab_a-${a},2)+POWER(lab_b-${b},2))) as dist
            FROM ItemColor
            GROUP BY image_id 
            having dist <= 750
        ) as d on a.image_id = d.image_id
        where d.dist is not null
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

    return res.json(result);
  }

  const promises = [];

  for (const group of groups) {
    const x = prisma.items.groupBy({
      by: [group],
      _count: {
        _all: true,
      },
      where: {
        OR: [
          {
            name: {
              search: filters.mode !== 'description' && query ? query : undefined,
            },
            description:
              filters.mode !== 'name' && query
                ? {
                    search: query,
                  }
                : undefined,
          },
          {
            name: {
              contains: originalQuery,
            },
          },
        ],
      },
    });

    promises.push(x);
  }

  const promiseResult = await Promise.all(promises);

  const result: { [id: string]: { [id: string]: number } | number } = {};

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const groupData = promiseResult[i];
    const x: { [id: string]: number } = {};

    for (const data of groupData) {
      const name = data[group]?.toString() || 'Unknown';
      x[name] = x[name] ? x[name] + data._count._all : data._count._all;
    }

    result[group] = x;
  }

  res.json(result);
}
