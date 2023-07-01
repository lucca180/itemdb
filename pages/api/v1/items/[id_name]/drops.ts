import type { NextApiRequest, NextApiResponse } from 'next';
import { getItem } from '.';
import { ItemDrop } from '../../../../../types';
import prisma from '../../../../../utils/prisma';

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

export const getItemDrops = async (item_iid: number, isNC = false) => {
  const drops = await prisma.openableItems.findMany({
    where: {
      parent_iid: item_iid,
    },
  });

  const dropsCount = drops.length;
  const openingSet = new Set();
  drops.map((drop) => openingSet.add(drop.opening_id));
  const openingCount = openingSet.size;

  if (openingCount < 5) return [];

  const dropsData: { [id: number]: ItemDrop } = {};

  drops.map((drop) => {
    const dropData: ItemDrop = {
      item_iid: drop.item_iid,
      dropRate: dropsData[drop.item_iid]?.dropRate ? dropsData[drop.item_iid].dropRate + 1 : 1,
      notes: drop.notes,
      isLE: drop.limitedEdition,
      openings: openingCount,
    };

    dropsData[drop.item_iid] = dropData;
  });

  const dropsArray = Object.values(dropsData)
    .filter((a) => a.dropRate >= (isNC ? 1 : 2))
    .map((drop) => ({
      ...drop,
      dropRate: ((drop.dropRate / dropsCount) * 100).toFixed(2),
    }));

  return dropsArray;
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
