import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../../utils/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const id = req.query.id as string;

  const tagRaw = await prisma.itemTags.findMany({
    where: {
      item_iid: parseInt(id),
    },
    select: {
      tag: {
        select: {
          tag_id: true,
          name: true,
          description: true,
          type: true,
        },
      },
    },
  });

  const tags = tagRaw.map((raw) => raw.tag);

  res.json(tags);
}
