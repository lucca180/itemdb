import type { NextApiRequest, NextApiResponse } from 'next';
import { getItem } from '.';
import { getItemColor } from '../colors';
import prisma from '../../../../../utils/prisma';
import { getColorThiefSwatchRows } from '@utils/item/itemColorThief';
import { ItemData } from '../../../../../types';

// The 6 named swatch types this endpoint manages — scoped so a force-refresh here never
// touches the `main`/`secondary` accent pair used by cards/pages.
const SWATCH_TYPES = ['vibrant', 'darkvibrant', 'lightvibrant', 'muted', 'darkmuted', 'lightmuted'];

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  const { id_name, force } = req.query;
  if (!id_name) return res.status(400).json({ error: 'Invalid Request' });

  const isForce = force === 'true';

  const internal_id = Number(id_name);
  const name = isNaN(internal_id) ? (id_name as string) : undefined;

  const item = await getItem(name ?? internal_id);

  if (!item) return res.status(400).json({ error: 'Invalid Item' });

  const result = await getSingleItemColor(item, isForce);

  return res.json(result);
}

export const getSingleItemColor = async (item: ItemData, force = false) => {
  // Checked against the swatch family specifically, not `item.color`/`main` — those are now
  // generated independently (accent color vs. full palette), so `main` existing doesn't mean
  // the swatches do.
  if (!force) {
    const itemColor = await getItemColor([item.image_id]);
    if (itemColor[item.image_id]?.vibrant) return itemColor[item.image_id];
  }

  await prisma.itemColor.deleteMany({
    where: {
      image_id: item.image_id,
      type: { in: SWATCH_TYPES },
    },
  });

  let palette = await getColorThiefSwatchRows(item);
  if (!palette) {
    console.error('Invalid Pallete for item ' + item.internal_id + ', using fallback image');

    palette = await getColorThiefSwatchRows({
      ...item,
      image: 'https://itemdb.com.br/item-error.png',
    });
    if (!palette) throw new Error('Could not get fallback palette');
  }

  await prisma.itemColor.createMany({
    data: palette,
  });

  const itemColor = await getItemColor([item.image_id]);
  return itemColor[item.image_id];
};
