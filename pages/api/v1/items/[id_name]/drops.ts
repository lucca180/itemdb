import type { NextApiRequest, NextApiResponse } from 'next';
import { getItem } from '.';
import { ItemDrop, ItemOpenable, PrizePoolData } from '../../../../../types';
import { CheckAuth } from '../../../../../utils/googleCloud';
import prisma from '../../../../../utils/prisma';
import { OpenableItems, WearableData } from '@prisma/generated/client';
import { ItemRevalidateTags, revalidateItem } from '@utils/revalidateItem';
import { getManyItems } from '../many';
import { redis_setDataCount } from '@utils/redis';
import {
  deduplicateCommunityDrops,
  evaluateDropEvidence,
  GRAM_OPTION_NOTE,
  isAuthoritativeDrop,
  MANUAL_OPENING_ID,
} from '@utils/itemDropEvidence';

const catType = ['trinkets', 'accessories', 'clothing', 'le', 'choice'];
const catTypeZone = ['trinkets', 'accessories', 'clothing'];
const giftBoxes = [65354, 17434, 860];

export const SKIP_ITEMS = [61696, 65743];

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
    item.useTypes.canOpen !== 'false' ? getItemDrops(item.internal_id) : null,
    getItemParent(item.internal_id),
  ]);

  redis_setDataCount(Object.keys(drops?.drops || {}).length, req);

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
        opening_id: MANUAL_OPENING_ID,
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
        opening_id: MANUAL_OPENING_ID,
        isManual: true,
      },
    });
  }

  const newDrops = await getItemDrops(item.internal_id);

  await revalidateItem(item.internal_id, ItemRevalidateTags.drops(item.internal_id));

  return res.status(200).json({ dropUpdate: newDrops });
};

// ---------- helpers ---------- //
export const getItemDrops = async (item_iid: number): Promise<ItemOpenable | null> => {
  if (SKIP_ITEMS.includes(item_iid)) return null;

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

  const [item, rawDrops] = await Promise.all([itemProm, dropsProm]);

  if (rawDrops.length === 0 || !item || item.canOpen === 'false') return null;

  const evidence = evaluateDropEvidence(item, rawDrops);
  const communityDrops = deduplicateCommunityDrops(rawDrops).filter((drop) =>
    evidence.acceptedItemIds.has(drop.item_iid)
  );
  const authoritativeDrops = rawDrops.filter(isAuthoritativeDrop);
  const gramOptions = rawDrops.filter(
    (drop) =>
      drop.notes?.toLowerCase().includes(GRAM_OPTION_NOTE) &&
      evidence.acceptedItemIds.has(drop.item_iid)
  );
  const drops = [...authoritativeDrops, ...communityDrops, ...gramOptions];

  if (!drops.length) return null;

  const isNoUnknown = item.flags?.includes('no-unknown');

  const prizePools: { [name: string]: PrizePoolData } = {};
  const dropsData: { [id: number]: ItemDrop } = {};
  const poolsData: { [id: string]: { [note: string]: number } } = {};

  const openingSet: { [id: string]: number[] } = {};

  const confirmedDrops = new Set<string>();
  const allItemIds = new Set<number>();

  drops.map((drop) => {
    if (isAuthoritativeDrop(drop)) return;

    if (drop.notes?.toLowerCase().includes(GRAM_OPTION_NOTE)) return;

    openingSet[drop.opening_id] = [...(openingSet[drop.opening_id] ?? []), drop.item_iid];
  });

  const openingCount = Object.keys(openingSet).length;
  let activePoolOpenings = openingCount;

  const authoritativeItems: number[] = [];
  let isChoice = false;
  let isZoneCat = false;
  let isGram = false;

  const hasGramInName = !!item?.name.toLowerCase().split(' ').includes('gram');
  const hasGBCInName = !!item?.name.toLowerCase().includes('gift box mystery capsule');

  drops
    .sort((a, b) => (a.notes?.length ?? 0) - (b.notes?.length ?? 0))
    .map((drop) => {
      allItemIds.add(drop.item_iid);
      const dropData: ItemDrop = {
        item_iid: drop.item_iid,
        dropRate: dropsData[drop.item_iid]?.dropRate ?? 0,
        notes: drop.notes,
        isLE: dropsData[drop.item_iid]?.isLE || drop.limitedEdition,
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
        if (isAuthoritativeDrop(drop)) authoritativeItems.push(drop.item_iid);
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
            const opening = openingSet[drop.opening_id];
            const otherItem = opening.find((a) => a !== drop.item_iid);

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
    .filter((a) => evidence.acceptedItemIds.has(a.item_iid))
    .map((drop) => {
      if (authoritativeItems.includes(drop.item_iid)) return;

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

      if (hasGBCInName && moreCommonCat === 'unknown' && giftBoxes.includes(drop.item_iid))
        moreCommonCat = 'giftbox';

      if (isNoUnknown && moreCommonCat === 'unknown') return;

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
    .filter((a) => !evidence.acceptedItemIds.has(a.item_iid))
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
      confirmedDrops.add(id);

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

    if (pool.isLE) openableData.hasLE = true;
  });

  activePoolOpenings = Object.values(prizePools)
    .filter((p) => !p.name.includes('old-'))
    .reduce((a, b) => a + b.openings, 0);

  activePoolOpenings = Math.min(activePoolOpenings, openingCount);

  Object.values(prizePools).map((pool) => {
    if (
      !pool.isChance &&
      pool.openings / activePoolOpenings <= 0.9 &&
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
    Object.keys(openableData.pools).map((pool) => {
      openableData.pools[pool].minDrop = 1;
      openableData.pools[pool].maxDrop = 1;
    });
  }

  Object.values(dropsData)
    .filter((a) => evidence.acceptedItemIds.has(a.item_iid))
    .map((drop) => {
      const pool = prizePools[drop.pool ?? 'unknown'];
      if (!pool) return;
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

  openableData.openings = confirmedDrops.size;

  if (!Object.keys(openableData.drops).length) return null;

  return openableData;
};

type ParentOpenableItem = OpenableItems & {
  parent_flags: string | null;
  parent_name: string;
};

const isKnownParentDrop = (drop: ParentOpenableItem) => {
  if (isAuthoritativeDrop(drop)) return true;
  if (!drop.parent_flags?.includes('no-unknown')) return true;
  if (drop.prizePool || drop.limitedEdition) return true;

  const notesList = drop.notes?.toLowerCase().split(',') ?? [];
  const hasKnownNote = notesList.some(
    (note) => catType.includes(note) || !!note.match(/cat\d+y\d+/gim) || !!note.match(/cat\d+/gim)
  );

  if (hasKnownNote) return true;

  const hasGBCInName = drop.parent_name.toLowerCase().includes('gift box mystery capsule');
  if (hasGBCInName && giftBoxes.includes(drop.item_iid)) return true;

  return false;
};

export const getItemParent = async (item_iid: number, itemLimit?: number) => {
  const drops = await prisma.$queryRaw<ParentOpenableItem[]>`
    SELECT t0.*
      , j2.flags AS parent_flags
      , j2.name AS parent_name
    FROM (
        SELECT *
        FROM OpenableItems
        WHERE item_iid = ${item_iid}

        UNION

        SELECT t0.*
        FROM OpenableItems t0
        JOIN Items j1 ON j1.internal_id = t0.item_iid
        WHERE j1.canonical_id = ${item_iid}
    ) AS t0
    JOIN Items j2 ON j2.internal_id = t0.parent_iid
    WHERE j2.canOpen != 'false';
  `;

  const eligibleDrops = drops.filter(
    (drop) =>
      drop.parent_iid &&
      !SKIP_ITEMS.includes(drop.parent_iid) &&
      !SKIP_ITEMS.includes(drop.item_iid)
  );

  const candidateParentIds = Array.from(
    new Set(eligibleDrops.map((drop) => drop.parent_iid as number))
  );

  const matchingItemIds = new Set(eligibleDrops.map((drop) => drop.item_iid));

  const [parentItems, parentDrops] = await Promise.all([
    prisma.items.findMany({
      where: {
        internal_id: {
          in: candidateParentIds,
        },
      },
      select: {
        internal_id: true,
        name: true,
        flags: true,
        isNC: true,
        canOpen: true,
        canPlay: true,
        canEat: true,
        canRead: true,
      },
    }),
    prisma.openableItems.findMany({
      where: {
        parent_iid: {
          in: candidateParentIds,
        },
      },
      select: {
        parent_iid: true,
        opening_id: true,
        item_iid: true,
        notes: true,
        prizePool: true,
        limitedEdition: true,
      },
    }),
  ]);

  const parentsArray = parentItems
    .filter((parent) => {
      const parentReportRows = parentDrops.filter((drop) => drop.parent_iid === parent.internal_id);
      const normalizedDrops = parentReportRows.map((drop) => ({
        ...drop,
        item_iid: matchingItemIds.has(drop.item_iid) ? item_iid : drop.item_iid,
      }));
      const evidence = evaluateDropEvidence(parent, normalizedDrops);

      if (!evidence.acceptedItemIds.has(item_iid)) return false;

      return eligibleDrops
        .filter(
          (drop) => drop.parent_iid === parent.internal_id && matchingItemIds.has(drop.item_iid)
        )
        .some((drop) =>
          isKnownParentDrop({
            ...drop,
            parent_flags: parent.flags,
            parent_name: parent.name,
          })
        );
    })
    .map((parent) => parent.internal_id);

  const itemDataRaw = await getManyItems({
    id: parentsArray.map((a) => a.toString()),
  });

  const itemData = Object.values(itemDataRaw).sort(
    (a, b) => (b.item_id ?? b.internal_id) - (a.item_id ?? a.internal_id)
  );

  return {
    parents_iid: parentsArray,
    itemData: itemLimit !== undefined ? itemData.slice(0, itemLimit) : itemData,
  };
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
