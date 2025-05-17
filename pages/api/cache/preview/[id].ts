import type { NextApiRequest, NextApiResponse } from 'next';
import { dti, getVisibleLayers } from '../../../../utils/impress';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { cdnExists, uploadToS3 } from '../../../../utils/googleCloud';
import prisma from '../../../../utils/prisma';
import axios from 'axios';
import { DTIBodiesAndTheirZones, DTIItemPreview } from '../../../../types';
import { Items, Prisma } from '@prisma/generated/client';
import { getSpeciesId } from '../../../../utils/pet-utils';

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

    const path = `preview/${img_id}.png`;

    const lastModified = await cdnExists(path, true);

    const forceRefresh = refresh === 'true';
    let processPromise;

    if (lastModified) {
      const lastModifiedDate = new Date(lastModified as string);
      const daysSinceLastUpdate = Math.floor(
        (Date.now() - lastModifiedDate.getTime()) / (1000 * 60 * 60 * 24)
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

    if (lastModified && !forceRefresh) {
      res.setHeader('Cache-Control', forceRefresh ? 'no-cache' : 'public, max-age=2592000');

      res.redirect(`https://cdn.itemdb.com.br/${path}`);

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
        imagesURLs = await handleAltStyle(item.image_id!, item.name, item.item_id);
        if (imagesURLs.length === 0) throw e;
      }

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
        'Cache-Control': forceRefresh ? 'no-cache' : 'public, max-age=2592000',
      });

      res.end(buffer);

      if (rawData) await processDTIData(item, rawData);

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
  const specieName = itemName.split(' ').at(-1)?.toLowerCase();
  if (!specieName) return [];

  const specieID = getSpeciesId(specieName) ?? handleEssenceToken(specieName);
  if (!specieID) return [];

  const dtiRes = await axios.get(`https://impress.openneo.net/species/${specieID}/alt-styles.json`);
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

// handle essence tokens (i hate this)
const handleEssenceToken = (name: string): number | null => {
  switch (name) {
    case 'kass':
      return 12;
    case 'aurrick':
      return 28;
    case 'edna':
      return 54;
    case 'hannah':
      return 50;
    case 'jeran':
      return 31;
    case 'kelland':
      return 46;
    case 'lyra':
      return 52;
    case 'nyx':
      return 2;
    case 'sophie':
      return 19;
    case 'vira':
      return 1;
    default:
      return null;
  }
};
