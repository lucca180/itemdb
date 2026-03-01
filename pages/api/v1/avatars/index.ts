import { AvatarSolutionCreateManyInput } from '@prisma/generated/models';
import prisma from '@utils/prisma';
import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';

const TARNUM_KEY = process.env.TARNUM_KEY;

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (
    process.env.NODE_ENV !== 'development' &&
    (!req.headers.authorization || req.headers.authorization !== TARNUM_KEY)
  )
    return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') return GET(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  const response = await axios.get('https://magnetismotimes.com/wp-json/neoAvy/v1/itemdb');
  const data = response.data as MT_Avy[];

  const allAvys = await prisma.avatarSolution.findMany();
  const allAvysMap = new Map(allAvys.map((a) => [a.avy_id, a]));

  const createData: AvatarSolutionCreateManyInput[] = [];

  for (const avy of data) {
    const existingAvy = allAvysMap.get(avy.id);
    if (existingAvy) {
      const updated = existingAvy.updatedAt.getTime() < avy.last_update * 1000;
      if (!updated) continue;

      await prisma.avatarSolution.update({
        where: { avy_id: avy.id },
        data: {
          name: avy.altName || avy.name,
          image: avy.img,
          updatedAt: new Date(avy.last_update * 1000),
          releasedAt: avy.releaseDate ? new Date(avy.releaseDate * 1000) : null,
          list_id: avy.itemdb.list_id ? Number(avy.itemdb.list_id) : null,
          item_iid: avy.itemdb.item_iid ? Number(avy.itemdb.item_iid) : null,
          solution: avy.itemdb.solution,
        },
      });

      continue;
    }

    createData.push({
      avy_id: avy.id,
      name: avy.altName || avy.name,
      image: avy.img,
      updatedAt: new Date(avy.last_update * 1000),
      releasedAt: avy.releaseDate ? new Date(avy.releaseDate * 1000) : null,
      list_id: avy.itemdb.list_id ? Number(avy.itemdb.list_id) : null,
      item_iid: avy.itemdb.item_iid ? Number(avy.itemdb.item_iid) : null,
      solution: avy.itemdb.solution,
    });
  }

  if (createData.length > 0) {
    await prisma.avatarSolution.createMany({
      data: createData,
      skipDuplicates: true,
    });
  }

  return res.status(200).json({ message: 'Avatar solutions updated successfully' });
};

type MT_Avy = {
  id: string;
  img: string;
  releaseDate?: number;
  last_update: number;
  guideLink: string;
  altName: string;
  name: string;
  content: string;
  itemdb: {
    item_iid: string;
    list_id: string;
    solution: string;
  };
};
