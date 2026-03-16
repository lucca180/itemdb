import { NextApiRequest, NextApiResponse } from 'next';
import queryString from 'query-string';
import { defaultFilters, parseFilters } from '../../../../utils/parseFilters';
import { doSearch } from '.';
import prisma from '../../../../utils/prisma';
import { ShopInfo, User, UserList } from '../../../../types';
import Fuse from 'fuse.js';
import { categoryToShopID, restockShopInfo } from '../../../../utils/utils';
import { rawToList } from '@services/ListService';
import { Prisma, UserList as RawList, User as RawUser } from '@prisma/generated/client';
import { CheckAuth } from '@utils/googleCloud';

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
  let user: User | null = null;
  try {
    user = (await CheckAuth(req)).user;
    if (!user || !user.isAdmin) throw new Error('Unauthorized');
  } catch (e) {}

  const reqQuery = queryString.parse(req.url!.split('?')[1], {
    arrayFormat: 'bracket',
  }) as any;
  const query = (reqQuery.s as string)?.trim() ?? '';

  const searchFilters = { ...defaultFilters };
  searchFilters.sortBy = 'match';
  searchFilters.limit = Number(reqQuery.limit) || 5;

  const searchProm = doSearch(query, searchFilters, false);

  const officialListsRaw = getListsRaw(query, 5);
  const userListsRaw = user ? getListsRaw(query, 5, user?.id) : [];

  let [searchRes, listRes, userListsRes] = await Promise.all([
    searchProm,
    officialListsRaw,
    userListsRaw,
  ]);

  if (!searchRes.content.length) {
    searchFilters.sortBy = 'name';
    searchFilters.mode = 'fuzzy';
    searchRes = await doSearch(query, searchFilters, false);
  }

  const officialLists: UserList[] = listRes.map((listRaw) => rawToList(listRaw, listRaw.user));
  const userLists: UserList[] = userListsRes.map((listRaw) => rawToList(listRaw, listRaw.user));

  const fuze = new Fuse(
    Object.values(restockShopInfo).filter((x) => Number(x.id) > 0),
    {
      keys: ['name'],
      threshold: 0.2,
      ignoreLocation: true,
    }
  );

  const shop = fuze.search(query);

  const maxShopResults = 3;
  const shops = shop.map((x) => x.item).slice(0, maxShopResults);
  const items = searchRes.content;

  // If we don't have enough shop results,
  // let's try to find some based on the categories of the items we found
  if (shops.length < maxShopResults) {
    const allCategories = new Map<string, number>();
    items.forEach((item) => {
      if (!item.category) return;
      const a = allCategories.get(item.category) ?? 0;
      allCategories.set(item.category, a + 1);
    });

    const sortedCategories = Array.from(allCategories.entries()).sort((a, b) => b[1] - a[1]);
    const topCategories = sortedCategories.slice(0, 3).map((x) => x[0]);

    const additionalShops = topCategories
      .map((category) => {
        const categoryInfo = restockShopInfo[categoryToShopID[category.toLowerCase()]];
        if (categoryInfo && Number(categoryInfo.id) > 0) return categoryInfo;
        return null;
      })
      .filter((x) => Boolean(x)) as ShopInfo[];

    shops.push(...additionalShops.slice(0, maxShopResults - shops.length));
  }

  return res.status(200).json({
    items: searchRes.content,
    officialLists: officialLists,
    userLists,
    restockShop: shops,
  });
};

const getListsRaw = async (query: string, limit = 3, userId?: string) => {
  const originalQuery = query;
  const [, querySanitized] = parseFilters(originalQuery, false);
  query = querySanitized.trim() ?? '';

  const filter = userId ? Prisma.sql`ul.user_id = ${userId}` : Prisma.sql`ul.official = 1`;

  const listsRaw: (RawList & RawUser)[] = await prisma.$queryRaw`
    select ul.*, u.username, u.neo_user, u.last_login from UserList ul 
    left join User u on ul.user_id = u.id
    where ${filter}
    and (MATCH (ul.name, ul.description) AGAINST (${originalQuery} IN NATURAL LANGUAGE MODE) OR ul.name LIKE ${`%${originalQuery}%`} OR ul.description LIKE ${`%${originalQuery}%`})
    order by
      name = ${originalQuery} DESC,
      match (ul.name) AGAINST (${originalQuery} IN NATURAL LANGUAGE MODE) DESC,
      updatedAt DESC
    LIMIT ${limit}
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
