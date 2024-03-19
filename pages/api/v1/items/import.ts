import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';
import axios from 'axios';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const items = (await prisma.$queryRaw`
    select * from dti_items di where not exists (select 1 from items i where i.item_id = di.id) and id > 0
  `) as any[];

  const itemInserts = items.map((item) => {
    return {
      name: item.name,
      description: item.description,
      subText: '(wearable) (dti import)',
      rarity: item.rarity_index,
      itemId: item.id,
      img: item.thumbnail_url,
      category: item.type,
      estVal: item.price,
      weight: item.weight_lbs,
    };
  });
  console.log('sending');
  await axios.post(
    'https://itemdb.com.br/api/v1/items',
    JSON.stringify({
      lang: 'en',
      items: itemInserts,
      hash: 'a',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  return res.json(itemInserts);
}
