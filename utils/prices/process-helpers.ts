import { Prisma } from '@prisma/generated/client';
import { Decimal } from '@prisma/client/runtime/client';
import { coefficientOfVariation } from '@utils/utils';
import { differenceInCalendarDays } from 'date-fns';
import { mean, standardDeviation } from 'simple-statistics';
import prisma from '@utils/prisma';
import { LogService } from '@services/ActionLogService';

const EVENT_MODE = process.env.EVENT_MODE === 'true';

export const PRICING = {
  MIN_INFLATION_DIFF: 90000,
  MIN_LAST_UPDATE: EVENT_MODE ? 3 : 5,
  MIN_Z_SCORE: 4,
} as const;

// for a given number, calculate z-score
export const zScore = (x: number, data: number[]) => {
  if (data.length < PRICING.MIN_Z_SCORE) return 0;

  const meanVal = mean(data);
  const stdVal = standardDeviation(data);
  if (stdVal === 0) return 0;

  return (x - meanVal) / stdVal;
};

type ShouldUpdateProps = {
  latestDate: Date;
  priceHistory: {
    addedAt: Date;
    price: Decimal;
    noInflation_id: number | null;
    internal_id: number;
    manual_check: string | null;
  }[];
  priceValue: number;
  forceMode?: boolean;
};

export const shouldUpdatePrice = (args: ShouldUpdateProps) => {
  const { latestDate, priceHistory, priceValue } = args;
  let { forceMode } = args;

  const oldPriceRaw = priceHistory[0];
  const oldPrice = oldPriceRaw.price.toNumber();
  const isPendingCheck = !!oldPriceRaw?.manual_check;
  const isInflation = !!oldPriceRaw.noInflation_id;

  const daysSinceLastUpdate = differenceInCalendarDays(latestDate, oldPriceRaw.addedAt);

  // get all price history except the current price and convert to number
  const prices = priceHistory.map((x) => x.price.toNumber()).slice(1);

  // ---------- Z-SCORE VERSION ---------- //
  if (prices.length >= PRICING.MIN_Z_SCORE) {
    const zOld = zScore(oldPrice, prices);
    const zNew = zScore(priceValue, prices);
    const zDiff = Math.abs(zOld - zNew);

    forceMode = forceMode || isPendingCheck;

    if (!forceMode && daysSinceLastUpdate <= 1) return false;

    if (latestDate < oldPriceRaw.addedAt) return false;

    if (!forceMode && daysSinceLastUpdate < PRICING.MIN_LAST_UPDATE && zDiff <= 1) return false;

    /*
      ignore small variations
        don't ignore if event mode is active
        or if the price is inflated
        or if force mode is active
      */
    if (zDiff <= 1.5 && daysSinceLastUpdate <= 15 && !EVENT_MODE && !isInflation && !forceMode)
      return false;

    return true;
  }

  // ---------- LEGACY VERSION ---------- //

  const variation = coefficientOfVariation([oldPrice, priceValue]);
  const priceDiff = Math.abs(oldPrice - priceValue);

  forceMode = forceMode || isPendingCheck;

  if (!forceMode && daysSinceLastUpdate <= 1) return false;

  if (latestDate < oldPriceRaw.addedAt) {
    return false;
  }

  if (!forceMode && daysSinceLastUpdate < 3 && priceDiff < 100000) return false;

  if (
    !forceMode &&
    daysSinceLastUpdate < PRICING.MIN_LAST_UPDATE &&
    variation < 30 &&
    priceDiff < 25000
  )
    return false;

  /*
      ignore small variations
      don't ignore if event mode is active
      or if the price is inflated
      or if force mode is active
    */
  if (
    (variation <= 5 || priceDiff < 2500) &&
    daysSinceLastUpdate <= 15 &&
    !EVENT_MODE &&
    !isInflation &&
    !forceMode
  )
    return false;

  return true;
};

export type handleInflationArgs = {
  newPriceData: Prisma.ItemPricesUncheckedCreateInput;
  latestDate: Date;
  priceHistory: {
    addedAt: Date;
    price: Decimal;
    noInflation_id: number | null;
    internal_id: number;
    manual_check: string | null;
  }[];
  priceValue: number;
};

type handleInflationReturn = {
  newPriceData: Prisma.ItemPricesUncheckedCreateInput;
  isManualCheck: boolean;
  msg: string | null;
};

export const handleInflation = async (
  args: handleInflationArgs
): Promise<handleInflationReturn> => {
  const { latestDate, priceHistory, priceValue, newPriceData } = args;

  const prices = priceHistory.map((x) => x.price.toNumber()).slice(1);

  const oldPriceRaw = priceHistory[0];
  const oldPrice = oldPriceRaw.price.toNumber();
  const priceDiff = Math.abs(oldPrice - priceValue);

  const isInflation = !!oldPriceRaw.noInflation_id;

  const zNew = zScore(priceValue, prices);
  const variation = coefficientOfVariation([oldPrice, priceValue]);

  const hasZScores = prices.length >= PRICING.MIN_Z_SCORE && standardDeviation(prices) > 0;

  // ---------- Z-SCORE VERSION ---------- //

  if (hasZScores) {
    if (!isInflation && priceDiff >= PRICING.MIN_INFLATION_DIFF && zNew > 2.5) {
      newPriceData.noInflation_id = oldPriceRaw.internal_id;
      return {
        msg: 'inflation',
        isManualCheck: true,
        newPriceData,
      };
    }
  }

  // ---------- LEGACY VERSION ---------- //
  if (!hasZScores) {
    if (!isInflation && priceDiff >= PRICING.MIN_INFLATION_DIFF) {
      if (oldPrice < priceValue && variation >= 75) {
        newPriceData.noInflation_id = oldPriceRaw.internal_id;
        return {
          msg: 'inflation',
          isManualCheck: true,
          newPriceData,
        };
      }

      if (oldPrice < priceValue && priceValue >= 100000 && variation >= 50) {
        newPriceData.noInflation_id = oldPriceRaw.internal_id;
        return {
          msg: 'inflation',
          isManualCheck: true,
          newPriceData,
        };
      }
    }
  }
  // ---------- END OF LEGACY VERSION ---------- //

  // update an inflated price
  if (isInflation) {
    const lastNormalPriceRaw = priceHistory.find(
      (x) => x.internal_id === oldPriceRaw.noInflation_id
    );

    if (!lastNormalPriceRaw)
      return {
        msg: 'inflation without normal price',
        isManualCheck: true,
        newPriceData,
      };

    const lastNormalPrice = lastNormalPriceRaw.price.toNumber();

    const daysWithInflation = differenceInCalendarDays(latestDate, lastNormalPriceRaw.addedAt);
    const normalZScore = zScore(lastNormalPrice, prices);
    const zDiffNormal = Math.abs(zNew - normalZScore);
    const percentDiff = Math.abs(priceValue - lastNormalPrice) / lastNormalPrice;

    const inflationDiff = priceValue - lastNormalPrice;

    newPriceData.noInflation_id = oldPriceRaw.noInflation_id;

    const pricesWithInflation = priceHistory.filter(
      (x) =>
        x.addedAt > lastNormalPriceRaw.addedAt &&
        x.noInflation_id === lastNormalPriceRaw.internal_id
    );

    // --------- Z-SCORE VERSION ---------- //
    if (hasZScores) {
      const priceIsNearNormal = zDiffNormal < 2.5 && percentDiff < 0.2;

      if (
        inflationDiff <= PRICING.MIN_INFLATION_DIFF ||
        (daysWithInflation >= 60 && zNew < 2.5 && pricesWithInflation.length >= 3) ||
        priceIsNearNormal ||
        lastNormalPrice >= priceValue
      )
        newPriceData.noInflation_id = null;
    }

    // --------- LEGACY VERSION ---------- //
    if (!hasZScores) {
      const inflationVariation = coefficientOfVariation([lastNormalPrice, priceValue]);

      if (
        inflationDiff <= PRICING.MIN_INFLATION_DIFF ||
        (daysWithInflation >= 60 && variation < 30 && pricesWithInflation.length >= 3) ||
        inflationVariation < 50 ||
        lastNormalPrice >= priceValue
      )
        newPriceData.noInflation_id = null;
    }
    // ---------- END OF LEGACY VERSION ---------- //
  }

  await handleAutoApproval({ ...args, newPriceData });

  return { newPriceData, isManualCheck: false, msg: null };
};

export const handleAutoApproval = async (args: handleInflationArgs) => {
  const { priceHistory, newPriceData, latestDate } = args;

  const oldPriceRaw = priceHistory[0];
  const isPendingCheck = !!oldPriceRaw?.manual_check;

  const daysSinceLastUpdate = differenceInCalendarDays(latestDate, oldPriceRaw.addedAt);

  // auto-approve inflation prices if the new price is also inflated
  if (isPendingCheck && newPriceData.noInflation_id) {
    await prisma.itemPrices.update({
      where: { internal_id: oldPriceRaw.internal_id },
      data: { manual_check: null },
    });

    await LogService.createLog(
      'inflationAutoApprove',
      {
        newPrice: Number(newPriceData.price),
        oldPrice: oldPriceRaw.price.toNumber(),
      },
      newPriceData.item_iid?.toString()
    );
  }

  // delete inflation price if the new price is normal and was added recently
  if (isPendingCheck && daysSinceLastUpdate <= 5 && !newPriceData.noInflation_id) {
    await prisma.itemPrices.delete({
      where: { internal_id: oldPriceRaw.internal_id },
    });

    await LogService.createLog(
      'inflationDelete',
      {
        newPrice: Number(newPriceData.price),
        oldPrice: oldPriceRaw.price.toNumber(),
      },
      newPriceData.item_iid?.toString()
    );
  }
};
