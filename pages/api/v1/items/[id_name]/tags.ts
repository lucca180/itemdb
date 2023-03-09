import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../../utils/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const id_name = req.query.id_name;
  const id = Number(id_name);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid Request' });

  const tagRaw = await prisma.itemTags.findMany({
    where: {
      item_iid: id,
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
