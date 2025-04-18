import { NextApiRequest, NextApiResponse } from 'next';
import { getItem } from '.';
import { doSearch } from '../../search';
import { ItemData } from '../../../../../types';
import { defaultFilters } from '../../../../../utils/parseFilters';

export type DyeworksData = {
  originalItem: ItemData;
  dyes: ItemData[];
};

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function GET(req: NextApiRequest, res: NextApiResponse) {
  const id_name = req.query.id_name as string;
  const internal_id = Number(id_name);
  const name = isNaN(internal_id) ? (id_name as string) : undefined;

  const item = await getItem(name ?? internal_id);
  if (!item) return null;

  const result = await getDyeworksData(item);

  return res.status(200).json(result);
}

export const getDyeworksData = async (item: ItemData): Promise<DyeworksData | null> => {
  const notDyeworksName = item.name.includes(':')
    ? item.name.split(':').slice(1).join(':').trim()
    : item.name;

  const search = await doSearch(notDyeworksName, { ...defaultFilters, limit: 1000 }, false);
  if (!search.content.length) return null;

  const dyes = search.content.filter(
    (i) =>
      i.name.toLowerCase().includes(notDyeworksName.toLowerCase()) &&
      i.name !== notDyeworksName &&
      (i.name.toLowerCase().includes('dyeworks') || i.name.toLowerCase().includes('prismatic'))
  );

  const originalItem = search.content.find((i) => i.name === notDyeworksName);
  if (!originalItem || !dyes.length) return null;

  return {
    originalItem,
    dyes,
  };
};
