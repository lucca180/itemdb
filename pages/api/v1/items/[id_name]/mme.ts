import { NextApiRequest, NextApiResponse } from 'next';
import { getItem } from '.';
import { doSearch } from '../../search';
import { ItemData, ItemMMEData } from '../../../../../types';
import { defaultFilters } from '../../../../../utils/parseFilters';

const mmeRegex = /^(mini)?(MME)(\d+)/i;

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function GET(req: NextApiRequest, res: NextApiResponse) {
  const result = await getMMEData(req.query.id_name as string);

  return res.status(200).json(result);
}

export const getMMEData = async (id_name: string | number): Promise<ItemMMEData | null> => {
  const internal_id = Number(id_name);
  const name = isNaN(internal_id) ? (id_name as string) : undefined;

  const item = await getItem(name ?? internal_id);
  if (!item) return null;

  if (!isMME(item.name)) return null;
  const mmeName = item.name.match(mmeRegex)![0];

  const search = await doSearch(mmeName, { ...defaultFilters, limit: 1000 });

  if (!search) return null;
  const mmeItems = search.content.filter((i) => i.name.match(mmeRegex)?.[0] === mmeName);
  const firstOne = mmeItems.find((i) => i.name.toLowerCase().includes('s1'));
  const bonus = mmeItems.find((i) => i.name.toLowerCase().includes(mmeName.toLowerCase() + '-b'));

  if (!firstOne || !bonus) return null;

  const trails: { [name: string]: ItemData[] } = {};
  const allTrails: ItemData[] = [];
  for (const mmeItem of mmeItems) {
    if (mmeItem.name === firstOne.name || mmeItem.name === bonus.name) continue;

    const trailName = mmeItem.name.match(/(?<=S\d)[a-z]/gim)?.[0];
    if (!trailName) {
      allTrails.push(mmeItem);
      continue;
    }

    if (!trails[trailName]) trails[trailName] = [];
    trails[trailName].push(mmeItem);
  }

  Object.keys(trails).forEach((key) => {
    trails[key].push(...allTrails);
    trails[key] = trails[key].sort((a, b) => a.name.localeCompare(b.name));
  });

  if (Object.keys(trails).length === 0) {
    trails['A'] = allTrails;
  }

  return {
    name: mmeName,
    isMini: mmeName.toLowerCase().includes('mini'),
    initial: firstOne,
    bonus,
    trails,
  };
};

export const isMME = (name: string) => !!name.match(mmeRegex);
