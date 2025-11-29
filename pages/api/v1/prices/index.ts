/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import requestIp from 'request-ip';
import hash from 'object-hash';
import { PriceProcess, Prisma } from '@prisma/generated/client';
import { getManyItems } from '../items/many';
import { checkHash } from '../../../../utils/hash';
import { ItemData } from '../../../../types';
import { differenceInCalendarDays } from 'date-fns';
import { chunk } from 'lodash';

const TARNUM_KEY = process.env.TARNUM_KEY;
type RestockAuction = Prisma.RestockAuctionHistoryCreateManyInput & { addToPriceProcess: boolean };

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);
  if (req.method === 'POST') return POST(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  const limit = Number(req.query.limit) || 25;
  const includeCount = req.query.count === 'true';

  const result = await getLatestPricedItems(Math.min(limit, 100), includeCount);

  return res.json(result);
};

const POST = async (req: NextApiRequest, res: NextApiResponse) => {
  const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const itemPrices = data.itemPrices;

  const tarnumkey = req.headers['tarnumkey'] as string | undefined;

  const lang = data.lang;

  if (lang !== 'en') return res.status(400).json({ error: 'Invalid language' });

  const dataHash = data.hash;

  if (!checkHash(dataHash, { itemPrices: itemPrices }) && tarnumkey !== TARNUM_KEY)
    return res.status(400).json({ error: 'Invalid hash' });

  const dataList = [];

  for (const priceInfo of itemPrices) {
    let { name, img, owner, stock, value, otherInfo, type, item_id, neo_id } = priceInfo;

    let imageId: string | null = null;

    stock = isNaN(Number(stock)) ? undefined : Number(stock);
    value = isNaN(Number(value)) ? undefined : Number(value);
    item_id = isNaN(Number(item_id)) ? undefined : Number(item_id);
    neo_id = isNaN(Number(neo_id)) ? undefined : Number(neo_id);

    if (!name || !value || value <= 0) continue;

    if (img) img = (img as string).replace(/^[^\/\/\s]*\/\//gim, 'https://');

    if (img) imageId = (img as string).match(/[^\.\/]+(?=\.gif)/)?.[0] ?? null;

    // sw, ssw and usershop items have a max value of 999.999
    if (['sw', 'ssw', 'usershop'].includes(type) && value > 999999) continue;

    // hotfix for users that didn't update their script
    if (type === 'auction' && value < 1000) continue;

    const excludeNeoId = ['sw', 'ssw', 'usershop', 'restock'];

    const x = {
      name: name as string,
      item_id: item_id as number | undefined,
      image: img as string | null,
      image_id: imageId as string | null,
      owner: owner as string | undefined,
      type: type as string,
      stock: stock as number | undefined,
      price: value as number,
      otherInfo: otherInfo?.toString() as string | undefined,

      language: lang as string,
      ip_address: requestIp.getClientIp(req) as string | undefined,

      neo_id: excludeNeoId.includes(type) ? undefined : (neo_id as number | undefined),

      hash: '',
    };

    const dateHash = new Date().toISOString().slice(0, 10);

    x.hash = hash(
      { ...x, dateHash, neo_id: neo_id },
      {
        excludeKeys: (key: string) => ['ip_address', 'hash', 'stock'].includes(key),
      }
    );

    dataList.push(x);
  }

  const x = await newCreatePriceProcessFlow(dataList);

  return res.json(x);
};

export const getLatestPricedItems = async (limit: number, includeCount = false) => {
  const [pricesRaw, priceCount] = await Promise.all([
    prisma.itemPrices.findMany({
      where: {
        manual_check: null,
        price: {
          gt: 0,
        },
      },
      orderBy: { processedAt: 'desc' },
      take: limit,
    }),
    includeCount
      ? prisma.itemPrices.count({
          where: {
            processedAt: {
              gte: new Date(Date.now() - 48 * 60 * 60 * 1000),
            },
            manual_check: null,
          },
        })
      : null,
  ]);

  const ids = pricesRaw.map((p) => p.item_iid?.toString()) as string[];

  const items = await getManyItems({
    id: ids,
  });

  const sortedItems = Object.values(items).sort(
    (a, b) => ids.indexOf(a.internal_id.toString()) - ids.indexOf(b.internal_id.toString())
  );

  if (includeCount) {
    return {
      count: priceCount,
      items: sortedItems,
    };
  }

  return sortedItems;
};

export const newCreatePriceProcessFlow = async (
  dataList: Prisma.PriceProcessCreateInput[] | PriceProcess[],
  skipLastSeen = false,
  skipProcessed = false
) => {
  const itemInfo: { [id: string]: Set<string | string[]> } = {
    id: new Set(),
    item_id: new Set(),
    name_image_id: new Set(),
    image_id: new Set(),
    name: new Set(),
  };

  dataList.map((item) => {
    if (item.item_id) {
      itemInfo['item_id'].add(item.item_id.toString());
    } else if (item.image_id && item.name) {
      itemInfo['name_image_id'].add([item.name, item.image_id]);
    } else if (item.image_id) {
      itemInfo['image_id'].add(item.image_id);
    } else if (item.name) {
      itemInfo['name'].add(item.name);
    }
  });

  const allItemsFull = await Promise.all(
    Object.keys(itemInfo).map((key: any) => getManyItems({ [key]: Array.from(itemInfo[key]) }))
  );

  const allItems = Object.assign({}, ...allItemsFull) as { [identifier: string]: ItemData };

  const lastSeen: { [type: string]: { [id: number]: Date } } = {
    restock: {},
    auction: {},
    trade: {},
    sw: {},
  };

  const newPriceData = dataList
    .map((raw): Prisma.PriceProcess2CreateManyInput | null => {
      if (['restock', 'auction'].includes(raw.type) || (raw.processed && skipProcessed))
        return null;
      const itemData = findItem(raw, allItems);
      if (!itemData) return null;

      if (['sw', 'ssw', 'usershop'].includes(raw.type)) {
        const last = lastSeen.sw[itemData.internal_id];
        if (!last || last < new Date(raw.addedAt ?? Date.now()))
          lastSeen.sw[itemData.internal_id] = new Date(raw.addedAt ?? Date.now());
      }

      if (raw.type === 'trade') {
        const last = lastSeen.trade[itemData.internal_id];
        if (!last || last < new Date(raw.addedAt ?? Date.now()))
          lastSeen.trade[itemData.internal_id] = new Date(raw.addedAt ?? Date.now());
      }

      return {
        owner: raw.owner,
        stock: raw.stock,
        price: raw.price,
        ip_address: raw.ip_address,
        addedAt: raw.addedAt ?? new Date(),
        processed: raw.processed ?? false,
        type: raw.type,
        hash: raw.hash,
        neo_id: raw.neo_id,
        item_iid: itemData.internal_id,
      };
    })
    .filter((x) => x !== null) as Prisma.PriceProcess2CreateManyInput[];

  const newRestockAuction = dataList
    .map((raw): RestockAuction | null => {
      if (!['restock', 'auction'].includes(raw.type)) return null;
      const itemData = findItem(raw, allItems);
      if (!itemData) return null;

      const last = lastSeen[raw.type][itemData.internal_id];
      if (!last || last < new Date(raw.addedAt ?? Date.now()))
        lastSeen[raw.type][itemData.internal_id] = new Date(raw.addedAt ?? Date.now());

      return {
        owner: raw.owner,
        stock: raw.stock,
        price: raw.price,
        otherInfo: raw.otherInfo,
        ip_address: raw.ip_address,
        addedAt: raw.addedAt ?? new Date(),
        type: raw.type,
        hash: raw.hash,
        item_iid: itemData.internal_id,
        neo_id: raw.neo_id,
        addToPriceProcess: shouldAddToPriceProcess(itemData),
      };
    })
    .filter((x) => x !== null) as RestockAuction[];

  const deleteAll = prisma.priceProcessHistory.deleteMany({
    where: {
      item_iid: {
        in: newPriceData.map((x) => x.item_iid),
      },
    },
  });

  const x = await Promise.all([
    createPriceProcess(newPriceData),
    createRestockHistory(newRestockAuction.filter((x) => x.type === 'restock')),
    newHandleAuction(newRestockAuction.filter((x) => x.type === 'auction' && x.neo_id)),
    !skipLastSeen ? processLastSeen(lastSeen) : null,
    deleteAll,
  ]);

  return x;
};

const createPriceProcess = async (dataList: Prisma.PriceProcess2CreateManyInput[]) => {
  let tries = 0;

  while (tries < 3) {
    try {
      const x = await prisma.priceProcess2.createMany({
        data: dataList,
        skipDuplicates: true,
      });

      return x;
    } catch (e: any) {
      if (['P2002', 'P2034'].includes(e.code) && tries < 3) {
        tries++;
        await exponentialBackoff(tries);
        continue;
      }
      console.error('Create Price Process Error:', e);
      throw e;
    }
  }
};

const createRestockHistory = async (dataList: RestockAuction[]) => {
  let tries = 0;

  while (tries < 3) {
    try {
      const x = await prisma.restockAuctionHistory.createMany({
        data: dataList.map(removePriceProcess),
        skipDuplicates: true,
      });

      return x;
    } catch (e: any) {
      if (['P2002', 'P2034'].includes(e.code) && tries < 3) {
        tries++;
        await exponentialBackoff(tries);
        continue;
      }
      console.error('Create Restock History Error:', e);
      throw e;
    }
  }
};

const processLastSeen = async (lastSeen: { [key: string]: { [id: number]: Date } }) => {
  const ops = [];

  for (const type of Object.keys(lastSeen)) {
    for (const [id, date] of Object.entries(lastSeen[type])) {
      ops.push(
        prisma.$executeRaw`
          INSERT INTO lastSeen (item_iid, type, lastSeen)
          VALUES (${Number(id)}, ${type}, ${date})
          ON DUPLICATE KEY UPDATE lastSeen = GREATEST(lastSeen, VALUES(lastSeen))
        `
      );
    }
  }

  for (const batch of chunk(ops, 20)) {
    await Promise.all(batch);
  }
};

const newHandleAuction = async (dataList: RestockAuction[]) => {
  let tries = 0;
  const auctionData = dataList.map((auction) =>
    prisma.restockAuctionHistory.upsert({
      where: {
        type_neo_id: {
          type: auction.type,
          neo_id: auction.neo_id as number,
        },
      },
      create: removePriceProcess(auction),
      update: removePriceProcess(auction),
    })
  );

  const filteredStr = ['< 30 min', 'closed'];
  const filteredAuctions = dataList.filter(
    (x) => x.price > 1000000 && filteredStr.some((y) => x.otherInfo?.toLowerCase().includes(y))
  );

  const isSold = (auction: RestockAuction) =>
    !auction.otherInfo?.includes('nobody') ? ', auctionSold' : '';

  // we're using ip_address field to add more info than we should
  // (adding a new column to PriceProcess2 is pain)
  const upsertPriceProcess = filteredAuctions
    .map((auction) =>
      auction.addToPriceProcess
        ? prisma.priceProcess2.upsert({
            where: {
              type_neo_id: {
                type: 'auction',
                neo_id: auction.neo_id as number,
              },
              item_iid: auction.item_iid,
            },
            create: {
              owner: auction.owner,
              stock: auction.stock,
              price: auction.price,
              ip_address: auction.ip_address + isSold(auction),
              addedAt: auction.addedAt,
              processed: false,
              type: 'auction',
              hash: auction.hash,
              neo_id: auction.neo_id,
              item_iid: auction.item_iid,
            },
            update: {
              price: auction.price,
              ip_address:
                auction.ip_address + isSold(auction) + `, auctionUpdated(${new Date().getTime()})`,
              addedAt: new Date(),
            },
          })
        : undefined
    )
    .filter((x) => x !== undefined);

  while (tries < 3) {
    try {
      const x = await prisma.$transaction([...auctionData, ...upsertPriceProcess]);
      return x;
    } catch (e: any) {
      if (['P2002', 'P2034'].includes(e.code) && tries < 3) {
        tries++;
        await exponentialBackoff(tries);
        continue;
      }
      console.error('Handle New Auction Error:', e);
      throw e;
    }
  }
};

const findItem = (
  rawInput: Prisma.PriceProcessCreateInput,
  list: { [identifier: string]: ItemData }
) => {
  const { name, image_id, item_id } = rawInput;

  if (item_id) {
    const item = list[item_id.toString()];
    if (item) return item;
  }

  if (name && image_id) {
    const item = list[`${encodeURI(name.toLowerCase())}_${image_id}`];
    if (item) return item;
  }

  if (image_id) {
    const item = list[image_id];
    if (item) return item;
  }

  if (name) {
    const item = list[name];
    if (item) return item;
  }

  return null;
};

const exponentialBackoff = async (tries: number) => {
  const delay = Math.pow(2, tries) * 300; // Exponential backoff formula
  return new Promise((resolve) => setTimeout(resolve, delay));
};

const removePriceProcess = (dataList: RestockAuction) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { addToPriceProcess, ...rest } = dataList;
  return rest as Prisma.RestockAuctionHistoryCreateManyInput;
};

const shouldAddToPriceProcess = (item: ItemData) => {
  const price = item.price.value;
  if (!price) return true;

  const priceTime = new Date(item.price?.addedAt ?? 0);
  const timeDiff = differenceInCalendarDays(new Date(), priceTime);

  if (price >= 500000 || timeDiff >= 30) return true;

  return false;
};
