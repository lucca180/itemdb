import type { NextApiRequest, NextApiResponse } from 'next';
import { dti } from '../../../../../utils/impress';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { ImageBucket } from '../../../../../utils/googleCloud';
import {
  allNeopetsColors,
  allSpecies,
  getPetColorId,
  getSpeciesId,
} from '../../../../../utils/utils';
import { checkPetColorExists } from '../../../v1/tools/petcolors';
import prisma from '../../../../../utils/prisma';

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

    let img_id = (id as string).split('.')[0];

    const species = img_id.split('_')[0];
    const color = img_id.split('_')[1];

    let colorId = getPetColorId(color);
    let speciesId = getSpeciesId(species);

    if (!colorId && !speciesId) return res.status(404).send('Pet Color Combo Not Found');
    else if (colorId && speciesId) {
      const comboExists = await checkPetColorExists(colorId, speciesId);
      if (!comboExists) return res.status(404).send('Pet Color Combo Not Found');
    } else {
      const existentCombo = await prisma.colorSpecies.findFirst({
        where: {
          OR: [{ color_id: colorId ?? undefined }, { species_id: speciesId ?? undefined }],
        },
      });

      if (!existentCombo) return res.status(404).send('Pet Color Combo Not Found');

      if (!colorId) colorId = existentCombo.color_id;
      if (!speciesId) speciesId = existentCombo.species_id;

      img_id = `${allSpecies[speciesId]}_${allNeopetsColors[colorId]}`;
    }

    const file = ImageBucket.file('colors/' + img_id + '.png');
    const [exists] = await file.exists();

    const forceRefresh = refresh === 'true';

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

      return;
    } else {
      canvas = createCanvas(600, 600);
      ctx = canvas.getContext('2d');

      const imagesURLs = await fetchPetPreviewImages(speciesId, colorId);
      if (imagesURLs.length === 0) throw new Error('No layers found');

      const imagesPromises = [];
      console.log(imagesURLs);
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

const fetchPetPreviewImages = async (species_id: number, color_id: number) => {
  const petPreviewData = await dti.fetchPetPreview(species_id, color_id);

  const layers = petPreviewData.layers.sort((a, b) => a.zone.depth - b.zone.depth);

  if (layers.length === 0) throw 'No layers found';

  const imagesURLs = [];

  for (const layer of layers) {
    imagesURLs.push(layer.imageUrlV2);
  }

  return imagesURLs;
};
