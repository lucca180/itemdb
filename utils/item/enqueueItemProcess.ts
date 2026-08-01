import { ItemType, Prisma } from '@prisma/generated/client';
import hash from 'object-hash';
import prisma from '@utils/prisma';
import { allCategories } from '@utils/allCats';
import {
  processItemProcessQueue,
  type ProcessItemQueueOptions,
  type ProcessItemQueueResult,
} from '@utils/item/processItemQueue';

export type EnqueueItemInput = {
  itemId?: number;
  item_id?: number;
  name: string;
  description?: string;
  img: string;
  category?: string;
  rarity?: number | string;
  estVal?: number | string;
  subText?: string;
  status?: string;
  type?: string;
  weight?: number | string;
  isBD?: boolean;
};

export type EnqueueItemsOptions = {
  language?: string;
  ipAddress?: string | null;
  meta?: {
    itemdbVersion?: string;
    dataSource?: string;
  };
};

export type EnqueueAndProcessResult = {
  enqueued: number;
  process: ProcessItemQueueResult;
};

/** Normalize incoming item payloads into ItemProcess rows (does not write). */
export function buildItemProcessRows(
  items: EnqueueItemInput[],
  options: EnqueueItemsOptions = {}
): Prisma.ItemProcessCreateManyInput[] {
  const language = options.language ?? 'en';
  const requestMeta = {
    itemdbVersion: options.meta?.itemdbVersion || 'direct-api',
    dataSource: options.meta?.dataSource || 'unknown',
  };

  const dataList: Prisma.ItemProcessCreateManyInput[] = [];

  for (const item of items) {
    let {
      itemId,
      item_id,
      name,
      description,
      img,
      category,
      rarity,
      estVal,
      subText,
      status,
      type,
      weight,
      isBD,
    } = item;
    let imageId: string | undefined = undefined;

    itemId = item_id ?? itemId;

    rarity = isNaN(Number(rarity)) ? undefined : Number(rarity);
    estVal = isNaN(Number(estVal)) ? undefined : Number(estVal);
    weight = isNaN(Number(weight)) ? undefined : Number(weight);
    itemId = isNaN(Number(itemId)) ? undefined : Number(itemId);

    if (!name || !img || /[\d\,\.]+\WNP/gm.test(name)) continue;

    if (img) img = (img as string).replace(/^[^\/\/\s]*\/\//gim, 'https://');
    if (!img.includes('images.neopets.com/items/')) continue;

    if (img) imageId = (img as string).match(/[^\.\/]+(?=\.gif)/)?.[0] ?? '';

    if (!imageId) continue;

    if (category === 'Neocash') {
      category = undefined;
      type = 'nc';
    }

    let specialTypes: string[] | string | undefined = [];

    if (subText) {
      if (
        subText.toLowerCase().includes('neocash') ||
        subText.toLowerCase().includes('artifact - 500')
      )
        type = 'nc';

      if (subText.toLowerCase().includes('no trade')) status = 'no trade';

      specialTypes = (subText as string).match(/(?<=\().+?(?=\))/gm) ?? [];
    }

    if (rarity === 500) type = 'nc';
    const isNC = type === 'nc' || rarity === 500;

    if (description?.includes('deluxe paint brush set')) type = 'pb';

    if (type === 'pb') status = 'no trade';

    status = status ?? 'active';

    specialTypes = specialTypes?.length > 0 ? specialTypes?.toString() : undefined;

    if (category && !allCategories.includes(category.toLowerCase())) continue;

    const row: Prisma.ItemProcessCreateManyInput = {
      item_id: itemId,
      name: name.trim(),
      description: description?.trim(),
      category: category,
      image: img,
      image_id: imageId,
      rarity: rarity ?? (isNC ? 500 : undefined),
      est_val: isNC && !estVal ? 0 : estVal,
      weight: isNC && !weight ? 1 : weight,
      status: status,
      type: (type as ItemType | undefined) ?? ItemType.np,
      isNC: isNC,
      isBD: isBD ?? undefined,
      specialType: specialTypes,
      isWearable: !!specialTypes?.includes('wearable'),
      language,
      ip_address: options.ipAddress ?? undefined,
      hash: '',
      meta: JSON.stringify(requestMeta),
    };

    row.hash = hash(row, {
      excludeKeys: (key: string) => ['ip_address', 'hash', 'meta'].includes(key),
    });

    dataList.push(row);
  }

  return dataList;
}

/** Insert normalized rows into ItemProcess (skipDuplicates). */
export async function enqueueItemsToProcess(
  items: EnqueueItemInput[],
  options: EnqueueItemsOptions = {}
): Promise<Prisma.BatchPayload> {
  const dataList = buildItemProcessRows(items, options);
  if (dataList.length === 0) return { count: 0 };

  let tries = 0;
  while (tries <= 3) {
    try {
      return await prisma.itemProcess.createMany({
        data: dataList,
        skipDuplicates: true,
      });
    } catch (e: any) {
      if (['P2034'].includes(e.code) && tries < 3) {
        tries++;
        continue;
      }
      throw e;
    }
  }

  throw new Error('Failed to enqueue items after retries');
}

/** Enqueue items into ItemProcess, then process the current queue. */
export async function enqueueAndProcessItems(
  items: EnqueueItemInput[],
  options: EnqueueItemsOptions & ProcessItemQueueOptions = {}
): Promise<EnqueueAndProcessResult> {
  const { limit, offset, checkAll, skipColors, language, ipAddress, meta } = options;

  const enqueued = await enqueueItemsToProcess(items, { language, ipAddress, meta });
  const process = await processItemProcessQueue({ limit, offset, checkAll, skipColors });

  return {
    enqueued: enqueued.count,
    process,
  };
}
