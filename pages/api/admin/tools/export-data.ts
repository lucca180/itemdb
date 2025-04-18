import { NextApiRequest, NextApiResponse } from 'next';
// import { CheckAuth } from '../../../../utils/googleCloud';
import prisma from '../../../../utils/prisma';
import { Prisma } from '@prisma/generated/client';
import { AsyncParser } from '@json2csv/node';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  // try {
  //   const user = (await CheckAuth(req)).user;
  //   if (!user || !user.isAdmin) throw new Error('Unauthorized');
  // } catch (e) {
  //   res.status(404);
  //   return;
  // }

  if (req.method === 'GET') return GET(req, res);
}

async function GET(req: NextApiRequest, res: NextApiResponse) {
  const type = req.query.type as string | undefined;

  const typeQuery = type ? Prisma.sql`where d.type = ${type}` : Prisma.empty;

  const data = await prisma.$queryRaw`
    select d.internal_id, d.type, i.name as item_name, d.item_iid as item_id, d.instance_id as submit_id, d.addedAt from datacollecting d 
    left join items i on d.item_iid = i.internal_id
    ${typeQuery}
  `;

  const parser = new AsyncParser();

  const csv = parser.parse(JSON.stringify(data));

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="data.csv"`);
  res.send(csv);
}
