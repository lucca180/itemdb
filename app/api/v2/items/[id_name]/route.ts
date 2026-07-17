import { getCachedItemV2, itemCacheControl, wantsFresh } from '@app/server/items/itemV2Cache';
import { trackItemQuota } from '@utils/api/redis';
import { parseItemIntent } from '@types';
import type { NextRequest } from 'next/server';

type RouteContext = {
  params: Promise<{ id_name: string }>;
};

/**
 * GET /api/v2/items/[id_name]
 * Thin handler: parse → cache-aside → quota on miss → wire-ready JSON body.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { id_name } = await context.params;
  if (!id_name) {
    return Response.json({ error: 'Invalid Request' }, { status: 400 });
  }

  const intentParam = new URL(request.url).searchParams.get('intent');
  const intent = parseItemIntent(intentParam, 'minimal');
  if (!intent) {
    return Response.json({ error: 'Invalid intent' }, { status: 400 });
  }

  const idOrName = Number.isNaN(Number(id_name)) ? id_name : Number(id_name);
  const fresh = wantsFresh(request.url);
  const result = await getCachedItemV2(idOrName, { intent, fresh });

  if (result.status === 'not_found') {
    return Response.json(
      { error: 'Item not found' },
      // Don't let CDNs cache 404s
      { status: 404, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // Hits are free; misses (and ?fresh=1) count toward the API quota.
  if (result.status === 'miss') {
    await trackItemQuota(1, request);
  }

  // `result.body` is already a JSON string — avoid Response.json() re-stringify.
  return new Response(result.body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': itemCacheControl(intent, { fresh, method: 'GET' }),
    },
  });
}
