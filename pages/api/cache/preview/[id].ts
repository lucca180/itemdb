import type { NextApiRequest, NextApiResponse } from 'next';
import { dti } from '../../../../utils/impress';
import { createCanvas, loadImage } from 'canvas';
import { ImageBucket } from '../../../../utils/googleCloud';
import prisma from '../../../../utils/prisma';
import altStyles from '../../../../utils/altStyles.json';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  if (req.method !== 'GET')
    throw new Error(`The HTTP ${req.method} method is not supported at this route.`);

  const { id, refresh } = req.query;

  let canvas;
  let ctx;

  try {
    if (!id) return res.status(400).send('No image id provided');

    const img_id = (id as string).split('.')[0];

    const file = ImageBucket.file('preview/' + img_id + '.png');
    const [exists] = await file.exists();

    let forceRefresh = refresh === 'true';

    if (exists && new Date(file.metadata.updated) < new Date('2023-11-09')) forceRefresh = true;

    if (exists && forceRefresh) {
      await file.delete();
    }

    if (exists && !forceRefresh) {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=2592000');

      if (file.metadata.cacheControl !== 'public, max-age=2592000') {
        await file.setMetadata({ cacheControl: 'public, max-age=2592000' });
      }

      return res.redirect(file.publicUrl());
    } else {
      const item = await prisma.items.findFirst({
        where: {
          image_id: img_id as string,
        },
      });

      if (!item) return res.status(404).send('Item not found');

      canvas = createCanvas(600, 600);
      ctx = canvas.getContext('2d');

      let imagesURLs: string[];
      try {
        imagesURLs = await handleRegularStyle(item.name);
        if (imagesURLs.length === 0) throw new Error('No layers found');
      } catch (e) {
        imagesURLs = await handleAltStyle(item.name);
        if (imagesURLs.length === 0) throw e;
      }

      const imagesPromises = [];

      for (const img of imagesURLs) {
        imagesPromises.push(loadImage(img));
      }

      const images = await Promise.all(imagesPromises);

      for (const img of images) ctx.drawImage(img, 0, 0, 600, 600);

      const buffer = canvas.toBuffer();
      await file.save(buffer, {
        metadata: {
          cacheControl: 'public, max-age=2592000',
        },
      });

      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': buffer.length,
        'Cache-Control': 'public, max-age=2592000',
      });

      return res.end(buffer);
    }
  } catch (e) {
    const img = await loadImage('./public/oops.jpg');

    if (!canvas || !ctx) {
      canvas = createCanvas(600, 600);
      ctx = canvas.getContext('2d');
    }

    ctx.drawImage(img, 0, 0);

    const buffer = canvas.toBuffer();

    res.writeHead(400, {
      'Content-Type': 'image/jpeg',
      'Content-Length': buffer.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Error-Image': 'true',
      Expires: 0,
    });

    return res.end(buffer);
  }
}

const handleRegularStyle = async (itemName: string) => {
  const itemPreviewData = await dti.fetchItemPreview(itemName);

  const itemRestrictedZoneIds = new Set(
    itemPreviewData.canonicalAppearance.restrictedZones.map((z) => z.id)
  );
  const petRestrictedZoneIds = new Set(
    itemPreviewData.canonicalAppearance.body.canonicalAppearance.restrictedZones
  );

  const layers = [
    ...itemPreviewData.canonicalAppearance.layers.map((l) => ({ ...l, source: 'item' })),
    ...itemPreviewData.canonicalAppearance.body.canonicalAppearance.layers.map((l) => ({
      ...l,
      source: 'pet',
    })),
  ]
    .filter((layer) => {
      if (layer.source === 'pet' && itemRestrictedZoneIds.has(layer.zone.id)) {
        return false;
      }
      if (layer.source === 'pet' && petRestrictedZoneIds.has(layer.zone.id)) {
        return false;
      }

      return true;
    })
    .sort((a, b) => a.zone.depth - b.zone.depth);

  if (layers.length === 0) throw 'No layers found';

  const imagesURLs = [];

  for (const layer of layers) {
    imagesURLs.push(layer.imageUrlV2);
  }

  return imagesURLs;
};

// using data from DTI again. Thanks DTI!
const handleAltStyle = async (itemName: string): Promise<string[]> => {
  if (!itemName.includes('Nostalgic')) return [];
  const styleName = itemName.split(' ')[0];

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const style = altStyles[styleName];
  if (!style) return [];

  return [style];
};
