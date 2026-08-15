import type { NextApiRequest, NextApiResponse } from 'next';
import { dti, getVisibleLayers } from '../../../../../utils/item/impress';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { cdnExists, uploadToS3 } from '../../../../../utils/googleCloud';
import prisma from '../../../../../utils/prisma';
import axios from 'axios';
import { DTIBodiesAndTheirZones, DTIItemPreview } from '../../../../../types';
import { Items, Prisma } from '@prisma/generated/client';
import { Chance } from 'chance';
import { ItemRevalidateTags, revalidateItem } from '@utils/item/revalidateItem';
import { ITEMDB_ALT_STYLES_URL } from '../alt-styles';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  if (req.method !== 'GET')
    throw new Error(`The HTTP ${req.method} method is not supported at this route.`);

  let start = Date.now();
  const { id, refresh, hash, noPlaceholder } = req.query;
  const skipPlaceholder = noPlaceholder === '1' || noPlaceholder === 'true';

  let canvas;
  let ctx;

  try {
    if (!id) return res.status(400).send('No image id provided');

    const img_id = (id as string).split('.')[0];
    const path = `preview/${img_id}.png`;

    const itemProm = prisma.items.findFirst({
      where: {
        image_id: img_id as string,
      },
      include: {
        petStyle: { select: { internal_id: true } },
      },
    });

    const [item, lastModified] = await Promise.all([itemProm, cdnExists(path, true)]);

    start = updateServerTime('item-lookup', start, res);

    if (!item) return res.status(404).send('Item not found');

    const isPetStyle = !!item.petStyle;

    start = updateServerTime('cdn-check', start, res);
    const forceRefresh = refresh === 'true';

    let processPromise;

    if (lastModified) {
      const lastModifiedDate = new Date(lastModified as string);
      const daysSinceLastUpdate = Math.floor(
        (Date.now() - lastModifiedDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastUpdate >= 30 && !isPetStyle) {
        try {
          const [, rawData] = await handleRegularStyle(item.name);
          processPromise = processDTIData(item, rawData);
        } catch (e) {
          processPromise = null;
        }
        start = updateServerTime('dti-regular', start, res);
      }
    }

    if (lastModified && !forceRefresh) {
      res.setHeader('Cache-Control', 'public, max-age=2592000');

      const urlPath = `https://cdn.itemdb.com.br/${path}`;
      const cacheKeyPath = hash ? `?hash=${hash}` : '';

      res.redirect(urlPath + cacheKeyPath);

      if (processPromise) await processPromise;

      return;
    } else {
      canvas = createCanvas(600, 600);
      ctx = canvas.getContext('2d');

      let imagesURLs: string[];
      let rawData:
        | (DTIItemPreview & { compatibleBodiesAndTheirZones: DTIBodiesAndTheirZones[] })
        | undefined = undefined;

      if (isPetStyle) {
        imagesURLs = await handleAltStyle(item.image_id!, item.name, item.item_id);
        start = updateServerTime('alt-styles', start, res);
        if (imagesURLs.length === 0) throw new Error('No layers found');
      } else {
        try {
          const styleData = await handleRegularStyle(item.name);
          start = updateServerTime('dti-regular', start, res);
          imagesURLs = styleData[0];
          rawData = styleData[1];
          if (imagesURLs.length === 0) throw new Error('No layers found');
        } catch (e) {
          if (!rawData) start = updateServerTime('dti-regular', start, res);
          imagesURLs = await handleAltStyle(item.image_id!, item.name, item.item_id);
          start = updateServerTime('alt-styles', start, res);
          if (imagesURLs.length === 0) throw e;
        }
      }

      const imagesPromises = [];

      for (const img of imagesURLs) {
        imagesPromises.push(loadImage(img));
      }

      const images = await Promise.all(imagesPromises);
      start = updateServerTime('load-images', start, res);

      for (const img of images) ctx.drawImage(img, 0, 0, 600, 600);

      const buffer = await canvas.encode('webp', 100);
      start = updateServerTime('encode-image', start, res);

      await uploadToS3(path, buffer, 'image/webp');
      start = updateServerTime('upload-image', start, res);

      res.writeHead(200, {
        'Content-Type': 'image/webp',
        'Content-Length': buffer.length,
        'Cache-Control': forceRefresh ? 'no-cache' : 'public, max-age=2592000',
      });

      res.end(buffer);

      if (rawData) await processDTIData(item, rawData);

      if (forceRefresh) {
        const chance = new Chance();

        await prisma.items.update({
          where: { internal_id: item.internal_id },
          data: { imgCacheOverride: chance.hash({ length: 10 }) },
        });

        await revalidateItem(item.internal_id, ItemRevalidateTags.preview(item.internal_id));
      }

      return;
    }
  } catch (e) {
    if (skipPlaceholder) {
      res.writeHead(404, {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Expires: 0,
      });
      res.end();
      return;
    }

    const img = await loadImage('./public/oops.png');
    start = updateServerTime('oops-image', start, res);

    if (!canvas || !ctx) {
      canvas = createCanvas(600, 600);
      ctx = canvas.getContext('2d');
    }

    ctx.drawImage(img, 0, 0);

    const buffer = await canvas.encode('webp', 50);
    updateServerTime('oops-encode', start, res);

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

const handleRegularStyle = async (
  itemName: string
): Promise<
  [string[], DTIItemPreview & { compatibleBodiesAndTheirZones: DTIBodiesAndTheirZones[] }]
> => {
  const itemPreviewData = await dti.fetchItemPreview(itemName);

  if (!itemPreviewData) {
    throw new Error('Item Preview not found');
  }

  const layers = getVisibleLayers(itemPreviewData.canonicalAppearance.body.canonicalAppearance, [
    itemPreviewData.canonicalAppearance,
  ]);

  if (layers.length === 0) throw 'No layers found';

  const imagesURLs = [];

  for (const layer of layers) {
    imagesURLs.push(layer.imageUrlV2);
  }

  return [imagesURLs, itemPreviewData];
};

// using data from DTI again. Thanks DTI!
const handleAltStyle = async (
  image_id: string,
  itemName: string,
  item_id: number | null
): Promise<string[]> => {
  const dtiRes = await axios.get(ITEMDB_ALT_STYLES_URL, {
    headers: {
      'User-Agent': 'itemdb (https://itemdb.com.br/;)',
    },
  });

  const dtiData = dtiRes.data as any[];

  // hotfixes thumbnail_url being wrong
  const altImgID = itemName.toLowerCase().replaceAll(' ', '_');

  const style = dtiData.find(
    (x) =>
      x.id === (item_id ?? -1) ||
      x.thumbnail_url.includes(image_id) ||
      x.thumbnail_url.includes(altImgID)
  );

  if (!style) return [];

  const url = style.swf_assets[0].urls.png;

  return [url];
};

const processDTIData = async (
  item: Items,
  data: DTIItemPreview & { compatibleBodiesAndTheirZones: DTIBodiesAndTheirZones[] }
) => {
  const dataArr: Prisma.WearableDataCreateManyInput[] = [];

  const bodiesAndZones = data.compatibleBodiesAndTheirZones;

  bodiesAndZones.map((rawData, i) => {
    const body = rawData.body;
    const zones = rawData.zones;

    zones.map((zone) => {
      dataArr.push({
        item_id: Number(data.id),
        item_iid: item.internal_id,
        zone_label: zone.label,
        zone_plain_label: zone.label.toLowerCase().replace(/[^a-z0-9.]+/g, ''),
        species_name: body.species?.name.toLowerCase(),
        isCanonical: i === 0,
      });
    });
  });

  await prisma.wearableData.createMany({
    data: dataArr,
    skipDuplicates: true,
  });
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
