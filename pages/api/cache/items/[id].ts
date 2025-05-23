import type { NextApiRequest, NextApiResponse } from 'next';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { uploadToS3, cdnExists } from '../../../../utils/googleCloud';
import axios from 'axios';

// const ISDEV = process.env.NODE_ENV === 'development';

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

    const path = `items/${img_id}.gif`;

    const exists = await cdnExists(path);

    const forceRefresh = refresh === 'true';

    if (exists && !forceRefresh) {
      res.setHeader('Content-Type', 'image/gif');
      res.setHeader('Cache-Control', forceRefresh ? 'no-cache' : 'public, s-maxage=2592000');

      res.redirect(301, `https://cdn.itemdb.com.br/${path}`);
      return;
    } else {
      const img = await axios.get(`https://images.neopets.com/items/${img_id}.gif`, {
        responseType: 'arraybuffer',
      });

      if (!img) throw 'Image not found';

      const buffer = Buffer.from(new Uint8Array(img.data));

      await uploadToS3(path, buffer, 'image/gif');

      res
        .writeHead(200, {
          'Content-Type': 'image/gif',
          'Content-Length': buffer.length,
          'Cache-Control': forceRefresh ? 'no-cache' : 'public, s-maxage=604800',
        })
        .end(buffer);

      return;
    }
  } catch (e) {
    console.error(e);
    const img = await loadImage('./public/item-error.png');

    if (!canvas || !ctx) {
      canvas = createCanvas(80, 80);
      ctx = canvas.getContext('2d');
    }

    ctx.drawImage(img, 0, 0);

    const buffer = await canvas.encode('png');

    res
      .writeHead(400, {
        'Content-Type': 'image/jpeg',
        'Content-Length': buffer.length,
        'Cache-Control': 'no-cache',
        'Error-Image': 'true',
      })
      .end(buffer);

    return;
  }
}
