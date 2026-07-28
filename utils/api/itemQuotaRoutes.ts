/**
 * Blocklist of API routes that feed the per-IP item quota.
 * Only these routes run Redis.checkBan in proxy.ts early-reject.
 * Routes that call redis_setDataCount / trackItemQuota MUST match here
 * (enforced by test/item-quota-routes.guard.test.ts).
 */
export const ITEM_QUOTA_ROUTES = {
  GET: [
    /^\/api\/v[12]\/items(\/|$)/,
    /^\/api\/v[12]\/search(\/|$)/,
    /^\/api\/v[12]\/lists\/[^/]+\/[^/]+\/itemdata$/,
    /^\/api\/v1\/prices\/(history|stats)$/,
    /^\/api\/v1\/tools\/album-helper$/,
  ],
  POST: [/^\/api\/v[12]\/items(\/|$)/, /^\/api\/v1\/prices\/history$/],
} as const;

export function isItemQuotaRoute(method: string, pathname: string): boolean {
  const routes = ITEM_QUOTA_ROUTES[method as keyof typeof ITEM_QUOTA_ROUTES];
  if (!routes) return false;
  return routes.some((re) => re.test(pathname));
}
