import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { newCreatePriceProcessFlow } from '.';

const take = 25000;
let page = 976;
let lastID = page * take;
let retry = 0;

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  return res.status(200).json(null);
  while (page < 1000 && retry <= 3) {
    try {
      const t = new Date().getTime();

      await timeout(processPage(), 1000 * 60 * 5);

      console.log(`page ${page} time: ${new Date().getTime() - t}`);
    } catch (e) {
      console.error(e);
      retry++;
      await wait(1000 * 20 * retry);
    }
  }

  res.status(200).json('success');
}

const processPage = async () => {
  const priceProcess = await prisma.priceProcess.findMany({
    take: take,
    where: {
      internal_id: {
        gt: lastID,
      },
    },
    orderBy: {
      internal_id: 'asc',
    },
  });
  console.log('starting process');
  await newCreatePriceProcessFlow(priceProcess, true, true);
  lastID = priceProcess[priceProcess.length - 1].internal_id;
  page++;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const timeout = (prom: any, time: number) => {
  let timer: NodeJS.Timeout;
  return Promise.race([
    prom,
    new Promise((_r, rej) => (timer = setTimeout(rej, time, new Error('timeout')))),
  ]).finally(() => clearTimeout(timer));
};
