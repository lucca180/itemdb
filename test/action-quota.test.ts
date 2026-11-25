import { beforeEach, describe, expect, test, vi } from 'vitest';
import { NextRequest } from 'next/server';

const ctx = vi.hoisted(() => ({
  headers: new Headers(),
  cookies: {} as Record<string, string>,
  afterTasks: [] as (() => unknown)[],
  intlRequestHeaders: null as Headers | null,
}));
const historyMock = vi.hoisted(() => ({
  getTradeHistory: vi.fn(),
  getAuctionHistory: vi.fn(),
  getRestockHistory: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  headers: async () => ctx.headers,
  cookies: async () => ({
    get: (name: string) => (ctx.cookies[name] ? { value: ctx.cookies[name] } : undefined),
  }),
}));
vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/server')>()),
  after: (task: () => unknown) => ctx.afterTasks.push(task),
}));
vi.mock('next-intl/middleware', () => ({
  default: () => (request: Request) => {
    ctx.intlRequestHeaders = request.headers;
    return new Response(null, { status: 200 });
  },
}));
vi.mock('@app/server/items/seenHistory', () => historyMock);
vi.mock('@app/server/items/relistingGate', () => ({
  shouldGateAuctionRelisting: async () => true,
}));
vi.mock('@utils/auth/getServerCurrentUser', () => ({
  getServerCurrentUser: async () => ({ user: null }),
}));

import {
  loadAuctionHistory,
  loadRestockHistory,
  loadTradeHistory,
} from '@app/server/items/seenHistoryActions';
import { createSession, redis } from '@utils/api/redis';
import { proxy } from '../proxy';

const rows = (count: number) => Array.from({ length: count }, () => ({}));

async function runAfter() {
  for (const task of ctx.afterTasks.splice(0)) await task();
}

let ipCounter = 0;
let ip = '';

beforeEach(() => {
  vi.clearAllMocks();
  ctx.afterTasks = [];
  ctx.cookies = {};
  ip = `10.0.0.${++ipCounter}`;
  ctx.headers = new Headers({ 'cf-connecting-ip': ip });
  historyMock.getTradeHistory.mockResolvedValue({ ok: true, data: { recent: rows(40) } });
  historyMock.getAuctionHistory.mockResolvedValue({ ok: true, data: { recent: rows(30) } });
  historyMock.getRestockHistory.mockResolvedValue({ recent: rows(20) });
});

describe('seen history actions quota', () => {
  test('counts the returned rows of every action, after the response', async () => {
    expect((await loadTradeHistory('Item')).ok).toBe(true);
    expect((await loadAuctionHistory('Item')).ok).toBe(true);
    expect((await loadRestockHistory('Item')).ok).toBe(true);
    expect(await redis!.get(ip)).toBeNull();

    await runAfter();
    expect(await redis!.get(ip)).toBe('90');
  });

  test('a contribute wall does not count', async () => {
    const wall = { needTrades: 1, needVotes: 1 };
    historyMock.getTradeHistory.mockResolvedValue({ ok: false, wall });
    historyMock.getAuctionHistory.mockResolvedValue({ ok: false, wall });

    expect(await loadTradeHistory('Item', true)).toEqual({ ok: false, wall });
    expect(await loadAuctionHistory('Item', true)).toEqual({
      ok: false,
      wall: { ...wall, gatesRelisting: true },
    });

    await runAfter();
    expect(await redis!.get(ip)).toBeNull();
  });

  test('bans at the limit, then rejects without querying', async () => {
    await redis!.set(ip, 4960);
    await loadTradeHistory('Item');
    await runAfter();
    expect(await redis!.exists(`ban:${ip}`)).toBe(1);

    vi.clearAllMocks();
    for (const load of [loadTradeHistory, loadAuctionHistory, loadRestockHistory]) {
      const result = await load('Item');
      expect(result).toMatchObject({ ok: false, reason: 'rate_limited' });
      expect((result as { retryAfter: number }).retryAfter).toBeGreaterThan(0);
    }
    expect(historyMock.getTradeHistory).not.toHaveBeenCalled();
    expect(historyMock.getAuctionHistory).not.toHaveBeenCalled();
    expect(historyMock.getRestockHistory).not.toHaveBeenCalled();
  });

  test('changing client-controlled ip headers does not escape the ban', async () => {
    await redis!.set(`ban:${ip}`, 1, 'EX', 60);
    ctx.headers.set('x-client-ip', '8.8.8.8');
    ctx.headers.set('x-forwarded-for', '8.8.4.4');

    expect(await loadTradeHistory('Item')).toMatchObject({ reason: 'rate_limited' });
  });

  test('uses the session limit', async () => {
    ctx.cookies['idb-session-id'] = (await createSession(true)).session;
    await redis!.set(ip, 5000);
    await loadTradeHistory('Item');
    await runAfter();

    expect(await redis!.get(ip)).toBe('5040');
    expect(await redis!.exists(`ban:${ip}`)).toBe(0);
  });

  test('ignores x-itemdb-token', async () => {
    ctx.headers.set('x-itemdb-token', 'any-token');
    await loadTradeHistory('Item');
    await runAfter();

    expect(await redis!.get(ip)).toBe('40');
  });

  test('groups IPv6 clients by /64, like the API', async () => {
    const prefix = '2001:db8:0';
    for (const host of ['1', '2']) {
      ctx.headers.set('cf-connecting-ip', `${prefix}:${ipCounter}::${host}`);
      await loadTradeHistory('Item');
      await runAfter();
    }

    const keys = await redis!.keys('*::/64');
    expect(await Promise.all(keys.map((key) => redis!.get(key)))).toEqual(['80']);
  });
});

describe('proxy', () => {
  test('never forwards x-itemdb-token to pages', () => {
    proxy(
      new NextRequest('http://localhost/item/item-slug', {
        method: 'POST',
        headers: { 'x-itemdb-token': 'any-token', 'next-action': 'abc' },
      })
    );

    expect(ctx.intlRequestHeaders?.get('next-action')).toBe('abc');
    expect(ctx.intlRequestHeaders?.has('x-itemdb-token')).toBe(false);
  });
});
