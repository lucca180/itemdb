import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { ItemPrices, PriceProcess2, Prisma } from '@prisma/generated/client';
import { differenceInCalendarDays } from 'date-fns';
import { processPrices3, type PriceSignals, type PriceSkipReason } from '@utils/prices/pricing3';
import { handleInflation, PRICING, shouldUpdatePrice } from '@utils/prices/process-helpers';
import pMap from 'p-map';

export const MAX_DAYS = 30;
export const MAX_PAST_DAYS = 60;

// Caps parallel updateOrAddDB calls per POST so a single processing run
// cannot exhaust the MariaDB pool (connectionLimit is per PM2 worker).
const PRICE_PROCESS_DB_CONCURRENCY = 5;

const TARNUM_KEY = process.env.TARNUM_KEY;

const MIN_LAST_UPDATE = PRICING.MIN_LAST_UPDATE;

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

  const { priceUpdate, priceProcessed, manualCheck } = await doProcessPrices(processList, ids);

  return res.send({
    priceUpdate,
    priceProcessed,
    manualCheck,
  });
};

const DELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const history = await prisma.priceProcessHistory.deleteMany({});
  const priceProcess2 = await cleanupPriceProcess();

  return res.send({ priceProcessHistory: history.count, priceProcess2 });
};

// Each statement has to stay far below the pool statement timeout (a single big DELETE gets
// killed and rolled back, deleting nothing), so the cleanup runs in small LIMIT batches.
const CLEANUP_BATCH_SIZE = 5000;
// Keeps the whole request under the proxy timeout; what is left is picked up by the next call.
const CLEANUP_TIME_BUDGET_MS = 75 * 1000;

/**
 * Deletes stale PriceProcess2 rows in batches until nothing is left to delete or the time
 * budget runs out. Safe to call as often as wanted, `done: false` means there is more to do.
 */
export const cleanupPriceProcess = async (timeBudgetMs = CLEANUP_TIME_BUDGET_MS) => {
  const deadline = Date.now() + timeBudgetMs;
  const dayMs = 24 * 60 * 60 * 1000;

  const maxAgeCutoff = new Date(Date.now() - (MAX_PAST_DAYS + 7) * dayMs);
  const processedCutoff = new Date(Date.now() - 45 * dayMs);
  const supersededCutoff = new Date(Date.now() - 30 * dayMs);

  const limit = Prisma.raw(String(CLEANUP_BATCH_SIZE));

  const steps = {
    // anything older than the max lookback is useless, processed or not
    expired: () =>
      prisma.$executeRaw`DELETE FROM PriceProcess2 WHERE addedAt < ${maxAgeCutoff} LIMIT ${limit}`,
    processed: () =>
      prisma.$executeRaw`
        DELETE FROM PriceProcess2
        WHERE processed = true AND addedAt < ${processedCutoff}
        LIMIT ${limit}
      `,
    // rows older than a newer price of the same item
    superseded: () =>
      prisma.$executeRaw`
        DELETE FROM PriceProcess2
        WHERE addedAt < ${supersededCutoff}
          AND EXISTS (
            SELECT 1 FROM ItemPrices i
            WHERE i.item_iid = PriceProcess2.item_iid AND i.addedAt > PriceProcess2.addedAt
          )
        LIMIT ${limit}
      `,
  };

  const deleted = { expired: 0, processed: 0, superseded: 0 };

  for (const step of Object.keys(steps) as (keyof typeof steps)[]) {
    let count: number;
    do {
      if (Date.now() >= deadline) return { ...deleted, done: false };

      count = await steps[step]();
      deleted[step] += count;
    } while (count >= CLEANUP_BATCH_SIZE);
  }

  return { ...deleted, done: true };
};

export const doProcessPrices = async (
  processList: PriceProcess2[],
  ids: number[],
  forceMode = false
) => {
  const processedIDs: number[] = [];
  // per-item reason the algorithm produced no price row, additive — the bulk/cron
  // caller ignores this field, only the admin force-run path reads it.
  const reasons: Record<number, PriceSkipReason | 'error'> = {};

  // list of unique entries
  const priceAddResults = await pMap(
    ids,
    async (itemId) => {
      const allItemData = processList.filter((x) => x.item_iid === itemId);
      const item = allItemData[0];

      let newPrice: ReturnType<typeof processPrices3>;
      try {
        newPrice = processPrices3(allItemData, forceMode);
      } catch (e) {
        console.error(e, item);
        if (e === 'NaN price') {
          reasons[itemId] = 'error';
          return undefined;
        }
        throw e;
      }

      if ('reason' in newPrice) {
        reasons[itemId] = newPrice.reason;
        return undefined;
      }

      const allIDs = allItemData
        .filter((x) => x.addedAt <= newPrice!.latestDate)
        .map((x) => x.internal_id);

      try {
        const result = await updateOrAddDB(
          item,
          newPrice.price,
          allItemData.map((x) => x.internal_id),
          newPrice.latestDate,
          forceMode,
          newPrice.signals
        );

        if ('reason' in result) {
          reasons[itemId] = result.reason;
          return undefined;
        }

        processedIDs.push(...allIDs);
        return result.data;
      } catch (e) {
        // mirror the previous Promise.allSettled behavior: skip failed DB writes
        console.error(e, item);
        reasons[itemId] = 'error';
        return undefined;
      }
    },
    { concurrency: PRICE_PROCESS_DB_CONCURRENCY }
  );

  const priceAddList = priceAddResults.filter((x) => !!x) as ItemPrices[];

  const updatedIDs = priceAddList
    .filter((x) => !!x && !x.manual_check)
    .map((x) => x.item_iid ?? -1);

  const result = await prisma.$transaction([
    prisma.itemPrices.updateMany({
      where: {
        item_iid: { in: updatedIDs },
        isLatest: true,
      },
      data: {
        isLatest: null,
      },
    }),
    prisma.itemPrices.createMany({ data: priceAddList, skipDuplicates: true }),
  ]);

  await prisma.priceProcess2.updateMany({
    data: { processed: true },
    where: {
      internal_id: { in: processedIDs },
    },
  });

  const manualCheckList = priceAddList.filter((x) => x.manual_check).map((x) => x.item_iid);

  await prisma.priceProcessHistory.createMany({
    data: ids.map((x) => ({
      item_iid: x,
    })),

    skipDuplicates: true,
  });

  return {
    priceUpdate: result[0],
    priceProcessed: result[1],
    manualCheck: manualCheckList,
    priceAddList,
    reasons,
  };
};

type UpdateOrAddResult =
  { data: Prisma.ItemPricesUncheckedCreateInput } | { reason: PriceSkipReason };

async function updateOrAddDB(
  priceData: PriceProcess2,
  priceValue: number,
  usedIDs: number[],
  latestDate: Date,
  forceMode = false,
  signals?: PriceSignals
): Promise<UpdateOrAddResult> {
  let newPriceData: Prisma.ItemPricesUncheckedCreateInput = {
    item_iid: priceData.item_iid,
    price: priceValue,
    manual_check: null,
    isLatest: true,
    addedAt: latestDate,
    usedProcessIDs: usedIDs.toString(),
  };

  try {
    if (!priceData.item_iid) throw 'invalid data';

    const priceHistory = await prisma.itemPrices.findMany({
      where: {
        item_iid: priceData.item_iid,
      },
      orderBy: { addedAt: 'desc' },
      select: {
        price: true,
        addedAt: true,
        internal_id: true,
        noInflation_id: true,
        manual_check: true,
      },
      take: 40,
    });

    const oldPriceRaw = priceHistory[0] || null;

    if (!oldPriceRaw) {
      const item = await prisma.items.findFirst({ where: { internal_id: priceData.item_iid } });

      // do not add prices for new items
      if (differenceInCalendarDays(latestDate, item!.addedAt) < 2) return { reason: 'new_item' };

      return { data: newPriceData };
    }

    const decision = shouldUpdatePrice({ latestDate, priceHistory, priceValue, forceMode });
    if (!decision.update) return { reason: decision.reason };

    const result = await handleInflation({
      latestDate,
      priceHistory,
      priceValue,
      newPriceData,
      signals,
      forceMode,
    });

    newPriceData = result.newPriceData;

    if (result.isManualCheck) {
      throw result.msg;
    }

    return { data: newPriceData };
  } catch (e) {
    if (typeof e !== 'string') {
      console.error('PRICE PROCESS ERROR:', e);
      throw e;
    }

    // if (e === 'inflation') return newPriceData;

    return {
      data: {
        ...newPriceData,
        manual_check: e,
        isLatest: null,
      },
    };
  }
}
