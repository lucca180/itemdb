/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import { genItemKey, coefficientOfVariation } from '../../../../utils/utils';
import { geometricMean, standardDeviation } from 'simple-statistics';
import { ItemPrices, PriceProcess } from '@prisma/client';
import { differenceInCalendarDays } from 'date-fns';

const MAX_DAYS = 15;

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    return res.status(200).json({});
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const limitDate = Date.now() - MAX_DAYS * 24 * 60 * 60 * 1000;
  const limitDateFormated = new Date(limitDate).toISOString();

  const groupBy = await prisma.priceProcess.groupBy({
    by: ['name'],
    where: {
      NOT: { type: { in: ['restock', 'auction'] } },
      processed: false,
    },
    _count: {
      name: true,
    },
    _max: {
      addedAt: true,
    },
    having: {
      OR: [
        {
          name: {
            _count: {
              gt: 3,
            },
          },
        },
        {
          addedAt: {
            _max: {
              lt: limitDateFormated,
            },
          },
        },
      ],
    },
  });

  const names = groupBy.map((x) => x.name);

  const processList = await prisma.priceProcess.findMany({
    where: {
      processed: false,
      NOT: { type: { in: ['restock', 'auction'] } },
      name: { in: names },
    },
    orderBy: {
      addedAt: 'desc',
    },
  });

  const priceAddPromises: Promise<ItemPrices | undefined>[] = [];
  const processedIDs: number[] = [];

  // list of unique entries
  const uniqueNames = [...processList].filter(
    (value, index, self) =>
      index === self.findIndex((t) => genItemKey(t, true) === genItemKey(value, true))
  );

  for (const item of uniqueNames) {
    try {
      const allItemData = processList.filter((x) => genItemKey(x, true) === genItemKey(item, true));
      const owners = allItemData.map((o) => o.owner);

      if (allItemData.length === 0) continue;

      // merge all reports data
      for (const itemOtherData of allItemData) {
        //@ts-ignore
        for (const key of Object.keys(item)) item[key] ||= itemOtherData[key] ?? item[key];
      }

      const filteredResult = allItemData
        .filter(
          (a, index) =>
            !owners.includes(a.owner, index + 1) &&
            (a.type !== 'auction' || !a.otherInfo?.split(',').includes('nobody'))
        )
        .sort((a, b) => a.price - b.price)
        .slice(0, 20);

      if (filteredResult.length <= 1) continue;
      let latestDate = new Date(0);

      const usedIDs = filteredResult.map((o) => {
        if (o.addedAt > latestDate) latestDate = o.addedAt;
        return o.internal_id;
      });

      const allIDs = allItemData.filter((x) => x.addedAt <= latestDate).map((x) => x.internal_id);

      if (filteredResult.length < 3 && differenceInCalendarDays(Date.now(), latestDate) < MAX_DAYS)
        continue;

      const prices = filteredResult.map((x) => x.price);

      let priceSTD = standardDeviation(prices);
      let priceMean = Math.round(geometricMean(prices));

      let oldPrices = prices;

      let out = prices.filter((x) => x <= priceMean + priceSTD && x >= priceMean - priceSTD * 2.5);

      while (out.length > 10 && out.length < oldPrices.length) {
        oldPrices = out;
        priceMean = Math.round(geometricMean(out));
        priceSTD = standardDeviation(out);

        out = prices.filter((x) => x <= priceMean + priceSTD && x >= priceMean - priceSTD * 2.5);
      }

      const finalMean = out.length >= 2 ? geometricMean(out) : out[0];

      if (isNaN(finalMean)) throw 'NaN price';

      let finalPrice = finalMean < 5 ? Math.round(finalMean) : Math.round(finalMean / 5) * 5;
      if (finalPrice > 10000) finalPrice = Math.round(finalMean / 50) * 50;
      if (finalPrice > 100000) finalPrice = Math.round(finalMean / 500) * 500;
      if (finalPrice > 1000000) finalPrice = Math.round(finalMean / 50000) * 50000;

      priceAddPromises.push(
        updateOrAddDB(item, finalPrice, usedIDs, latestDate).then((_) => {
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
    prisma.priceProcess.updateMany({
      data: { processed: true },
      where: {
        internal_id: { in: processedIDs },
      },
    }),
  ]);

  return res.send({ priceUpdate: result[0], priceProcessed: result[1] });
}

async function updateOrAddDB(
  priceData: PriceProcess,
  priceValue: number,
  usedIDs: number[],
  latestDate: Date
): Promise<ItemPrices | undefined> {
  const newPriceData = {
    name: priceData.name,
    item_id: priceData.item_id,
    image_id: priceData.image_id,
    price: priceValue,
    manual_check: null,
    addedAt: latestDate,
    usedProcessIDs: usedIDs.toString(),
  } as ItemPrices;

  try {
    if (!priceData.image_id && !priceData.name && !priceData.item_id) throw 'invalid data';

    const item = await prisma.items.findFirst({
      where: {
        OR: [
          { item_id: priceData.item_id ?? undefined },
          {
            name: priceData.name,
            image_id: priceData.image_id ?? undefined,
          },
        ],
      },
    });

    if (!item) return undefined;

    newPriceData.item_iid = item.internal_id;

    const oldPrice = await prisma.itemPrices.findFirst({
      where: {
        item_iid: item.internal_id,
      },
      orderBy: { addedAt: 'desc' },
    });

    if (!oldPrice) return newPriceData;

    const daysSinceLastUpdate = differenceInCalendarDays(latestDate, oldPrice.addedAt);

    // last update less than 1 week ago or data is older than current
    if (daysSinceLastUpdate < 7) return undefined;
    if (latestDate < oldPrice.addedAt) {
      throw 'old data';
    }

    const variation = coefficientOfVariation([oldPrice.price, priceValue]);

    if (variation < 4 && daysSinceLastUpdate < 15) return undefined;

    if (!oldPrice.noInflation_id && priceValue > 20000) {
      if (oldPrice.price < priceValue && variation >= 65) {
        newPriceData.noInflation_id = oldPrice.internal_id;
        throw 'inflation';
      }

      if (oldPrice.price < priceValue && priceValue > 100000 && variation >= 50) {
        newPriceData.noInflation_id = oldPrice.internal_id;
        throw 'inflation';
      }
    }

    // update an inflated price
    if (oldPrice.noInflation_id) {
      const lastNormalPrice = await prisma.itemPrices.findUniqueOrThrow({
        where: { internal_id: oldPrice.noInflation_id },
      });
      const daysWithInflation = differenceInCalendarDays(Date.now(), lastNormalPrice.addedAt);
      const inflationVariation = coefficientOfVariation([lastNormalPrice.price, priceValue]);

      newPriceData.noInflation_id = oldPrice.noInflation_id;

      if (
        (daysWithInflation >= 60 && variation < 30) ||
        inflationVariation < 50 ||
        lastNormalPrice.price >= priceValue
      )
        newPriceData.noInflation_id = null;
    }

    return newPriceData;
  } catch (e) {
    if (typeof e !== 'string') throw e;

    return {
      ...newPriceData,
      manual_check: e,
    };
  }
}
