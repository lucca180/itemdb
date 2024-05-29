/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { coefficientOfVariation } from '../../../../utils/utils';
import { ItemPrices, PriceProcess2, Prisma } from '@prisma/client';
import { differenceInCalendarDays } from 'date-fns';
import { processPrices2 } from '../../../../utils/pricing';

const MAX_DAYS = 30;
const MAX_PAST_DAYS = 60;

const TARNUM_KEY = process.env.TARNUM_KEY;

const EVENT_MODE = process.env.EVENT_MODE === 'true';
const MIN_LAST_UPDATE = EVENT_MODE ? 3 : 7;

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET');
    return res.status(200).json({});
  }

  if (
    process.env.NODE_ENV !== 'development' &&
    (!req.headers.authorization || req.headers.authorization !== TARNUM_KEY)
  )
    return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') return GET(req, res);
  if (req.method === 'POST') return POST(req, res);
  if (req.method === 'DELETE') return DELETE(req, res);

  return res.status(405).json({ error: 'Method not allowed' });
}

const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  const checkPopular = req.query.checkPopular === 'true';

  const maxDate = new Date(Date.now() - MAX_DAYS * 24 * 60 * 60 * 1000);
  const maxDateFormated = maxDate.toISOString().split('T')[0];

  const maxPast = new Date(Date.now() - MAX_PAST_DAYS * 24 * 60 * 60 * 1000);
  const maxPastFormated = maxPast.toISOString().split('T')[0];

  const lastDays = new Date(Date.now() - MIN_LAST_UPDATE * 24 * 60 * 60 * 1000);
  const lastDaysFormated = lastDays.toISOString().split('T')[0];

  let query = prisma.$queryRaw`
    SELECT item_iid, COUNT(*) as count, MAX(addedAt) as MAX_addedAt, count(*) OVER() AS full_count FROM PriceProcess2 p
    WHERE 
      addedAt >= ${maxPastFormated} AND
      processed = 0 AND
      NOT EXISTS (
        SELECT 1 FROM ItemPrices a WHERE 
        a.addedAt >= ${lastDaysFormated}
        and a.item_iid = p.item_iid 
      ) AND
      NOT EXISTS (
        SELECT 1 FROM PriceProcessHistory b WHERE
        b.item_iid = p.item_iid
      )
    GROUP BY item_iid 
    HAVING count >= 10 OR (MAX_addedAt <= ${maxDateFormated} and count >= 3)
    LIMIT 1
  ` as any;

  if (checkPopular)
    query = prisma.$queryRaw`
      SELECT item_iid, COUNT(*) as count, count(*) OVER() AS full_count FROM PriceProcess2 p
      WHERE 
        addedAt >= ${lastDaysFormated} AND
        processed = 0 AND
        EXISTS (
          SELECT 1 FROM ItemPrices a WHERE 
          a.addedAt >= ${lastDaysFormated}
          and a.item_iid = p.item_iid 
        ) AND
        NOT EXISTS (
          SELECT 1 FROM PriceProcessHistory b WHERE
          b.item_iid = p.item_iid
        )
      GROUP BY item_iid 
      HAVING count >= 20
      LIMIT 1
  ` as any;

  const groupBy2 = await query;

  const convertedGroupBy: { name: string; count: number; addedAt: Date; totalCount: number }[] =
    groupBy2.map((x: any) => ({
      name: x.name,
      count: Number(x.count),
      addedAt: new Date(x.addedAt),
      totalCount: Number(x.full_count),
    }));

  if (convertedGroupBy.length === 0) return res.status(200).json({ totalQueue: 0 });

  return res.status(200).json({ totalQueue: convertedGroupBy[0].totalCount });
};

const POST = async (req: NextApiRequest, res: NextApiResponse) => {
  let limit = Number(req.body.limit);
  limit = isNaN(limit) ? 10000 : limit;

  const checkPopular = req.body.checkPopular === 'true';

  let groupByLimit = Number(req.body.groupByLimit);
  groupByLimit = isNaN(groupByLimit) ? 1000 : groupByLimit;

  let page = Number(req.body.page);
  page = isNaN(page) ? 0 : page;

  const maxDate = new Date(Date.now() - MAX_DAYS * 24 * 60 * 60 * 1000);
  const maxDateFormated = maxDate.toISOString().split('T')[0];

  const maxPast = new Date(Date.now() - MAX_PAST_DAYS * 24 * 60 * 60 * 1000);
  const maxPastFormated = maxPast.toISOString().split('T')[0];

  const lastDays = new Date(Date.now() - MIN_LAST_UPDATE * 24 * 60 * 60 * 1000);
  const lastDaysFormated = lastDays.toISOString().split('T')[0];

  let query = prisma.$queryRaw`
    SELECT item_iid, COUNT(*) as count, MAX(addedAt) as MAX_addedAt FROM PriceProcess2 p
    WHERE 
      addedAt >= ${maxPastFormated} AND
      processed = 0 AND
      NOT EXISTS (
        SELECT 1 FROM ItemPrices a WHERE 
        a.addedAt >= ${lastDaysFormated}
        and a.item_iid = p.item_iid 
      ) AND
      NOT EXISTS (
        SELECT 1 FROM PriceProcessHistory b WHERE
        b.item_iid = p.item_iid
      )
    GROUP BY item_iid 
    HAVING count >= 10 OR (MAX_addedAt <= ${maxDateFormated} and count >= 3)
    ORDER BY MAX_addedAt asc
    LIMIT ${groupByLimit} OFFSET ${page * groupByLimit}
  ` as any;

  if (checkPopular)
    query = prisma.$queryRaw`
      SELECT item_iid, COUNT(*) as count FROM PriceProcess2 p
        WHERE 
          addedAt >= ${lastDaysFormated} AND
          processed = 0 AND
          EXISTS (
            SELECT 1 FROM ItemPrices a WHERE 
            a.addedAt >= ${lastDaysFormated}
            and a.item_iid = p.item_iid 
          ) AND
          NOT EXISTS (
            SELECT 1 FROM PriceProcessHistory b WHERE
            b.item_iid = p.item_iid
          )
        GROUP BY item_iid 
        HAVING count >= 30
        ORDER BY count desc
        LIMIT ${groupByLimit} OFFSET ${page * groupByLimit}
    ` as any;

  const groupBy2 = await query;

  const convertedGroupBy: { item_iid: number; count: number; MAX_addedAt: Date }[] = groupBy2.map(
    (x: any) => ({
      item_iid: x.item_iid,
      count: Number(x.count),
      addedAt: new Date(x.MAX_addedAt),
    })
  );

  let total = 0;
  const ids: number[] = [];

  for (const rawItem of convertedGroupBy) {
    if (total >= limit) break;

    ids.push(rawItem.item_iid);
    total += rawItem.count;
  }

  const processList = await prisma.priceProcess2.findMany({
    where: {
      processed: false,
      item_iid: { in: ids },
      addedAt: { gte: maxPast },
    },
  });

  const priceAddPromises: Promise<Prisma.ItemPricesUncheckedCreateInput | undefined>[] = [];
  const processedIDs: number[] = [];

  // list of unique entries

  for (const itemId of ids) {
    const allItemData = processList.filter((x) => x.item_iid === itemId);
    const item = allItemData[0];

    try {
      const newPriceAlgorithm = processPrices2(allItemData);

      if (!newPriceAlgorithm) continue;

      const allIDs = allItemData
        .filter((x) => x.addedAt <= newPriceAlgorithm.latestDate)
        .map((x) => x.internal_id);

      priceAddPromises.push(
        updateOrAddDB(
          item,
          newPriceAlgorithm.price,
          newPriceAlgorithm.usedIds,
          newPriceAlgorithm.latestDate,
          newPriceAlgorithm?.price
        ).then((_) => {
          if (_) processedIDs.push(...allIDs);
          return _;
        })
      );
    } catch (e) {
      console.error(e, item);
      if (e === 'NaN price') continue;
      throw e;
    }
  }

  const priceAddList = (await Promise.all(priceAddPromises)).filter((x) => !!x) as ItemPrices[];

  const result = await prisma.$transaction([
    prisma.itemPrices.createMany({ data: priceAddList }),
    prisma.priceProcess2.updateMany({
      data: { processed: true },
      where: {
        internal_id: { in: processedIDs },
      },
    }),
  ]);

  const manualCheckList = priceAddList.filter((x) => x.manual_check).map((x) => x.item_iid);

  await prisma.priceProcessHistory.createMany({
    data: ids.map((x) => ({
      item_iid: x,
    })),

    skipDuplicates: true,
  });

  return res.send({
    priceUpdate: result[0],
    priceProcessed: result[1],
    manualCheck: manualCheckList,
  });
};

const DELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const today = new Date().getDate();

  // only clean up every 15 days
  if ((today % 15) - 1 !== 0) {
    const result = await prisma.priceProcessHistory.deleteMany({});
    return res.send(result);
  }

  const result = await Promise.all([
    prisma.priceProcessHistory.deleteMany({}),
    prisma.priceProcess2.deleteMany({
      where: {
        OR: [
          {
            processed: true,
            addedAt: {
              lt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
            },
          },
          {
            addedAt: {
              lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            },
          },
        ],
      },
    }),
  ]);

  const formatedErase = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  await prisma.$executeRaw`
    delete from priceprocess2 p 
    where 
      exists (select 1 from itemprices i where i.addedAt > p.addedAt and i.item_iid = p.item_iid) and
      addedAt < ${formatedErase}
  `;

  return res.send(result);
};

async function updateOrAddDB(
  priceData: PriceProcess2,
  priceValue: number,
  usedIDs: number[],
  latestDate: Date,
  priceValue2?: number
): Promise<Prisma.ItemPricesUncheckedCreateInput | undefined> {
  const newPriceData = {
    name: 'priceprocess2',
    item_iid: priceData.item_iid,
    price: priceValue >= Math.pow(2, 31) ? Math.pow(2, 31) - 1 : priceValue,
    newPrice: priceValue2 ?? null,
    manual_check: null,
    addedAt: latestDate,
    usedProcessIDs: usedIDs.toString(),
  } as Prisma.ItemPricesUncheckedCreateInput;

  try {
    if (!priceData.item_iid) throw 'invalid data';

    const oldPrice = await prisma.itemPrices.findFirst({
      where: {
        item_iid: newPriceData.item_iid,
      },
      orderBy: { addedAt: 'desc' },
    });

    if (!oldPrice) return newPriceData;

    const daysSinceLastUpdate = differenceInCalendarDays(latestDate, oldPrice.addedAt);
    const variation = coefficientOfVariation([oldPrice.price, priceValue]);
    const priceDiff = Math.abs(oldPrice.price - priceValue);

    if (daysSinceLastUpdate <= 1) return undefined;

    if (latestDate < oldPrice.addedAt) {
      return undefined;
    }

    if (daysSinceLastUpdate < 3 && priceDiff < 100000) return undefined;

    if (daysSinceLastUpdate < MIN_LAST_UPDATE && variation < 30 && priceDiff < 25000)
      return undefined;

    if ((variation <= 5 || priceDiff < 5000) && daysSinceLastUpdate <= 15) return undefined;

    if (!oldPrice.noInflation_id && priceDiff >= 75000) {
      if (oldPrice.price < priceValue && variation >= 75) {
        newPriceData.noInflation_id = oldPrice.internal_id;
        throw 'inflation';
      }

      if (oldPrice.price < priceValue && priceValue >= 100000 && variation >= 50) {
        newPriceData.noInflation_id = oldPrice.internal_id;
        throw 'inflation';
      }
    }

    // update an inflated price
    if (oldPrice.noInflation_id) {
      const lastNormalPrice = await prisma.itemPrices.findUniqueOrThrow({
        where: { internal_id: oldPrice.noInflation_id },
      });
      // const daysWithInflation = differenceInCalendarDays(latestDate, lastNormalPrice.addedAt);
      const inflationVariation = coefficientOfVariation([lastNormalPrice.price, priceValue]);

      newPriceData.noInflation_id = oldPrice.noInflation_id;

      if (
        priceValue <= 75000 ||
        // (daysWithInflation >= 60 && variation < 30) ||
        (priceValue > 75000 && inflationVariation < 75) ||
        (priceValue >= 100000 && inflationVariation < 50) ||
        lastNormalPrice.price >= priceValue
      )
        newPriceData.noInflation_id = null;
    }

    return newPriceData;
  } catch (e) {
    if (typeof e !== 'string') throw e;

    // if (e === 'inflation') return newPriceData;

    return {
      ...newPriceData,
      manual_check: e,
    };
  }
}
