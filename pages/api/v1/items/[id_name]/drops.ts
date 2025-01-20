import type { NextApiRequest, NextApiResponse } from 'next';
import { getItem } from '.';
import { ItemDrop, ItemOpenable, PrizePoolData } from '../../../../../types';
import { CheckAuth } from '../../../../../utils/googleCloud';
import prisma from '../../../../../utils/prisma';
import { WearableData } from '@prisma/client';
import { revalidateItem } from './effects';

const catType = ['trinkets', 'accessories', 'clothing', 'le', 'choice'];
const catTypeZone = ['trinkets', 'accessories', 'clothing'];

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  if (req.method === 'PATCH') return PATCH(req, res);

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const id_name = req.query.id_name as string;
  const id = Number(id_name);

  const itemQuery = isNaN(id) ? id_name : id;

  const item = await getItem(itemQuery);
  if (!item) return res.status(400).json({ error: 'Item not found' });

  const [drops, parents] = await Promise.all([
    item.useTypes.canOpen !== 'false' ? getItemDrops(item.internal_id, item.isNC) : null,
    getItemParent(item.internal_id),
  ]);

  return res.status(200).json({ drops: drops, parents: parents });
}

const PATCH = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const user = (await CheckAuth(req)).user;

    if (!user || !user.isAdmin) return res.status(401).json({ error: 'Unauthorized' });
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const id_name = req.query.id_name as string;
  const id = Number(id_name);

  const itemQuery = isNaN(id) ? id_name : id;

  const item = await getItem(itemQuery);
  if (!item) return res.status(400).json({ error: 'Item not found' });

  const { drop_id, action, poolName } = req.body;

  if (!drop_id || !action || !poolName)
    return res.status(400).json({ error: 'Missing parameters' });

  if (action === 'add') {
    await prisma.openableItems.create({
      data: {
        parent_iid: item.internal_id,
        item_iid: drop_id,
        prizePool: poolName,
        opening_id: 'manual',
        isManual: true,
      },
    });
  }

  if (action === 'remove') {
    await prisma.openableItems.deleteMany({
      where: {
        parent_iid: item.internal_id,
        item_iid: drop_id,
        prizePool: poolName,
        opening_id: 'manual',
        isManual: true,
      },
    });
  }

  const newDrops = await getItemDrops(item.internal_id, item.isNC);

  await revalidateItem(item.slug!, res);

  return res.status(200).json({ dropUpdate: newDrops });
};

// ---------- helpers ---------- //
export const getItemDrops = async (
  item_iid: number,
  isNC = false
): Promise<ItemOpenable | null> => {
  const itemProm = prisma.items.findFirst({
    where: {
      internal_id: item_iid,
    },
  });

  const dropsProm = prisma.openableItems.findMany({
    where: {
      parent_iid: item_iid,
    },
  });

  const [item, drops] = await Promise.all([itemProm, dropsProm]);

  if (drops.length === 0 || !item || item.canOpen === 'false') return null;

  const prizePools: { [name: string]: PrizePoolData } = {};
  const dropsData: { [id: number]: ItemDrop } = {};
  const poolsData: { [id: string]: { [note: string]: number } } = {};

  const openingSet: { [id: string]: number[] } = {};

  const confimedDrops = new Set<string>();
  const allItemIds = new Set<number>();

  let hasManual = false;

  drops.map((drop) => {
    if (drop.opening_id === 'manual') {
      hasManual = true;
      return;
    }

    if (drop.notes?.includes('gramOption')) return;

    openingSet[drop.opening_id] = [...(openingSet[drop.opening_id] ?? []), drop.item_iid];
  });

  const openingCount = Object.keys(openingSet).length;

  if (openingCount < 5 && !hasManual) return null;

  const manualItems: number[] = [];
  let isChoice = false;
  let isZoneCat = false;
  let isGram = false;

  const hasGramInName = !!item?.name.toLowerCase().split(' ').includes('gram');

  drops
    .sort((a, b) => (a.notes?.length ?? 0) - (b.notes?.length ?? 0))
    .map((drop) => {
      allItemIds.add(drop.item_iid);
      const dropData: ItemDrop = {
        item_iid: drop.item_iid,
        dropRate: dropsData[drop.item_iid]?.dropRate ?? 0,
        notes: drop.notes,
        isLE: drop.limitedEdition,
        pool: dropsData[drop.item_iid]?.pool ?? null,
      };

      if (!drop.isManual) dropData.dropRate += 1;

      const pool = drop.prizePool?.toLowerCase();
      if (pool) {
        if (pool.includes('gram')) isGram = true;
        if (pool.split('-').includes('le')) dropData.isLE = true;

        if (!prizePools[pool]) {
          prizePools[pool] = {
            name: pool,
            isChance: pool.includes('chance'),
            items: [],
            openings: 0,
            maxDrop: 0,
            minDrop: 0,
            totalDrops: 0,
            isLE: pool.split('-').includes('le'),
          };
        }

        prizePools[pool].items.push(drop.item_iid);
        manualItems.push(drop.item_iid);
        dropData.pool = pool;
      }

      if (dropData.isLE) drop.notes = 'LE';

      const notesList = drop.notes?.toLowerCase().split(',') ?? [];
      notesList.map((note) => {
        let val = 1;

        if (notesList.length === 1) val = 10;
        if (catType.includes(note) || note.match(/cat\d+y\d+/gim) || note.match(/cat\d+/gim)) {
          if (note !== 'le') isChoice = true;
          if (catTypeZone.includes(note)) isZoneCat = true;

          if (!poolsData[drop.item_iid]) poolsData[drop.item_iid] = {};

          // there's a better place to do this, but it's a quick fix
          if (notesList.length === 2) {
            const oppening = openingSet[drop.opening_id];
            const otherItem = oppening.find((a) => a !== drop.item_iid);

            if (otherItem && poolsData[otherItem]) {
              const maxNoteVal = Math.max(...Object.values(poolsData[otherItem]));
              if (maxNoteVal >= 10 && poolsData[otherItem][note] < maxNoteVal) val = 10;
            }
          }

          poolsData[drop.item_iid][note] = poolsData[drop.item_iid][note]
            ? poolsData[drop.item_iid][note] + val
            : val;
        }
      });

      if (notesList.includes('gramOption') && hasGramInName) isGram = true;

      dropsData[drop.item_iid] = dropData;
    });

  const openableData: ItemOpenable = {
    openings: Object.values(openingSet).length,
    pools: prizePools,
    notes: null,
    drops: {},
    hasLE: false,
    isGBC: false,
    minDrop: 0,
    maxDrop: 0,
    isChoice: isChoice,
    isGram: isGram,
  };

  const zoneData = isZoneCat
    ? await prisma.wearableData.findMany({
        where: {
          item_iid: {
            in: Array.from(allItemIds),
          },
          isCanonical: true,
        },
      })
    : [];

  Object.values(dropsData)
    .filter((a) => manualItems.includes(a.item_iid) || a.dropRate >= (isNC ? 1 : 2))
    .map((drop) => {
      if (manualItems.includes(drop.item_iid)) return;

      const sortedCats = Object.entries(poolsData[drop.item_iid] ?? {})
        .filter((a) => !!a[0] && !!a[1])
        .sort((a, b) => b[1] - a[1]);

      let moreCommonCat = 'unknown';

      if (sortedCats.length > 0)
        moreCommonCat = sortedCats[0]?.[1] <= sortedCats[1]?.[1] ? 'unknown' : sortedCats[0][0];

      if (moreCommonCat === 'unknown' && isZoneCat) {
        const zone = zoneData.find((a) => a.item_iid === drop.item_iid);
        if (zone) moreCommonCat = zoneToCat(zone);
      }

      if (!prizePools[moreCommonCat])
        prizePools[moreCommonCat] = {
          name: moreCommonCat,
          items: [],
          isChance: false,
          openings: 0,
          maxDrop: 0,
          minDrop: 0,
          totalDrops: 0,
          isLE: moreCommonCat.toLowerCase() === 'le',
        };

      prizePools[moreCommonCat].items.push(drop.item_iid);
      drop.pool = moreCommonCat;
      dropsData[drop.item_iid] = drop;
    });

  let openingMinMax = {
    min: { val: 1000, repeat: 0, prev: 0, prevRepeat: 0 },
    max: { val: 0, repeat: 0, prev: 0, prevRepeat: 0 },
  };

  const ignoreItems = Object.values(dropsData)
    .filter((a) => !manualItems.includes(a.item_iid) && a.dropRate < (isNC ? 1 : 2))
    .map((a) => a.item_iid);

  Object.values(prizePools).map((pool) => {
    let minMax = {
      min: { val: 1000, repeat: 0, prev: 0, prevRepeat: 0 },
      max: { val: 0, repeat: 0, prev: 0, prevRepeat: 0 },
    };

    Object.entries(openingSet).map(([id, opening]) => {
      let drops = 0;
      for (const item of opening) {
        if (ignoreItems.includes(item)) continue;
        if (pool.items.includes(item)) drops++;
      }

      openingMinMax = getMinMax(
        opening.filter((x) => !ignoreItems.includes(x)).length,
        openingMinMax
      );

      if (drops === 0) return;

      pool.openings++;
      pool.totalDrops += drops;
      confimedDrops.add(id);

      minMax = getMinMax(drops, minMax);
    });

    if (!isGram) {
      pool.minDrop =
        minMax.min.repeat > 1 || !minMax.min.prevRepeat ? minMax.min.val : minMax.min.prev;
      pool.maxDrop =
        minMax.max.repeat > 1 || !minMax.max.prevRepeat ? minMax.max.val : minMax.max.prev;

      if (pool.minDrop === 1000) pool.minDrop = 0;
    }

    const manualMinMax = pool.name.match(/\d+-\d+/);
    if (manualMinMax) {
      const [min, max] = manualMinMax[0].split('-');
      pool.minDrop = Number(min);
      pool.maxDrop = Number(max);
    }

    if (
      !pool.isChance &&
      pool.openings / openingCount <= 0.9 &&
      (!openableData.isChoice || pool.name === 'le')
    )
      pool.isChance = true;
  });

  openableData.minDrop =
    openingMinMax.min.repeat > 1 || !openingMinMax.min.prevRepeat
      ? openingMinMax.min.val
      : openingMinMax.min.prev;
  openableData.maxDrop =
    openingMinMax.max.repeat > 1 || !openingMinMax.max.prevRepeat
      ? openingMinMax.max.val
      : openingMinMax.max.prev;

  if (openableData.minDrop === 1000) openableData.minDrop = 0;

  if (isGram) {
    openableData.minDrop = 1;
    openableData.maxDrop = 1;
  }

  Object.values(dropsData)
    .filter((a) => manualItems.includes(a.item_iid) || a.dropRate >= (isNC ? 1 : 2))
    .map((drop) => {
      const pool = prizePools[drop.pool ?? 'unknown'];

      const itemDropCount =
        pool.totalDrops -
        Object.values(dropsData)
          .filter((a) => a.pool === pool.name && a.dropRate / pool.openings >= 1)
          .reduce((a, b) => a + b.dropRate, 0);

      if (drop.isLE) {
        drop.notes = 'LE';
        openableData.hasLE = true;
      }

      let dropRate = isGram ? 0 : (drop.dropRate / itemDropCount) * 100;

      if (drop.dropRate / pool.openings >= 1 && !isGram) {
        if ([65354, 17434, 860].includes(drop.item_iid)) openableData.isGBC = true;
        dropRate = 100;
      }

      openableData.drops[drop.item_iid] = {
        ...drop,
        dropRate: dropRate,
      };
    });

  openableData.openings = confimedDrops.size;
  return openableData;
};

export const getItemParent = async (item_iid: number) => {
  const drops = await prisma.openableItems.findMany({
    where: {
      item_iid: item_iid,
      parent_item: {
        canOpen: {
          not: 'false',
        },
      },
    },
  });

  const parents: { [id: number]: number } = {};

  drops.map((drop) => {
    if (!drop.parent_iid) return;
    parents[drop.parent_iid] = parents[drop.parent_iid] ? parents[drop.parent_iid] + 1 : 1;
    if (drop.prizePool) parents[drop.parent_iid] += 10;
  });

  //discard parents with less than 3 drops
  const parentsArray = Object.entries(parents)
    .filter((a) => a[1] >= 2)
    .map((a) => Number(a[0]));

  return parentsArray;
};

type MinMax = {
  min: { val: number; repeat: number; prev: number; prevRepeat: number };
  max: { val: number; repeat: number; prev: number; prevRepeat: number };
};

const getMinMax = (drops: number, minMax: MinMax) => {
  if (drops < minMax.min.val) {
    minMax.min.prev = minMax.min.val;
    minMax.min.prevRepeat = minMax.min.repeat;
    minMax.min.val = drops;
    minMax.min.repeat = 1;
  } else if (drops === minMax.min.val) {
    minMax.min.repeat++;
  }

  if (drops === minMax.min.prev) {
    minMax.min.prevRepeat++;
  }

  if (drops > minMax.max.val) {
    minMax.max.prev = minMax.max.val;
    minMax.max.prevRepeat = minMax.max.repeat;
    minMax.max.val = drops;
    minMax.max.repeat = 1;
  } else if (drops === minMax.max.val) {
    minMax.max.repeat++;
  }

  if (drops === minMax.max.prev) {
    minMax.max.prevRepeat++;
  }

  return minMax;
};

const zoneToCat = (data: WearableData) => {
  const clothes = ['shirtdress', 'jacket', 'trousers'];
  const trinkets = [
    'background',
    'foreground',
    'backgrounditem',
    'music',
    'soundeffects',
    'higherforegrounditem',
    'lowerforegrounditem',
    'thoughtbubble',
  ];

  if (clothes.includes(data.zone_plain_label)) return 'clothing';
  if (trinkets.includes(data.zone_plain_label)) return 'trinkets';
  return 'accessories';
};
