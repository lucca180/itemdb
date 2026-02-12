import type { NextApiRequest, NextApiResponse } from 'next';
import { dti, getVisibleLayers } from '../../../../utils/impress';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { cdnExists, uploadToS3 } from '../../../../utils/googleCloud';
import prisma from '../../../../utils/prisma';
import queryString from 'query-string';
import objectHash from 'object-hash';
import { Chance } from 'chance';
import { revalidateItem } from '../../v1/items/[id_name]/effects';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  if (req.method !== 'GET' || !req.url)
    throw new Error(`The HTTP ${req.method} method is not supported at this route.`);
  let start = Date.now();
  const { refresh, hash, parent_iid, petId } = req.query;
  const reqQuery = queryString.parse(req.url.split('?')[1]) as any;

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

    start = updateServerTime('item-lookup', start, res);
    if (!items || !items.length) return res.status(404).send('Item not found');

    const pathHash = objectHash(items.map((item) => item.internal_id).sort());
    const path = `preview/${pathHash}.png`;

    const forceRefresh = refresh === 'true';
    const exists = forceRefresh ? null : await cdnExists(path);

    start = updateServerTime('cdn-check', start, res);

    if (exists && !forceRefresh) {
      res.setHeader('Cache-Control', 'public, max-age=2592000');

      const urlPath = `https://cdn.itemdb.com.br/${path}`;
      const cacheKeyPath = hash ? `?hash=${hash}` : '';

      res.redirect(urlPath + cacheKeyPath);

      return;
    } else {
      canvas = createCanvas(600, 600);
      ctx = canvas.getContext('2d');
      start = updateServerTime('canvas-setup', start, res);

      const imagesURLs = await handleRegularStyle(
        items.map((item) => item.name),
        petId ? Number(petId) : undefined
      );
      start = updateServerTime('dti-fetch', start, res);

      if (imagesURLs.length === 0) throw new Error('No layers found');

      const imagesPromises = [];

      for (const img of imagesURLs) {
        imagesPromises.push(loadImage(img));
      }
      const images = await Promise.all(imagesPromises);
      start = updateServerTime('load-images', start, res);

      for (const img of images) ctx.drawImage(img, 0, 0, 600, 600);
      start = updateServerTime('draw-images', start, res);

      const buffer = await canvas.encode('webp', 100);

      start = updateServerTime('encode-image', start, res);

      res.writeHead(200, {
        'Content-Type': 'image/webp',
        'Content-Length': buffer.length,
        'Cache-Control': forceRefresh ? 'no-cache' : 'public, max-age=2592000',
      });

      res.end(buffer);

      await uploadToS3(path, buffer, 'image/webp');

      updateServerTime('upload-image', start, res);

      if (forceRefresh && parent_iid) {
        const chance = new Chance();
        const item = await prisma.items.findUnique({
          where: { internal_id: Number(parent_iid) },
        });

        if (!item) return;

        await prisma.items.update({
          where: { internal_id: item.internal_id },
          data: { imgCacheOverride: chance.hash({ length: 10 }) },
        });

        await revalidateItem(item.slug!, res);
      }

      return;
    }
  } catch (e) {
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

    res.end(buffer);
    return;
  }
}

const handleRegularStyle = async (itemNames: string[], petId?: number): Promise<string[]> => {
  const outfitPreview = await dti.fetchOutfitPreview(itemNames, petId);

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

const updateServerTime = (label: string, startTime: number, response: NextApiResponse) => {
  const endTime = Date.now();
  const value = endTime - startTime;
  const serverTime = response.getHeader('Server-Timing') || '';
  const newServerTime = serverTime
    ? `${serverTime}, ${label};dur=${value}`
    : `${label};dur=${value}`;

  response.setHeader('Server-Timing', newServerTime);
  return endTime;
};
