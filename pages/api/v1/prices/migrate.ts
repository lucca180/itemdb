import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { newCreatePriceProcessFlow } from '.';
import { Prisma } from '@prisma/client';
import { getManyItems } from '../items/many';

const take = 25000;
let page = 1004;
let lastID = page * take;
let retry = 0;

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  return res.status(200).json(null);
  while (page < 1100 && retry <= 3) {
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

  // await migrateLastSeen1();
  // await Promise.all([migrateLastSeen2(), lastSeenTrades()]);
  res.status(200).json('success');
}

const migrateLastSeen2 = async () => {
  const createMany = [];

  const treco = (await prisma.$queryRaw`
    select item_id, type, MAX(addedAt) as addedAt  from priceprocess p
    group by item_id, type
  `) as { item_id: number; type: string; addedAt: Date }[];

  const uniqueIDs = new Set(treco.map((t) => t.item_id));

  console.log('unique ids', uniqueIDs.size);

  const itemData = await getManyItems({
    item_id: Array.from(uniqueIDs)
      .filter((x) => !!x)
      .map((id) => id.toString()),
  });

  for (const id of uniqueIDs) {
    if (!id) continue;
    const iid = itemData[id]?.internal_id;
    if (!iid) {
      console.log('no iid', id);
      continue;
    }

    const lastSeenList = treco.filter((t) => t.item_id === id);
    const lastSeen: { [type: string]: Date | null } = {
      sw: null,
      // auction: null,
      // trade: null,
      // restock: null,
    };

    for (const l of lastSeenList) {
      if (['usershop', 'sw', 'ssw'].includes(l.type)) lastSeen.sw = l.addedAt;
      // if(l.type === 'auction') lastSeen.auction = l.addedAt;
      // if(l.type === 'trades') lastSeen.trade = l.addedAt;
      // if(l.type === 'restock') lastSeen.restock = l.addedAt;
    }

    const createManyObj: Prisma.LastSeenCreateManyInput[] = Object.entries(lastSeen)
      .filter(([, addedAt]) => !!addedAt)
      .map(([type, addedAt]) => ({
        item_iid: iid,
        type,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        lastSeen: addedAt!,
      }));

    createMany.push(...createManyObj);
  }

  console.log('creating many', createMany.length);

  await prisma.lastSeen.createMany({
    data: createMany,
    skipDuplicates: true,
  });

  console.log('done restock and sw');
};

const migrateLastSeen1 = async () => {
  const createMany = [];

  const treco1Raw = prisma.$queryRaw`
    select item_iid, type, MAX(addedAt) as addedAt  from priceprocess2 p
    group by item_iid, type
  `;

  const treco2Raw = prisma.$queryRaw`
    select item_iid, type, MAX(addedAt) as addedAt  from restockauctionhistory p
    group by item_iid, type
  `;

  const [treco1, treco3] = (await Promise.all([treco1Raw, treco2Raw])) as {
    item_iid: number;
    type: string;
    addedAt: Date;
  }[][];

  const treco = [...treco1, ...treco3];

  const uniqueIDs = new Set(treco.map((t) => t.item_iid));

  console.log('unique ids', uniqueIDs.size);

  for (const id of uniqueIDs) {
    if (!id) continue;

    const lastSeenList = treco.filter((t) => t.item_iid === id);
    const lastSeen: { [type: string]: Date | null } = {
      sw: null,
      auction: null,
      // trades: null,
      restock: null,
    };

    for (const l of lastSeenList) {
      if (['usershop', 'sw', 'ssw'].includes(l.type)) lastSeen.sw = l.addedAt;
      if (l.type === 'auction') lastSeen.auction = l.addedAt;
      // if(l.type === 'trades') lastSeen.trades = l.addedAt;
      if (l.type === 'restock') lastSeen.restock = l.addedAt;
    }

    const createManyObj: Prisma.LastSeenCreateManyInput[] = Object.entries(lastSeen)
      .filter(([, addedAt]) => !!addedAt)
      .map(([type, addedAt]) => ({
        item_iid: id,
        type,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        lastSeen: addedAt!,
      }));

    createMany.push(...createManyObj);
  }

  console.log('creating many', createMany.length);

  await prisma.lastSeen.createMany({
    data: createMany,
    skipDuplicates: true,
  });

  console.log('done restock sw and auction');
};

const lastSeenTrades = async () => {
  const createMany = [];

  const treco = (await prisma.$queryRaw`
    select name, image_id, MAX(addedAt) as addedAt  from tradeitems t 
    group by name, image_id
  `) as { name: string; image_id: string; addedAt: Date }[];

  const uniqueIDs: { [id: string]: [string, string] } = {};

  for (const t of treco) {
    const id = `${encodeURI(t.name.toLowerCase())}_${t.image_id}`;
    uniqueIDs[id] = [t.name, t.image_id];
  }

  console.log('unique ids', Object.keys(uniqueIDs).length);

  const itemData = await getManyItems({
    name_image_id: Object.values(uniqueIDs),
  });

  for (const id of Object.keys(uniqueIDs)) {
    if (!id) continue;
    const iid = itemData[id]?.internal_id;
    if (!iid) {
      console.log('no iid', id);
      continue;
    }

    const lastSeenList = treco.filter(
      (t) => t.name === uniqueIDs[id][0] && t.image_id === uniqueIDs[id][1]
    );
    const lastSeen: { [type: string]: Date | null } = {
      trade: null,
    };

    for (const l of lastSeenList) {
      lastSeen.trade = l.addedAt;
    }

    const createManyObj: Prisma.LastSeenCreateManyInput[] = Object.entries(lastSeen)
      .filter(([, addedAt]) => !!addedAt)
      .map(([type, addedAt]) => ({
        item_iid: iid,
        type,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        lastSeen: addedAt!,
      }));

    createMany.push(...createManyObj);
  }

  console.log('creating many', createMany.length);

  await prisma.lastSeen.createMany({
    data: createMany,
    skipDuplicates: true,
  });

  console.log('done trades');
};

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
