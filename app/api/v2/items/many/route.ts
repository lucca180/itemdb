import { itemCacheControl, wantsFresh } from '@app/server/items/itemV2Cache';
import { parseManyItemsV2Query, parseManyItemsV2SearchParams } from '@app/api/v2/items/parse';
import { ItemService } from '@services/ItemService';
import { trackItemQuota } from '@utils/api/redis';
import { parseItemIntent } from '@types';
import { after } from 'next/server';
import type { NextRequest } from 'next/server';

const MANY_LIMIT = 10_000;

/**
 * Shared GET/POST handler for /api/v2/items/many.
 * Body is a pre-joined JSON object string from the cache layer.
 */
async function handleMany(
  rawParams: Record<string, unknown>,
  request: NextRequest,
  method: 'GET' | 'POST'
) {
  const intent = parseItemIntent(rawParams.intent, 'minimal');
  if (!intent) {
    return Response.json({ error: 'Invalid intent' }, { status: 400 });
  }

  const query = parseManyItemsV2Query(rawParams);
  if (!query) {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  // `fresh` is always read from the query string (works for POST too).
  const fresh = wantsFresh(request.url);
  const { body, dbCount } = await ItemService.getCachedManyItems(query, {
    intent,
    limit: MANY_LIMIT,
    fresh,
  });

  // Only Prisma-backed items count; full Redis hits leave dbCount at 0.
  // Quota is off the hot path — schedule it after the response is sent.
  if (dbCount > 0) {
    after(() => trackItemQuota(dbCount, request));
  }

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // GET → CDN; POST → private (Redis still used server-side).
      'Cache-Control': itemCacheControl(intent, { fresh, method }),
    },
  });
}

export async function GET(request: NextRequest) {
  return handleMany(parseManyItemsV2SearchParams(request.url), request, 'GET');
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  return handleMany(body, request, 'POST');
}
