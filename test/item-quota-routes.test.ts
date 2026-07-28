import { expect, test, describe } from 'vitest';
import { NextRequest } from 'next/server';
import { apiMiddleware } from '../proxy';
import { isItemQuotaRoute } from '@utils/api/itemQuotaRoutes';
import { redis_setItemCount } from '@utils/api/redis';

const NON_QUOTA_ROUTES: { method: string; path: string }[] = [
  { method: 'POST', path: '/api/v1/lists/user' },
  { method: 'PUT', path: '/api/v1/lists/user/1' },
  { method: 'POST', path: '/api/v1/lists/user/1' },
  { method: 'GET', path: '/api/v1/users/getSession' },
  { method: 'POST', path: '/api/v1/trades' },
  { method: 'GET', path: '/api/v1/lists/user/1/stats' },
];

describe('Item quota route blocklist', () => {
  test('does not include transactional / non-item routes', () => {
    for (const site of NON_QUOTA_ROUTES) {
      expect(
        isItemQuotaRoute(site.method, site.path),
        `${site.method} ${site.path} should not be on the item-quota blocklist`
      ).toBe(false);
    }
  });

  // POST /api/v1/items matches the items prefix but is also in API_SKIPS,
  // so middleware never reaches checkBan for that path.
  test('POST /api/v1/items matches blocklist prefix (skipped earlier by API_SKIPS)', () => {
    expect(isItemQuotaRoute('POST', '/api/v1/items')).toBe(true);
  });
});

describe('Item quota ban scoping in apiMiddleware', () => {
  test('banned IP is rejected on item routes', async () => {
    const ip = `item-quota-ban-${Date.now()}`;

    await redis_setItemCount(ip, 5000, {
      method: 'GET',
      url: '/api/v1/items',
      headers: {},
      cookies: {},
    } as any);

    const response = await apiMiddleware(
      new NextRequest('http://localhost/api/v1/items', {
        method: 'GET',
        headers: { 'X-Forwarded-For': ip },
      })
    );

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBeDefined();
  });

  test('banned IP is not rejected on transactional list routes', async () => {
    const ip = `item-quota-lists-${Date.now()}`;

    await redis_setItemCount(ip, 5000, {
      method: 'GET',
      url: '/api/v1/items',
      headers: {},
      cookies: {},
    } as any);

    const response = await apiMiddleware(
      new NextRequest('http://localhost/api/v1/lists/someuser', {
        method: 'POST',
        headers: { 'X-Forwarded-For': ip },
      })
    );

    expect(response.status).not.toBe(429);
  });

  test('banned IP is still rejected on list itemdata routes', async () => {
    const ip = `item-quota-itemdata-${Date.now()}`;

    await redis_setItemCount(ip, 5000, {
      method: 'GET',
      url: '/api/v1/items',
      headers: {},
      cookies: {},
    } as any);

    const response = await apiMiddleware(
      new NextRequest('http://localhost/api/v1/lists/user/1/itemdata', {
        method: 'GET',
        headers: { 'X-Forwarded-For': ip },
      })
    );

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBeDefined();
  });
});
