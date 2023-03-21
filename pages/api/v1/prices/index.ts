import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { PriceData } from '../../../../types';
import requestIp from 'request-ip';
import hash from 'object-hash';
import { Prisma } from '@prisma/client';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import checkHash from '../../../../userscripts/hash.esm.min';

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
  const item_id = req.query.item_id as string;
  const name = req.query.name as string;
  const image_id = req.query.image_id as string;

  const pricesRaw = await prisma.itemPrices.findMany({
    where: {
      manual_check: null,
      OR: [
        { item_id: item_id ? Number(item_id) : undefined },
        {
          name: name,
          image_id: image_id,
        },
      ],
    },
    orderBy: { addedAt: 'desc' },
  });

  const prices: PriceData[] = pricesRaw.map((p) => {
    return {
      value: p.price,
      addedAt: p.addedAt.toJSON(),
      inflated: !!p.noInflation_id,
    };
  });

  return res.json(prices);
};

const POST = async (req: NextApiRequest, res: NextApiResponse) => {
  const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const itemPrices = data.itemPrices;

  const lang = data.lang;
  //const dataHash = data.hash;

  // if(!checkHash(dataHash, {itemPrices: itemPrices})) 
  //   return res.status(400).json({ error: 'Invalid hash' });

  const dataList = [];
  let isAuction = false;

  for (const priceInfo of itemPrices) {
    let { name, img, owner, stock, value, otherInfo, type, item_id, neo_id } = priceInfo;

    let imageId: string | null = null;
    if (type == 'auction') isAuction = true;
    stock = isNaN(Number(stock)) ? undefined : Number(stock);
    value = isNaN(Number(value)) ? undefined : Number(value);
    item_id = isNaN(Number(item_id)) ? undefined : Number(item_id);
    neo_id = isNaN(Number(neo_id)) ? undefined : Number(neo_id);

    if (!name || !value || value <= 0) continue;

    if (img) img = (img as string).replace(/^[^\/\/\s]*\/\//gim, 'https://');

    if (img) imageId = (img as string).match(/[^\.\/]+(?=\.gif)/)?.[0] ?? null;

    // sw, ssw and usershop items have a max value of 999.999
    if (['sw', 'ssw', 'usershop'].includes(type) && value > 999999) continue;

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

      neo_id: neo_id as number | undefined,

      hash: '',
    };

    const dateHash = neo_id ? undefined : new Date().toISOString().slice(0, 10);

    x.hash = hash(
      { ...x, dateHash },
      {
        excludeKeys: (key: string) => ['ip_address', 'hash', 'stock'].includes(key),
      }
    );

    dataList.push(x);
  }

  let tries = 0;
  while (tries <= 3) {
    try {
      if (isAuction) {
        const result = await handleAuction(dataList);
        return res.json(result);
      }

      const result = await prisma.priceProcess.createMany({
        data: dataList,
        skipDuplicates: true,
      });

      return res.json(result);
    } catch (e: any) {
      // prevent race condition
      if (['P2002', 'P2034'].includes(e.code) && tries < 3) {
        tries++;
        continue;
      }

      console.error(e);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  return res.status(500).json({ error: 'Internal Server Error' });
};

const handleAuction = async (dataList: Prisma.PriceProcessCreateInput[]) => {
  const auctionData = dataList.map((auction) =>
    prisma.priceProcess.upsert({
      where: {
        type_neo_id: {
          type: auction.type,
          neo_id: auction.neo_id as number,
        },
        processed: false,
      },
      create: auction,
      update: auction,
    })
  );

  return prisma.$transaction(auctionData);
};
