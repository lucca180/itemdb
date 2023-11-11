import { NextApiRequest, NextApiResponse } from 'next';
import Vibrant from 'node-vibrant';
import { restockShopInfo } from '../../../../utils/utils';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const ids = Object.keys(restockShopInfo);
  const newShopInfo: any = { ...restockShopInfo };

  const promises = [];
  for (const id of ids) {
    const x = Vibrant.from(`https://images.neopets.com/shopkeepers/w${id}.gif`)
      .getPalette()
      .then((palette) => {
        if (!palette.Vibrant) return console.error(`No vibrant color for ${id}`);

        newShopInfo[id].color = palette.Vibrant.hex;
        newShopInfo[id].id = id;
      });

    promises.push(x);
  }

  await Promise.all(promises);

  res.status(200).json(newShopInfo);
}
