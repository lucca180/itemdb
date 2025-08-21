import { NextApiRequest, NextApiResponse } from 'next';
import { getItem } from '.';
import { ItemData, SearchFilters } from '../../../../../types';
import { doSearch } from '../../search';
import { defaultFilters } from '../../../../../utils/parseFilters';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id_name } = req.query;
  if (!id_name) return res.status(400).json({ error: 'Invalid Request' });
  const internal_id = Number(id_name);
  const name = isNaN(internal_id) ? (id_name as string) : undefined;

  const item = await getItem(name ?? internal_id);

  if (!item) return res.status(404).json({ error: 'Item not found' });

  const similarItems = await getSimilarItems(item);
  return res.json(similarItems);
}

export const getSimilarItems = async (item: ItemData, limit = 4) => {
  const filters: SearchFilters = {
    ...defaultFilters,
    limit: 20,
    mode: 'natural',
    sortBy: 'match',
    sortDir: 'desc',
  };

  const rawResult = (await doSearch(item.name, filters, false)).content.filter(
    (x) => x.internal_id !== item.internal_id
  );

  if (!rawResult || rawResult.length < 2) {
    const fuzzy = await doSearch(
      item.name,
      {
        ...filters,
        mode: 'fuzzy',
      },
      false
    );

    return fuzzy.content.filter((i) => i.internal_id !== item.internal_id).slice(0, limit);
  }

  const notDyeworksName = item.name.includes(':')
    ? item.name.split(':').slice(1).join(':').trim()
    : item.name;

  const allItems = rawResult.filter(
    (i) =>
      !(
        i.name.toLowerCase().includes(notDyeworksName.toLowerCase()) &&
        i.name.toLowerCase().includes('dyeworks')
      ) && (item.name !== notDyeworksName ? i.name !== notDyeworksName : true)
  );

  return allItems.splice(0, limit);
};
