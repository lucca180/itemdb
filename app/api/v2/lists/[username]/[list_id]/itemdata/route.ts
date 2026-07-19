import { wantsFresh } from '@app/server/items/itemV2Cache';
import { ListService } from '@services/ListService';
import { parseItemIntent } from '@types';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import { trackItemQuota } from '@utils/api/redis';
import { after } from 'next/server';
import type { NextRequest } from 'next/server';

type RouteContext = {
  params: Promise<{ username: string; list_id: string }>;
};

/**
 * GET /api/v2/lists/[username]/[list_id]/itemdata
 *
 * Returns a list's items as `ItemV2` (v2 counterpart of the v1 `itemdata`
 * endpoint). Permission is resolved from the session cookie (not a JWT), so a
 * private list is only visible to those `canSeeList` allows. Hidden items are
 * opt-in via `?includeHidden=true` and still gated to the owner/admin.
 *
 * Query params: `intent` (default `card`), `asObject` (v1 parity),
 * `includeHidden`, `fresh`.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { username, list_id } = await context.params;
  if (!username || !list_id) {
    return Response.json({ error: 'Invalid Request' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const intent = parseItemIntent(searchParams.get('intent'), 'card');
  if (!intent) {
    return Response.json({ error: 'Invalid intent' }, { status: 400 });
  }

  const asObject = searchParams.get('asObject') === 'true';
  const includeHidden = searchParams.get('includeHidden') === 'true';
  const fresh = wantsFresh(request.url);

  // List resolution, visibility (`canSeeList`), the dynamic-search guard and
  // hidden-item authorization all live in `ListService.getListItemsV2`; the
  // route only owns the HTTP concerns below. `includeHidden` is a request flag
  // that the service still gates to the owner/admin.
  const { user: viewer } = await getServerCurrentUser();
  const result = await ListService.initUser(viewer).getListItemsV2({
    username,
    list_id_or_slug: list_id,
    intent,
    asObject,
    includeHidden,
    fresh,
  });

  if (!result) {
    // Don't let CDNs cache the 404.
    return Response.json(
      { error: 'List not found' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const { data, dbCount, list } = result;

  // Only Prisma-backed items count; quota is off the hot path.
  if (dbCount > 0) {
    after(() => trackItemQuota(dbCount, request));
  }

  return Response.json(data, {
    status: 200,
    headers: {
      // Any `includeHidden` request stays private — never let the CDN cache a
      // hidden-items variant (even when the flag ends up ungranted).
      'Cache-Control': cacheControl({ includeHidden, fresh, official: !!list.official }),
    },
  });
}

/**
 * Owner (hidden) views and `fresh` requests are never CDN-cached. Public views
 * mirror the v1 TTLs — official lists live longer than user lists.
 */
function cacheControl(opts: { includeHidden: boolean; fresh: boolean; official: boolean }): string {
  if (opts.includeHidden || opts.fresh) return 'private, no-store';
  return opts.official
    ? 'public, max-age=0, s-maxage=1800, stale-while-revalidate=3600'
    : 'public, max-age=0, s-maxage=180, stale-while-revalidate=300';
}
