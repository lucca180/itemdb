import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../utils/prisma';
import requestIp from 'request-ip';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST')
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );

  const data = JSON.parse(req.body);

  const itemPrices = data.itemPrices;
  const lang = data.lang;

  const dataList = [];
  for (const priceInfo of itemPrices) {
    let { name, img, owner, stock, value, otherInfo, type, item_id } =
      priceInfo;
    let imageId: string | null = null;

    stock = isNaN(Number(stock)) ? undefined : Number(stock);
    value = isNaN(Number(value)) ? undefined : Number(value);
    item_id = isNaN(Number(item_id)) ? undefined : Number(item_id);

    if (!name || !value) continue;

    if (typeof stock === undefined || typeof value === undefined)
      return res.status(401).send('Invalid Data');

    if (img) img = (img as string).replace(/^[^\/\/\s]*\/\//gim, 'https://');

    if (img) imageId = (img as string).match(/[^\.\/]+(?=\.gif)/)?.[0] ?? null;

    const x = {
      name: name,
      item_id: item_id,
      image: img,
      image_id: imageId,
      owner: owner.slice(0, 3).padEnd(6, '*'),
      type: type,
      stock: stock,
      price: value,
      otherInfo: otherInfo?.toString(),

      language: lang,
      ip_address: requestIp.getClientIp(req),
    };

    dataList.push(x);
  }

  const result = await prisma.priceProcess.createMany({
    data: dataList,
    skipDuplicates: true,
  });

  res.json(result);
}
