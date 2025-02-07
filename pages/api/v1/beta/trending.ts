import { NextApiRequest, NextApiResponse } from 'next';
import { getManyItems } from '../items/many';
import prisma from '../../../../utils/prisma';
import { UserList } from '../../../../types';
import { rawToList } from '../lists/[username]';
import { getClient } from '@umami/api-client';
import { restockShopInfo, slugify } from '../../../../utils/utils';

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

const client = getClient();

type WebsiteMetrics = {
  data: {
    x: string;
    y: number;
  }[];
};

export const getTrendingItems = async (limit: number) => {
  const statsRes = (await client.getWebsiteMetrics('df660da1-6f93-4dda-9da5-5028fb9db292', {
    startAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).getTime(),
    endAt: Date.now(),
    type: 'url',
    // @ts-expect-error missing type
    search: 'item',
    limit: limit + 10,
  })) as WebsiteMetrics;

  const popularItemsStats: any = {};

  statsRes.data.map((data) => {
    const slug = data.x.split('/').pop();
    if (!slug) return;

    popularItemsStats[slug] = {
      slug: slug,
      pageviews: data.y,
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
  const statsRes = (await client.getWebsiteMetrics('df660da1-6f93-4dda-9da5-5028fb9db292', {
    startAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).getTime(),
    endAt: Date.now(),
    type: 'url',
    // @ts-expect-error missing type
    search: 'lists/official/',
    limit: limit * 2,
  })) as WebsiteMetrics;

  const popularListsStats: any = {};

  statsRes.data.map((pageData) => {
    const slug = pageData.x.split('/').pop();
    if (!slug) return;

    popularListsStats[slug] = {
      slug: slug,
      pageviews: pageData.y,
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

export const getTrendingShops = async (limit: number) => {
  const statsRes = (await client.getWebsiteMetrics('df660da1-6f93-4dda-9da5-5028fb9db292', {
    startAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).getTime(),
    endAt: Date.now(),
    type: 'url',
    // @ts-expect-error missing type
    search: 'restock/',
    limit: limit * 2,
  })) as WebsiteMetrics;

  const popularShopsStats: any = {};

  statsRes.data.map((pageData) => {
    const slug = pageData.x.split('/').pop();
    if (!slug || slug.includes('dashboard')) return;

    popularShopsStats[slug] = {
      slug: slug,
      pageviews: pageData.y,
    };
  });

  const shops = Object.values(restockShopInfo).filter(
    (shop) => !!popularShopsStats[slugify(shop.name)]
  );

  const sorted = shops.sort((a, b) => {
    const aPageViews = popularShopsStats[slugify(a.name)]?.pageviews ?? 0;
    const bPageViews = popularShopsStats[slugify(b.name)]?.pageviews ?? 0;

    return bPageViews - aPageViews;
  });

  return sorted.slice(0, limit);
};
