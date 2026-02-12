import { NextApiRequest, NextApiResponse } from 'next';
import queryString from 'query-string';
import { defaultFilters, parseFilters } from '../../../../utils/parseFilters';
import { doSearch } from '.';
import prisma from '../../../../utils/prisma';
import { UserList } from '../../../../types';
import Fuse from 'fuse.js';
import { restockShopInfo } from '../../../../utils/utils';
import { rawToList } from '@services/ListService';
import { UserList as RawList, User as RawUser } from '@prisma/generated/client';

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
  const reqQuery = queryString.parse(req.url!.split('?')[1], {
    arrayFormat: 'bracket',
  }) as any;
  const query = (reqQuery.s as string)?.trim() ?? '';

  const searchFilters = { ...defaultFilters };
  searchFilters.sortBy = 'match';
  searchFilters.limit = Number(reqQuery.limit) || 5;

  const searchProm = doSearch(query, searchFilters, false);

  const listProm = getListsRaw(query);

  let [searchRes, listRes] = await Promise.all([searchProm, listProm]);

  if (!searchRes.content.length) {
    searchFilters.sortBy = 'name';
    searchFilters.mode = 'fuzzy';
    searchRes = await doSearch(query, searchFilters, false);
  }

  const userLists: UserList[] = listRes.map((listRaw) => rawToList(listRaw, listRaw.user));

  const fuze = new Fuse(
    Object.values(restockShopInfo).filter((x) => Number(x.id) > 0),
    {
      keys: ['name'],
      threshold: 0.2,
      ignoreLocation: true,
    }
  );

  const shop = fuze.search(query);
  const result = shop.map((x) => x.item).slice(0, 1);

  return res.status(200).json({ items: searchRes.content, lists: userLists, restockShop: result });
};

const getListsRaw = async (query: string, limit = 3) => {
  const originalQuery = query;
  const [, querySanitized] = parseFilters(originalQuery, false);
  query = querySanitized.trim() ?? '';

  const listsRaw: (RawList & RawUser)[] = await prisma.$queryRaw`
    select ul.*, u.username, u.neo_user, u.last_login from UserList ul 
    left join User u on ul.user_id = u.id
    where ul.official = 1
    and (MATCH (ul.name, ul.description) AGAINST (${query} IN NATURAL LANGUAGE MODE) OR ul.name LIKE ${`%${originalQuery}%`} OR ul.description LIKE ${`%${originalQuery}%`})
    order by
      name = ${originalQuery} DESC,
      updatedAt DESC
  `;

  return [...listsRaw]
    .map((listRaw) => {
      return {
        ...listRaw,
        user: {
          id: listRaw.user_id,
          username: listRaw.username,
          neo_user: listRaw.neo_user,
          last_login: listRaw.last_login?.toJSON() ?? null,
        },
      };
    })
    .slice(0, limit) as unknown as (RawList & { user: RawUser })[];
};
