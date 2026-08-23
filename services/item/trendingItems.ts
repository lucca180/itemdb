import { getClient } from '@umami/api-client';
import { ItemService } from '@services/ItemService';
import type { ItemV2For } from '@types';

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

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

export type UmamiItemPageviewsOptions = {
  limit?: number;
  nowMs?: number;
  windowMs?: number;
};

/** Path metrics for `/item/...` keyed by slug. NP and NC share the same map. */
export async function getUmamiItemPageviews(
  options: UmamiItemPageviewsOptions = {}
): Promise<Map<string, number>> {
  const nowMs = options.nowMs ?? Date.now();
  const windowMs = options.windowMs ?? FIVE_DAYS_MS;
  const limit = options.limit ?? 500;

  const statsRes = (await client.getWebsiteMetrics(env.site_id, {
    startAt: nowMs - windowMs,
    endAt: nowMs,
    type: env.type,
    // @ts-expect-error missing types
    search: 'item/',
    excludeBounce: true,
    limit,
  })) as WebsiteMetrics;

  const pageviews = new Map<string, number>();
  for (const row of statsRes.data ?? []) {
    const slug = row.x.split('/').pop();
    if (!slug) continue;
    pageviews.set(slug, (pageviews.get(slug) ?? 0) + row.y);
  }
  return pageviews;
}

export async function getTrendingItemsV2(limit: number): Promise<ItemV2For<'card'>[]> {
  const pageviews = await getUmamiItemPageviews({ limit: limit + 10 });

  const items = await ItemService.getManyItems(
    { type: 'slug', data: [...pageviews.keys()] },
    { intent: 'card' }
  );

  const sorted = Object.values(items).sort((a, b) => {
    const aViews = a.slug ? (pageviews.get(a.slug) ?? 0) : 0;
    const bViews = b.slug ? (pageviews.get(b.slug) ?? 0) : 0;
    return bViews - aViews;
  });

  return sorted.slice(0, limit);
}
