/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../utils/prisma';
import { Items } from '@prisma/client';
import Color from 'color';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET')
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );

  const query = (req.query.s as string)?.trim() ?? '';

  // if(!query) return res.status(400).json({error: 'invalid search query'});

  const isColorSearch = query.match(/#[0-9A-Fa-f]{6}$/gm);
  const includeIds = [];

  if (isColorSearch) {
    const x = Color(query);
    const [l, a, b] = x.lab().array();

    const resultRaw = (await prisma.$queryRaw`
            SELECT a.internal_id
            FROM Items as a
            LEFT JOIN ItemColor as b on a.image_id = b.image_id and (POWER(b.lab_l-${l},2)+POWER(b.lab_a-${a},2)+POWER(b.lab_b-${b},2)) IN (
                (
                    SELECT min((POWER(lab_l-${l},2)+POWER(lab_a-${a},2)+POWER(lab_b-${b},2))) as dist
                    FROM ItemColor
                    GROUP BY image_id 
                    having dist <= 750
                )
            )
            WHERE (POWER(lab_l-${l},2)+POWER(lab_a-${a},2)+POWER(lab_b-${b},2)) <= 750  
        `) as any[];

    includeIds.push(...resultRaw.map((a) => a.internal_id));
  }

  const groups = [
    'category',
    'isNC',
    'isWearable',
    'status',
  ] as (keyof Items)[];

  const promises = [];

  for (const group of groups) {
    const x = prisma.items.groupBy({
      by: [group],
      _count: {
        _all: true,
      },
      where: {
        OR: [
          { name: { contains: query } },
          { internal_id: { in: includeIds } },
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
      x[name] = data._count._all;
    }

    result[group] = x;
  }

  res.json(result);
}
