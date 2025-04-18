import { NextApiRequest, NextApiResponse } from 'next';
import { CheckAuth } from '../../../../utils/googleCloud';
import prisma from '../../../../utils/prisma';
import Chance from 'chance';
import { Prisma } from '@prisma/generated/client';
import requestIp from 'request-ip';

const chance = new Chance();
export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  // if (req.method === 'GET') return GET(req, res);
  if (req.method === 'POST') return POST(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function POST(req: NextApiRequest, res: NextApiResponse) {
  let user = null;

  try {
    user = (await CheckAuth(req)).user;
  } catch (e) {}
  if (user?.banned) return res.status(401).json({ error: 'Unauthorized' });

  let { type, itemList } = req.body as { type: string; itemList: string | string[] };
  if (!type || !itemList) return res.status(400).json({ error: 'Missing type or itemList' });

  itemList = (itemList as string).split(',') as string[];

  const instanceID = chance.hash({ length: 15 });

  const ip = requestIp.getClientIp(req);

  const createMany: Prisma.DataCollectingCreateManyInput[] = itemList.map((item) => ({
    instance_id: instanceID,
    type,
    item_iid: Number(item),
    user_id: user?.id ?? '-1',
    ip_address: ip ?? '-1',
  }));

  await prisma.dataCollecting.createMany({
    data: createMany,
  });

  return res.status(200).json({ instanceID });
}
