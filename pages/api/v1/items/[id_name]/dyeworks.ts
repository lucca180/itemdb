import { NextApiRequest, NextApiResponse } from 'next';
import { getItem } from '.';
import { doSearch } from '../../search';
import { ItemData } from '../../../../../types';
import { defaultFilters } from '../../../../../utils/parseFilters';

export type DyeworksData = {
  originalItem: ItemData;
  dyes: ItemData[];
};

const isDyeworkVariant = (name: string) => {
  const lower = name.toLowerCase();
  return lower.includes('dyeworks') || lower.includes('prismatic');
};

const getBaseName = (name: string) =>
  name.includes(':') ? name.split(':').slice(1).join(':').trim() : name;

const isSameName = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

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
  if (!item) return res.status(404).json({ error: 'Item not found' });

  const result = await getDyeworksData(item);

  return res.status(200).json(result);
}

export const getDyeworksData = async (item: ItemData): Promise<DyeworksData | null> => {
  const baseName = getBaseName(item.name);
  const itemIsVariant = isDyeworkVariant(item.name);

  const search = await doSearch(baseName, { ...defaultFilters, limit: 1000, mode: 'name' }, false);
  if (!search.content.length) return null;

  const baseNameLower = baseName.toLowerCase();

  const originalFromSearch = search.content.find(
    (i) => !isDyeworkVariant(i.name) && isSameName(i.name, baseName)
  );

  const originalItem =
    !itemIsVariant && isSameName(item.name, baseName) ? item : originalFromSearch;

  const familyDyes = search.content.filter(
    (i) => isDyeworkVariant(i.name) && i.name.toLowerCase().includes(baseNameLower)
  );

  if (!originalItem || !familyDyes.length) return null;

  return {
    originalItem,
    dyes: familyDyes,
  };
};
