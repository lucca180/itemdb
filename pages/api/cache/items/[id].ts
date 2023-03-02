import type { NextApiRequest, NextApiResponse } from 'next';
import { createCanvas, loadImage } from 'canvas';
import { ImageBucket } from '../../../../utils/googleCloud';
import axios from 'axios';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET')
    throw new Error(`The HTTP ${req.method} method is not supported at this route.`);

  const { id, refresh } = req.query;

  let canvas;
  let ctx;

  try {
    if (!id) return res.status(400).send('No image id provided');

    const img_id = (id as string).split('.')[0];

    const file = ImageBucket.file('items/' + img_id + '.gif');
    const [exists] = await file.exists();

    const forceRefresh = refresh === 'true';

    if (exists && !forceRefresh) {
      const [data] = await file.download();

      res.setHeader('Content-Type', 'image/gif');
      res.setHeader('Cache-Control', 'public, max-age=604800');
      return res.send(data);
    } else {
      const img = await axios.get(`https://images.neopets.com/items/${img_id}.gif`, {
        responseType: 'arraybuffer',
      });

      if (!img) throw 'Image not found';

      const buffer = Buffer.from(new Uint8Array(img.data));

      await file.save(buffer);

      res.writeHead(200, {
        'Content-Type': 'image/gif',
        'Content-Length': buffer.length,
        'Cache-Control': 'public, max-age=604800',
      });

      return res.end(buffer);
    }
  } catch (e) {
    const img = await loadImage('./public/oops.jpg');

    if (!canvas || !ctx) {
      canvas = createCanvas(80, 80);
      ctx = canvas.getContext('2d');
    }

    ctx.drawImage(img, 0, 0);

    res.setHeader('Content-Type', 'image/jpeg');

    const buffer = canvas.toBuffer();

    res.writeHead(200, {
      'Content-Type': 'image/jpeg',
      'Content-Length': buffer.length,
      'Cache-Control': 'no-cache',
    });

    return res.end(buffer);
  }
}
