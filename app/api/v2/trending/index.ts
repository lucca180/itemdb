import { getClient } from '@umami/api-client';
import { getManyItemsV2 } from '@app/server/items/v2';
import type { ItemV2For } from '@types';

const getUmamiEnv = () => {
  const suffix = '_2';

  return {
    site_id: process.env[`NEXT_PUBLIC_UMAMI_ID${suffix}`] || '',
    user_id: process.env[`UMAMI_API_CLIENT_USER_ID${suffix}`] || '',
    secret: process.env[`UMAMI_API_CLIENT_SECRET${suffix}`] || '',
    endpoint: process.env[`UMAMI_API_CLIENT_ENDPOINT${suffix}`] || '',
    type: !suffix ? 'url' : 'path',
  };
};

const env = getUmamiEnv();
const client = getClient({
  userId: env.user_id,
  secret: env.secret,
  apiEndpoint: env.endpoint,
});

type WebsiteMetrics = {
  data: {
    x: string;
    y: number;
  }[];
};

export async function getTrendingItemsV2(limit: number): Promise<ItemV2For<'card'>[]> {
  const statsRes = (await client.getWebsiteMetrics(env.site_id, {
    startAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).getTime(),
    endAt: Date.now(),
    type: env.type,
    // @ts-expect-error missing type
    search: 'item/',
    limit: limit + 10,
  })) as WebsiteMetrics;

  const popularItemsStats: Record<string, { slug: string; pageviews: number }> = {};

  statsRes.data.map((data) => {
    const slug = data.x.split('/').pop();
    if (!slug) return;

    popularItemsStats[slug] = {
      slug: slug,
      pageviews: data.y,
    };
  });

  const items = await getManyItemsV2({ slug: Object.keys(popularItemsStats) }, { intent: 'card' });

  const sorted = Object.values(items).sort((a, b) => {
    if (popularItemsStats[a.slug!]?.pageviews > popularItemsStats[b.slug!]?.pageviews) return -1;
    if (popularItemsStats[a.slug!]?.pageviews < popularItemsStats[b.slug!]?.pageviews) return 1;
    return 0;
  });

  return sorted.slice(0, limit);
}
