import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../utils/prisma';
import requestIp from 'request-ip';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST')
    throw new Error(`The HTTP ${req.method} method is not supported at this route.`);

  const data = JSON.parse(req.body);

  const tradeLots = data.tradeLots;
  const lang = data.lang;

  if (lang !== 'en') return res.json('nope');

  const promiseArr = [];

  for (const lot of tradeLots) {
    const itemList = [];

    for (const item of lot.items) {
      let { name, img, order } = item;
      let imageId;

      if (!name || !img) continue;

      if (img) img = (img as string).replace(/^[^\/\/\s]*\/\//gim, 'https://');

      if (img) imageId = (img as string).match(/[^\.\/]+(?=\.gif)/)?.[0] ?? null;

      const x = {
        name: name,
        image: img,
        image_id: imageId as string,
        order: order,
      };

      itemList.push(x);
    }

    const prom = prisma.trades.create({
      data: {
        trade_id: Number(lot.tradeID),
        wishlist: lot.wishList,
        owner: lot.owner.slice(0, 3).padEnd(6, '*'),
        ip_address: requestIp.getClientIp(req),
        priced: lot.wishList === 'none',
        processed: lot.wishList === 'none',
        items: {
          create: [...itemList],
        },
      },
    });

    promiseArr.push(prom);
  }

  const result = await Promise.allSettled(promiseArr);

  res.json(result);
}
