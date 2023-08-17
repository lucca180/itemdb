import type { NextApiRequest, NextApiResponse } from 'next';
import { dti } from '../../../../utils/impress';
import { createCanvas, loadImage } from 'canvas';
import { ImageBucket } from '../../../../utils/googleCloud';
import prisma from '../../../../utils/prisma';

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

    const forceRefresh = refresh === 'true';

    if (exists && !forceRefresh) {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=604800');

      if (file.metadata.cacheControl !== 'public, max-age=604800') {
        await file.setMetadata({ cacheControl: 'public, max-age=604800' });
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

      const itemPreviewData = await dti.fetchItemPreview(item.name);

      const layers = [
        ...itemPreviewData.canonicalAppearance.layers,
        ...itemPreviewData.canonicalAppearance.body.canonicalAppearance.layers,
      ].sort((a, b) => a.zone.depth - b.zone.depth);

      const imagesPromises = [];

      for (const layer of layers) {
        imagesPromises.push(loadImage(layer.imageUrlV2));
      }
      const images = await Promise.all(imagesPromises);

      for (const img of images) ctx.drawImage(img, 0, 0);

      const buffer = canvas.toBuffer();
      await file.save(buffer, {
        metadata: {
          cacheControl: 'public, max-age=604800',
        },
      });

      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': buffer.length,
        'Cache-Control': 'public, max-age=604800',
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

    res.writeHead(200, {
      'Content-Type': 'image/jpeg',
      'Content-Length': buffer.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Error-Image': 'true',
      Expires: 0,
    });

    return res.end(buffer);
  }
}
