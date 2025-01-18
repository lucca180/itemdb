/* eslint-disable @typescript-eslint/no-non-null-assertion */
import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';
import { getManyItems } from '../items/many';
import prisma from '../../../../utils/prisma';
import { UserList } from '../../../../types';
import { rawToList } from '../lists/[username]';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return GET(req, res);

  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function GET(req: NextApiRequest, res: NextApiResponse<any>) {
  let { limit } = req.query;
  if (!limit) limit = '8';

  const sorted = await getTrendingItems(parseInt(limit as string));
  return res.status(200).json(sorted);
}

export const getTrendingItems = async (limit: number) => {
  const statsRes = await axios.get(
    'https://simpleanalytics.com/itemdb.com.br.json?version=5&fields=pages&start=today-7d&pages=/item*&limit=' +
      (limit + 10),
    {
      headers: {
        'Api-Key': `${process.env.SA_API_KEY}`,
      },
    }
  );

  const popularItemsStats: any = {};

  statsRes.data.pages.map((pageData: any) => {
    const slug = pageData.value.split('/').pop();

    popularItemsStats[slug] = {
      slug: pageData.value.split('/').pop(),
      pageviews: pageData.pageviews,
      visitors: pageData.visitors,
    };
  });

  const items = await getManyItems({ slug: Object.keys(popularItemsStats) });
  const sorted = Object.values(items).sort((a, b) => {
    if (popularItemsStats[a.slug!].pageviews > popularItemsStats[b.slug!].pageviews) return -1;
    if (popularItemsStats[a.slug!].pageviews < popularItemsStats[b.slug!].pageviews) return 1;
    return 0;
  });

  return sorted.slice(0, limit);
};

const FEATURED_SLUGS = process.env.FEATURED_LISTS?.split(',') ?? [];
const FEATURED_UNTIL = process.env.FEATURED_UNTIL ? Number(process.env.FEATURED_UNTIL) : null;

export const getTrendingLists = async (limit: number) => {
  const statsRes = await axios.get(
    'https://simpleanalytics.com/itemdb.com.br.json?version=5&fields=pages&start=today-7d&pages=/lists/official/*&limit=' +
      limit * 5,
    {
      headers: {
        'Api-Key': `${process.env.SA_API_KEY}`,
      },
    }
  );

  const popularListsStats: any = {};

  statsRes.data.pages.map((pageData: any) => {
    const slug = pageData.value.split('/').pop();

    popularListsStats[slug] = {
      slug: pageData.value.split('/').pop(),
      pageviews: pageData.pageviews,
      visitors: pageData.visitors,
    };
  });

  const isFeaturedActive = FEATURED_UNTIL ? Date.now() < FEATURED_UNTIL : false;

  const lists = await prisma.userList.findMany({
    where: {
      slug: {
        in: [...(isFeaturedActive ? FEATURED_SLUGS : []), ...Object.keys(popularListsStats)],
      },
      official: true,
    },
    include: { user: true, items: true },
  });

  const sorted = lists.sort((a, b) => {
    const aPageViews = popularListsStats[a.slug!]?.pageviews ?? 0;
    const bPageViews = popularListsStats[b.slug!]?.pageviews ?? 0;

    return bPageViews - aPageViews;
  });

  const featuredLists = (
    isFeaturedActive ? sorted.filter((list) => FEATURED_SLUGS.includes(list.slug ?? '')) : []
  ).sort((a, b) => FEATURED_SLUGS.indexOf(a.slug ?? '') - FEATURED_SLUGS.indexOf(b.slug ?? ''));

  const otherLists = isFeaturedActive
    ? sorted.filter((list) => !FEATURED_SLUGS.includes(list.slug ?? ''))
    : sorted;

  const sortedLists: UserList[] = [...featuredLists, ...otherLists].map((listRaw) =>
    rawToList(listRaw, listRaw.user)
  );

  return sortedLists.slice(0, limit);
};
