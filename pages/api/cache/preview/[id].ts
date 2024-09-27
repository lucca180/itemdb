import type { NextApiRequest, NextApiResponse } from 'next';
import { dti } from '../../../../utils/impress';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { ImageBucket } from '../../../../utils/googleCloud';
import prisma from '../../../../utils/prisma';
import axios from 'axios';
import { DTIBodiesAndTheirZones, DTIItemPreview } from '../../../../types';
import { Items, Prisma } from '@prisma/client';

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

    const item = await prisma.items.findFirst({
      where: {
        image_id: img_id as string,
      },
    });

    if (!item) return res.status(404).send('Item not found');

    const file = ImageBucket.file('preview/' + img_id + '.png');
    const [exists] = await file.exists();

    const forceRefresh = refresh === 'true';
    let processPromise;
    if (exists) {
      const daysSinceLastUpdate = Math.floor(
        (Date.now() - new Date(file.metadata.updated ?? 0).getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysSinceLastUpdate >= 30) {
        try {
          const [, rawData] = await handleRegularStyle(item.name);
          processPromise = processDTIData(item, rawData);
        } catch (e) {
          processPromise = null;
          console.error(e);
        }
      }
    }

    if (exists && forceRefresh) {
      await file.delete();
    }

    if (exists && !forceRefresh) {
      // res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=2592000');

      if (file.metadata.cacheControl !== 'public, max-age=2592000') {
        await file.setMetadata({ cacheControl: 'public, max-age=2592000' });
      }

      res.redirect(file.publicUrl());

      if (processPromise) await processPromise;

      return;
    } else {
      canvas = createCanvas(600, 600);
      ctx = canvas.getContext('2d');

      let imagesURLs: string[];
      let rawData:
        | (DTIItemPreview & { compatibleBodiesAndTheirZones: DTIBodiesAndTheirZones[] })
        | undefined = undefined;

      try {
        const styleData = await handleRegularStyle(item.name);
        imagesURLs = styleData[0];
        rawData = styleData[1];
        if (imagesURLs.length === 0) throw new Error('No layers found');
      } catch (e) {
        imagesURLs = await handleAltStyle(item.image_id!, item.name);
        if (imagesURLs.length === 0) throw e;
      }

      const imagesPromises = [];

      for (const img of imagesURLs) {
        imagesPromises.push(loadImage(img));
      }

      const images = await Promise.all(imagesPromises);

      for (const img of images) ctx.drawImage(img, 0, 0, 600, 600);

      const buffer = await canvas.encode('webp', 100);

      await file.save(buffer, {
        metadata: {
          contentType: 'image/webp',
          cacheControl: 'public, max-age=2592000',
          lastUpdate: new Date(),
        },
      });

      res.writeHead(200, {
        'Content-Type': 'image/webp',
        'Content-Length': buffer.length,
        'Cache-Control': 'public, max-age=2592000',
      });

      res.end(buffer);

      if (rawData) await processDTIData(item, rawData);

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

    return res.end(buffer);
  }
}

const handleRegularStyle = async (
  itemName: string,
): Promise<
  [string[], DTIItemPreview & { compatibleBodiesAndTheirZones: DTIBodiesAndTheirZones[] }]
> => {
  const itemPreviewData = await dti.fetchItemPreview(itemName);

  const itemRestrictedZoneIds = new Set(
    itemPreviewData.canonicalAppearance.restrictedZones.map((z) => z.id),
  );
  const petRestrictedZoneIds = new Set(
    itemPreviewData.canonicalAppearance.body.canonicalAppearance.restrictedZones,
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

  return [imagesURLs, itemPreviewData];
};

// using data from DTI again. Thanks DTI!
const handleAltStyle = async (image_id: string, itemName: string): Promise<string[]> => {
  if (!image_id.includes('nostalgic') && !itemName.toLowerCase().includes('nostalgic')) return [];
  const dtiRes = await axios.get('https://impress.openneo.net/alt-styles.json');
  const dtiData = dtiRes.data as any[];

  // hotfixes thumbnail_url being wrong
  const altImgID = itemName.toLowerCase().replaceAll(' ', '_');

  const style = dtiData.find(
    (x) => x.thumbnail_url.includes(image_id) || x.thumbnail_url.includes(altImgID),
  );

  if (!style) return [];

  const url = style.swf_assets[0].urls.png;

  return [url];
};

const processDTIData = async (
  item: Items,
  data: DTIItemPreview & { compatibleBodiesAndTheirZones: DTIBodiesAndTheirZones[] },
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
