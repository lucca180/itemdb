import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../utils/prisma';
import { genItemKey, coefficientOfVariation } from '../../../utils/utils';
import { harmonicMean, standardDeviation } from 'simple-statistics';
import { ItemPrices, PriceProcess } from '@prisma/client';
import { differenceInCalendarDays } from 'date-fns';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST')
    throw new Error(`The HTTP ${req.method} method is not supported at this route.`);

  const itemName = req.body.itemName as string;

  const processList = await prisma.priceProcess.findMany({
    where: {
      processed: false,
      NOT: { type: 'restock' },
      name: itemName ?? undefined,
    },
    orderBy: {
      addedAt: 'desc',
    },
    take: 300,
  });

  const priceAddPromises: Promise<ItemPrices | undefined>[] = [];
  const processedIDs: number[] = [];

  // list of unique entries
  const uniqueNames = [...processList].filter(
    (value, index, self) => index === self.findIndex((t) => genItemKey(t) === genItemKey(value))
  );

  for (const item of uniqueNames) {
    try {
      const allItemData = processList.filter((x) => genItemKey(x) === genItemKey(item));
      const owners = allItemData.map((o) => o.owner);

      if (allItemData.length === 0) continue;

      // merge all reports data
      for (const itemOtherData of allItemData) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        for (const key of Object.keys(item)) item[key] ??= itemOtherData[key];
      }

      const allIDs = allItemData.map((x) => x.internal_id);

      const filteredResult = allItemData
        .filter(
          (a, index) =>
            !owners.includes(a.owner, index + 1) &&
            (a.type !== 'auction' || !a.otherInfo?.split(',').includes('nobody'))
        )
        .sort((a, b) => a.price - b.price)
        .slice(0, 20);

      if (filteredResult.length === 0) continue;
      let latestDate = new Date(0);

      const usedIDs = filteredResult.map((o) => {
        if (o.addedAt > latestDate) latestDate = o.addedAt;
        return o.internal_id;
      });

      if (filteredResult.length < 5 && differenceInCalendarDays(Date.now(), latestDate) < 30)
        continue;

      const prices = filteredResult.map((x) => x.price);

      let priceSTD = standardDeviation(prices);
      let priceMean = Math.round(harmonicMean(prices));

      let oldPrices = prices;

      let out = prices.filter((x) => x <= priceMean + priceSTD && x >= priceMean - priceSTD * 3);

      while (out.length > 3 && out.length < oldPrices.length) {
        oldPrices = out;
        priceMean = Math.round(harmonicMean(out));
        priceSTD = standardDeviation(out);

        out = prices.filter((x) => x <= priceMean + priceSTD && x >= priceMean - priceSTD * 3);
      }

      let finalPrice =
        harmonicMean(out) < 5
          ? Math.round(harmonicMean(out))
          : Math.round(harmonicMean(out) / 5) * 5;
      if (finalPrice > 10000) finalPrice = Math.round(harmonicMean(out) / 50) * 50;
      if (finalPrice > 100000) finalPrice = Math.round(harmonicMean(out) / 500) * 500;
      if (finalPrice > 1000000) finalPrice = Math.round(harmonicMean(out) / 50000) * 50000;

      priceAddPromises.push(
        updateOrAddDB(item, finalPrice, usedIDs, latestDate).then((_) => {
          if (_) processedIDs.push(...allIDs);
          return _;
        })
      );
    } catch (e) {
      console.error(e, item);
      throw e;
    }
  }

  const priceAddList = (await Promise.all(priceAddPromises)).filter((x) => !!x) as ItemPrices[];
  const result = await prisma.itemPrices.createMany({ data: priceAddList });

  const resultUpdate = await prisma.priceProcess.updateMany({
    data: { processed: true },
    where: {
      internal_id: { in: processedIDs },
    },
  });

  return res.send({ priceUpdate: result, priceProcessed: resultUpdate });
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

    const oldPrice = await prisma.itemPrices.findFirst({
      where: {
        OR: [
          { item_id: priceData.item_id ?? -1 },
          {
            name: priceData.name,
            image_id: priceData.image_id ?? '-1',
          },
        ],
      },
      orderBy: { addedAt: 'desc' },
    });

    if (!oldPrice) return newPriceData;

    const daysSinceLastUpdate = differenceInCalendarDays(Date.now(), oldPrice.addedAt);

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
