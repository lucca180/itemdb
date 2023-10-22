/* eslint-disable @typescript-eslint/no-non-null-assertion */
import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';
import { getManyItems } from '../items/many';

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
    'https://simpleanalytics.com/itemdb.com.br.json?version=5&fields=pages&start=today-3d&pages=/item*&limit=' +
      limit,
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

  return sorted;
};
