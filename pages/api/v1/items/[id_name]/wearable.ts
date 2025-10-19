import { NextApiRequest, NextApiResponse } from 'next';
import { getItem } from '.';
import prisma from '../../../../../utils/prisma';
import { WearableData } from '@types';

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
  if (!item.isWearable) return res.status(400).json({ error: 'Item is not wearable' });

  const data = await getWearableData(id, true);

  return res.status(200).json(data);
}

export const getWearableData = async (iid: number, raw?: boolean) => {
  const data = await prisma.wearableData.findMany({
    where: {
      item_iid: iid,
    },
  });

  if (raw) return data;

  const wearableData: WearableData = {
    zone_label: [],
    zone_plain_label: [],
    species_name: [],
    canonicalZones: [],
    canonicalSpecies: '',
  };

  const zone_label = new Set<string>();
  const zone_plain_label = new Set<string>();
  const species_name = new Set<string>();

  data.forEach((d) => {
    zone_label.add(d.zone_label);
    zone_plain_label.add(d.zone_plain_label);
    species_name.add(d.species_name);
    if (d.isCanonical) {
      wearableData.canonicalSpecies = d.species_name;
    }
  });

  wearableData.zone_label = Array.from(zone_label);
  wearableData.zone_plain_label = Array.from(zone_plain_label);
  wearableData.species_name = Array.from(species_name);

  return wearableData;
};
