import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../utils/prisma';
import { ItemTag } from '../../../types';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET')
    throw new Error(`The HTTP ${req.method} method is not supported at this route.`);

  const query = (req.query.s as string)?.trim() ?? '';
  const type = (req.query.type as string)?.trim() ?? undefined;
  // if(!query) return res.status(400).json({error: 'invalid search query'});

  const result = await prisma.tags.findMany({
    where: {
      name: {
        contains: query,
      },
      type: type,
    },
    take: 5,
  });

  const tags: ItemTag[] = result.map((x) => ({
    tag_id: x.tag_id,
    name: x.name,
    description: x.description,
    type: x.type as ItemTag['type'],
  }));

  res.json(tags);
}
