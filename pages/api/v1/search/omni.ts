import { NextApiRequest, NextApiResponse } from 'next';
import qs from 'qs';
import { defaultFilters } from '../../../../utils/parseFilters';
import { doSearch } from '.';
import prisma from '../../../../utils/prisma';
import { UserList } from '../../../../types';
import Fuse from 'fuse.js';
import { restockShopInfo } from '../../../../utils/utils';
import { rawToList } from '../lists/[username]';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET' && req.url) return GET(req, res);
  // if (req.method === 'POST') return POST(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  const reqQuery = qs.parse(req.url!.split('?')[1]) as any;
  const query = (reqQuery.s as string)?.trim() ?? '';

  const searchFilters = { ...defaultFilters };
  searchFilters.sortBy = 'match';
  searchFilters.limit = reqQuery.limit || 5;

  const searchProm = doSearch(query, searchFilters, false);

  const listProm = prisma.userList.findMany({
    where: {
      OR: [{ name: { contains: `${query}` } }, { description: { contains: `${query}` } }],
      official: true,
    },
    include: {
      items: true,
      user: true,
    },
    take: 3,
    orderBy: [
      {
        _relevance: {
          fields: ['name'],
          search: `*${query}*`,
          sort: 'asc',
        },
      },
      {
        _relevance: {
          fields: ['description'],
          search: `*${query}*`,
          sort: 'asc',
        },
      },
    ],
  });

  let [searchRes, listRes] = await Promise.all([searchProm, listProm]);

  if (!searchRes.content.length) {
    searchFilters.sortBy = 'name';
    searchFilters.mode = 'fuzzy';
    searchRes = await doSearch(query, searchFilters, false);
  }

  const userLists: UserList[] = listRes.map((listRaw) => rawToList(listRaw, listRaw.user));

  const fuze = new Fuse(Object.values(restockShopInfo), {
    keys: ['name'],
    threshold: 0.2,
    ignoreLocation: true,
  });

  const shop = fuze.search(query);
  const result = shop.map((x) => x.item).slice(0, 1);

  return res.status(200).json({ items: searchRes.content, lists: userLists, restockShop: result });
};
