import type { NextApiRequest, NextApiResponse } from 'next';
import { getItem } from '.';
import { ItemDrop, ItemOpenable } from '../../../../../types';
import prisma from '../../../../../utils/prisma';

const catType = ['trinkets', 'accessories', 'clothing'];

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const id_name = req.query.id_name as string;
  const id = Number(id_name);

  const itemQuery = isNaN(id) ? id_name : id;

  const item = await getItem(itemQuery);
  if (!item) return res.status(400).json({ error: 'Item not found' });

  const [drops, parents] = await Promise.all([
    getItemDrops(item.internal_id, item.isNC),
    getItemParent(item.internal_id),
  ]);

  return res.status(200).json({ drops: drops, parents: parents });
}

export const getItemDrops = async (
  item_iid: number,
  isNC = false
): Promise<ItemOpenable | null> => {
  const drops = await prisma.openableItems.findMany({
    where: {
      parent_iid: item_iid,
    },
  });

  const dropsCount = drops.length;
  const openingSet: { [id: string]: number } = {};
  drops.map(
    (drop) =>
      (openingSet[drop.opening_id] = openingSet[drop.opening_id]
        ? openingSet[drop.opening_id] + 1
        : 1)
  );
  const openingCount = Object.keys(openingSet).length;

  if (openingCount < 5) return null;

  const minDrop = Math.min(...Object.values(openingSet));

  const openableData: ItemOpenable = {
    openings: openingCount,
    isCategoryCap: false,
    hasLE: false,
    notes: null,
    drops: [],
    minDrop: minDrop,
    isGBC: false,
  };

  const dropsData: { [id: number]: ItemDrop } = {};
  const catsData: { [id: number]: { [noteType: string]: number } } = {};
  const dropsCountByType: { [noteType: string]: number } = {};

  drops.map((drop) => {
    const dropData: ItemDrop = {
      item_iid: drop.item_iid,
      dropRate: dropsData[drop.item_iid]?.dropRate ? dropsData[drop.item_iid].dropRate + 1 : 1,
      notes: drop.notes,
      isLE: drop.limitedEdition,
    };

    const notesList = drop.notes?.toLowerCase().split(',') ?? [];
    notesList.map((note) => {
      let val = 1;

      if (notesList.length === 1) val = 10;

      if (catType.includes(note) || note.match(/cat\d+y\d+/gim)) {
        openableData.isCategoryCap = true;

        if (!catsData[drop.item_iid]) catsData[drop.item_iid] = {};

        catsData[drop.item_iid][note] = catsData[drop.item_iid][note]
          ? catsData[drop.item_iid][note] + val
          : val;
      }
    });

    dropsData[drop.item_iid] = dropData;
  });

  // check which notes are more commum for each item
  if (openableData.isCategoryCap) {
    Object.values(dropsData).map((drop) => {
      const sortedCats = Object.entries(catsData[drop.item_iid] ?? {})
        .filter((a) => !!a[0] && !!a[1])
        .sort((a, b) => b[1] - a[1]);

      if (!sortedCats.length) return;

      const moreCommonCat = sortedCats[0]?.[1] <= sortedCats[1]?.[1] ? 'unknown' : sortedCats[0][0];

      drop.notes = moreCommonCat;
      dropsData[drop.item_iid] = drop;
      dropsCountByType[moreCommonCat] = dropsCountByType[moreCommonCat]
        ? dropsCountByType[moreCommonCat] + drop.dropRate
        : drop.dropRate;
    });
  }

  // checks if any item are granted to be 100% drop rate, then remove from the total
  const newDropsCount =
    dropsCount -
    Object.values(dropsData)
      .filter((a) => a.dropRate / openingCount >= 1)
      .reduce((a, b) => a + b.dropRate, 0);

  const dropsArray: ItemDrop[] = Object.values(dropsData)
    .filter((a) => a.dropRate >= (isNC ? 1 : 2))
    .map((drop) => {
      let itemDropCount = dropsCountByType[drop.notes ?? ''] ?? newDropsCount;

      if (drop.notes === 'unknown') itemDropCount = newDropsCount;

      if (drop.isLE) {
        drop.notes = 'LE';
        openableData.hasLE = true;
        itemDropCount = openingCount;
      }

      let dropRate = (drop.dropRate / itemDropCount) * 100;

      if (drop.dropRate / openingCount >= 1) {
        if (drop.item_iid === 17434) openableData.isGBC = true;
        dropRate = 100;
      }

      return {
        ...drop,
        dropRate: dropRate,
      };
    });

  openableData.drops = dropsArray;

  return openableData;
};

export const getItemParent = async (item_iid: number) => {
  const drops = await prisma.openableItems.findMany({
    where: {
      item_iid: item_iid,
    },
  });

  const parents: { [id: number]: number } = {};

  drops.map((drop) => {
    if (!drop.parent_iid) return;
    parents[drop.parent_iid] = parents[drop.parent_iid] ? parents[drop.parent_iid] + 1 : 1;
  });

  //discard parents with less than 3 drops
  const parentsArray = Object.entries(parents)
    .filter((a) => a[1] >= 2)
    .map((a) => Number(a[0]));

  return parentsArray;
};
