import { getRestockPracticePool } from '@app/[locale]/restock/[id]/practice/loadPracticePool';
import { restockShopInfo } from '@utils/utils';

type RouteContext = {
  params: Promise<{ shopId: string }>;
};

/**
 * GET /api/v2/restock/[shopId]/practice
 *
 * Item pool for the restock practice mode. Same payload for everyone, so it is
 * CDN-cacheable — the client fetches it once and generates every refresh locally.
 * Clients add `?v=PRACTICE_POOL_VERSION` only to key the caches; the latest shape is always served.
 */
export async function GET(_request: Request, context: RouteContext) {
  const { shopId } = await context.params;
  const shopInfo = restockShopInfo[shopId];

  if (!shopInfo || Number(shopInfo.id) < 0) {
    return Response.json({ error: 'Shop not found' }, { status: 404 });
  }

  const pool = await getRestockPracticePool(shopInfo);

  return Response.json(pool, {
    headers: {
      // 10 min in the browser, 3 h on the CDN (needs a Cloudflare Cache Rule for this path)
      'Cache-Control': 'public, max-age=600, s-maxage=10800',
    },
  });
}
