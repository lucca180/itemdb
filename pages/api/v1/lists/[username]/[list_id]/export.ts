import { NextApiRequest, NextApiResponse } from 'next';
import { AsyncParser } from '@json2csv/node';
import { sortListItems } from '@utils/utils';
import { ListService } from '@services/ListService';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);
}

type ExportListItem = {
  name: string;
  quantity: number;
  rarity: number;
  price: number;
  isInflated: boolean;
  pricedAt: string | null;
  estVal: number | null;
  type: 'nc' | 'np' | 'pb';
  ncPrice: string;
  weight: number | null;
  itemdbSlug: string;
  isWearable: boolean;
  imageId: string;
};

async function GET(req: NextApiRequest, res: NextApiResponse) {
  const { username, list_id: list_id_or_slug } = req.query;
  const isOfficial = username === 'official';

  if (!username || !list_id_or_slug || Array.isArray(username) || Array.isArray(list_id_or_slug))
    return res.status(400).json({ error: 'Bad Request' });

  const listService = await ListService.initReq(req);
  const list = await listService.getList({
    username,
    listId: Number(list_id_or_slug),
    isOfficial,
  });

  if (!list) return res.status(404).json({ error: 'List not found' });

  const itemInfoProm = listService.getListItemInfo({
    list: list,
  });

  const itemDataProm = listService.getListItems({
    list: list,
    asObject: true,
  });

  const [itemInfo, itemDataRaw] = await Promise.all([itemInfoProm, itemDataProm]);

  if (!itemInfo || !itemDataRaw) return res.status(404).json({ error: 'List not found' });

  const sortedItemInfo = itemInfo.sort((a, b) => {
    if (a.isHighlight && !b.isHighlight) return -1;
    if (!a.isHighlight && b.isHighlight) return 1;
    return sortListItems(a, b, list.sortBy, list.sortDir, itemDataRaw);
  });

  const exportData: (ExportListItem | null)[] = sortedItemInfo
    .slice(0, 2000) // Limit to 2000 items for export
    .map((item) => {
      const itemDetails = itemDataRaw[item.item_iid.toString()];

      if (!itemDetails) return null;

      return {
        name: itemDetails.name,
        type: itemDetails.type,
        price: itemDetails.price.value,
        ncPrice: itemDetails.ncValue?.range,
        pricedAt: itemDetails.price.addedAt || itemDetails.ncValue?.addedAt || null,
        quantity: item.amount,
        rarity: itemDetails.rarity,
        estVal: itemDetails.estVal,
        weight: itemDetails.weight,
        isInflated: itemDetails.price.inflated,
        isWearable: itemDetails.isWearable,
        imageId: itemDetails.image_id,
        itemdbSlug: itemDetails.slug,
      };
    })
    .filter((item) => item !== null) as ExportListItem[];

  const parser = new AsyncParser();

  const csv = parser.parse(JSON.stringify(exportData));

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${list.slug}-itemdb-list-export.csv"`
  );
  res.send(csv);
}
