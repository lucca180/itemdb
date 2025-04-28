import type { NextApiRequest, NextApiResponse } from 'next';
import { dti, getVisibleLayers } from '../../../../utils/impress';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { cdnExists, uploadToS3 } from '../../../../utils/googleCloud';
import prisma from '../../../../utils/prisma';
import qs from 'qs';
import objectHash from 'object-hash';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  if (req.method !== 'GET' || !req.url)
    throw new Error(`The HTTP ${req.method} method is not supported at this route.`);

  const { refresh } = req.query;
  const reqQuery = qs.parse(req.url.split('?')[1]) as any;

  let canvas;
  let ctx;

  const itemsIds = reqQuery.iid as string[];
  if (!itemsIds || !itemsIds.length) return res.status(400).send('No item iids provided');

  try {
    const items = await prisma.items.findMany({
      where: {
        internal_id: {
          in: itemsIds.map((i) => parseInt(i)),
        },
      },
    });

    if (!items || !items.length) return res.status(404).send('Item not found');

    const hash = objectHash(items.map((item) => item.internal_id).sort());
    const path = `preview/${hash}.png`;

    const exists = await cdnExists(path);

    const forceRefresh = refresh === 'true';

    if (exists && !forceRefresh) {
      res.setHeader('Cache-Control', 'public, max-age=2592000');

      res.redirect(301, `https://cdn.itemdb.com.br/${path}`);

      return;
    } else {
      canvas = createCanvas(600, 600);
      ctx = canvas.getContext('2d');

      const imagesURLs = await handleRegularStyle(items.map((item) => item.name));
      if (imagesURLs.length === 0) throw new Error('No layers found');

      const imagesPromises = [];

      for (const img of imagesURLs) {
        imagesPromises.push(loadImage(img));
      }

      const images = await Promise.all(imagesPromises);

      for (const img of images) ctx.drawImage(img, 0, 0, 600, 600);

      const buffer = await canvas.encode('webp', 100);

      await uploadToS3(path, buffer, 'image/webp');

      res.writeHead(200, {
        'Content-Type': 'image/webp',
        'Content-Length': buffer.length,
        'Cache-Control': 'public, max-age=2592000',
      });

      res.end(buffer);

      return;
    }
  } catch (e) {
    console.error(e);
    const img = await loadImage('./public/oops.jpg');

    if (!canvas || !ctx) {
      canvas = createCanvas(600, 600);
      ctx = canvas.getContext('2d');
    }

    ctx.drawImage(img, 0, 0);

    const buffer = await canvas.encode('webp', 50);

    res.writeHead(400, {
      'Content-Type': 'image/webp',
      'Content-Length': buffer.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Error-Image': 'true',
      Expires: 0,
    });

    return res.end(buffer);
  }
}

const handleRegularStyle = async (itemNames: string[]): Promise<string[]> => {
  const outfitPreview = await dti.fetchOutfitPreview(itemNames);

  if (!outfitPreview || !outfitPreview.length) {
    throw new Error('Item Preview not found');
  }

  const layers = getVisibleLayers(
    outfitPreview[0].canonicalAppearance.body.canonicalAppearance,
    outfitPreview.map((item) => item.canonicalAppearance)
  );

  if (layers.length === 0) throw 'No layers found';

  const imagesURLs = [];

  for (const layer of layers) {
    imagesURLs.push(layer.imageUrlV2);
  }

  return imagesURLs;
};
