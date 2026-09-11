import { verifySessionToken } from '@utils/api/api-utils';
import { expect, test, describe, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { apiMiddleware } from '../proxy';
import { createSession, redis_setItemCount } from '@utils/api/redis';
import { generateAPIToken } from '../pages/api/auth/token';
import { verifyTurnstileToken } from '@utils/api/turnstile';

describe.concurrent('API Access tests', () => {
  test('GET getSession is not a bootstrap skip', async () => {
    const request = new NextRequest('http://localhost/api/v1/users/getSession', {
      method: 'GET',
    });

    const response = await apiMiddleware(request);
    expect(response.status).toBe(401);
  });

  test('POST getSession is a skip route', async () => {
    const request = new NextRequest('http://localhost/api/v1/users/getSession', {
      method: 'POST',
    });

    const response = await apiMiddleware(request);
    expect(response.headers.get('x-itemdb-skip')).toBe('true');
    expect(response.status).toBe(200);
  });

  test('x-itemdb-proof does not grant API access', async () => {
    const request = new NextRequest('http://localhost/api/v1/items', {
      method: 'GET',
      headers: {
        'x-itemdb-proof': 'forged-proof',
      },
    });

    const response = await apiMiddleware(request);
    expect(response.status).toBe(401);
  });

  test('Access Skip API route', async () => {
    const request = new NextRequest('http://localhost/api/v1/items', {
      method: 'POST',
    });

    const response = await apiMiddleware(request);
    expect(response.headers.get('x-itemdb-skip')).toBe('true');
    expect(response.status).toBe(200);
  });

  test('Access Skip API route', async () => {
    const request = new NextRequest('http://localhost/api/v1/tools/album-helper/redirect', {
      method: 'GET',
    });

    const response = await apiMiddleware(request);
    expect(response.headers.get('x-itemdb-skip')).toBe('true');
    expect(response.status).toBe(200);
  });

  test('cache routes skip API auth', async () => {
    const request = new NextRequest('http://localhost/api/cache/preview/alt-styles', {
      method: 'GET',
    });

    const response = await apiMiddleware(request);
    expect(response.headers.get('x-itemdb-skip')).toBe('true');
    expect(response.status).toBe(200);
  });

  test('Access API without token or session', async () => {
    const request = new NextRequest('http://localhost/api/v1/items', {
      method: 'GET',
    });

    const response = await apiMiddleware(request);
    expect(response.status).toBe(401);
  });

  describe.concurrent('Session Token tests', async () => {
    let session: string;
    let limit: number;
    let sessionId: string;

    const headers = {
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36',
      'sec-fetch-site': 'none',
      'sec-fetch-mode': 'cors',
      'sec-fetch-dest': 'empty',
      'accept-language': 'en-US,en;q=0.9',
      accept: 'application/json',
    };

    test.beforeAll(async () => {
      const sessionData = await createSession();
      session = sessionData.session;
      limit = sessionData.limit;
      sessionId = verifySessionToken(session)!.sub!;

      expect(sessionId).toBeDefined();
      expect(session).toBeDefined();
    });

    test.sequential('Access API with session token', async () => {
      const request = new NextRequest('http://localhost/api/v1/items', {
        method: 'GET',
        headers: { ...headers, 'X-Forwarded-For': sessionId },
      });

      request.cookies.set('idb-session-id', session);

      await redis_setItemCount(sessionId, limit - 1, request as any);

      const response = await apiMiddleware(request);
      expect(response.headers.get('x-itemdb-block')).toBeNull();
      expect(response.status).toBe(200);
    });

    test.sequential('Access API with session token with rate limit', async () => {
      const request = new NextRequest('http://localhost/api/v1/items', {
        method: 'GET',
        headers: {
          ...headers,
          'X-Forwarded-For': sessionId,
        },
      });

      request.cookies.set('idb-session-id', session);

      await redis_setItemCount(sessionId, 2, request as any);

      const response = await apiMiddleware(request);
      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBeDefined();
    });

    test('Access API with invalid session token', async () => {
      const request = new NextRequest('http://localhost/api/v1/items', {
        method: 'GET',
        headers: headers,
      });

      request.cookies.set('idb-session-id', 'invalid-session');

      const response = await apiMiddleware(request);
      expect(response.status).toBe(401);
    });
  });

  describe.concurrent('API Key tests', async () => {
    let apiToken: string;
    let limitedToken: string;

    test.beforeAll(async () => {
      apiToken = await generateAPIToken(process.env.TEST_VALID_API_KEY || '');
      expect(apiToken).toBeDefined();

      limitedToken = await generateAPIToken('707cb8a43fa941788393a6cc39757e9c');
      expect(limitedToken).toBeDefined();

      await generateAPIToken('c441522904be4c4795221afea59a628f').catch((e) => {
        expect(e).toBeInstanceOf(Error);
      });
    });

    test('Access API with Valid API Key', async () => {
      const request = new NextRequest('http://localhost/api/v1/items', {
        method: 'GET',
      });

      request.headers.set('x-itemdb-token', apiToken);

      const response = await apiMiddleware(request);
      expect(response.headers.get('x-itemdb-block')).toBeNull();
      expect(response.status).toBe(200);
    });

    test('Access API with API Key with rate limit', async () => {
      const request = new NextRequest('http://localhost/api/v1/items', {
        method: 'GET',
      });

      request.headers.set('x-itemdb-token', limitedToken);

      const response = await apiMiddleware(request);
      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBeDefined();
    });

    test('Access API with invalid API Key', async () => {
      const request = new NextRequest('http://localhost/api/v1/items', {
        method: 'GET',
      });

      request.headers.set('x-itemdb-token', 'c441522904be4c4795221afea59a628f');

      const response = await apiMiddleware(request);
      expect(response.status).toBe(401);
    });
  });
});

describe('Turnstile siteverify', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  test('skips verification in non-production when secret is unset', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('TURNSTILE_SECRET_KEY', '');
    await expect(verifyTurnstileToken(undefined)).resolves.toBe(true);
  });

  test('fails closed in production without a secret', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('TURNSTILE_SECRET_KEY', '');
    await expect(verifyTurnstileToken('token')).resolves.toBe(false);
  });

  test('accepts a successful siteverify with matching action', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret');

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          success: true,
          action: 'get-session',
        }),
      }))
    );

    await expect(verifyTurnstileToken('ok-token', '1.1.1.1')).resolves.toBe(true);
  });

  test('rejects an invalid or mismatched action token', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret');

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          success: true,
          action: 'other',
        }),
      }))
    );

    await expect(verifyTurnstileToken('ok-token')).resolves.toBe(false);
  });

  test('rejects a non-OK siteverify response', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret');

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        json: async () => ({ success: false }),
      }))
    );

    await expect(verifyTurnstileToken('ok-token')).resolves.toBe(false);
  });
});
