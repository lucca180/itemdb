import { generateSiteProof } from '@utils/api-utils';
import { expect, test, describe } from 'vitest';
import { NextRequest } from 'next/server';
import { apiMiddleware } from '../proxy';
import { createSession, redis_setItemCount } from '@utils/redis';
import { generateAPIToken } from '../pages/api/auth/token';

describe.concurrent('API Access tests', () => {
  test('Access API with valid proof', async () => {
    const proof = generateSiteProof();

    expect(proof).toBeDefined();

    const request = new NextRequest('http://localhost/api/v1/items', {
      method: 'GET',
      headers: {
        'x-itemdb-proof': proof.token,
      },
    });

    const response = await apiMiddleware(request);
    expect(response.headers.get('x-itemdb-valid')).toBe('true');
    expect(response.status).toBe(200);
  });

  test('Access API with invalid proof', async () => {
    const proof =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJpdGVtZGIuY29tLmJyIiwiaXAiOm51bGwsImN0eCI6ImJyb3dzZXIiLCJpYXQiOjE3NzEyNzc4ODYsImV4cCI6MTc3MTI3Nzg4N30.S9-LuUII_4lym69xiSH5ZcFCIOm-qzWBDwGwmsNXHO4';

    const request = new NextRequest('http://localhost/api/v1/items', {
      method: 'GET',
      headers: {
        'x-itemdb-proof': proof,
      },
    });

    const response = await apiMiddleware(request);
    expect(response.headers.get('x-itemdb-block')).toBe('true');
    expect(response.status).toBe(200); // change this after block is effective
  });

  test('Access Skip API route', async () => {
    const request = new NextRequest('http://localhost/api/v1/items', {
      method: 'POST',
    });

    const response = await apiMiddleware(request);
    expect(response.headers.get('x-itemdb-skip')).toBe('true');
    expect(response.status).toBe(200);
  });

  test('Access API without proof, key or session', async () => {
    const request = new NextRequest('http://localhost/api/v1/items', {
      method: 'GET',
    });

    const response = await apiMiddleware(request);
    expect(response.headers.get('x-itemdb-block')).toBe('true');
    expect(response.status).toBe(200); // change this after block is effective
  });

  describe.concurrent('Session Token tests', async () => {
    let session: string;

    test.beforeAll(async () => {
      session = (await createSession()).session;
      expect(session).toBeDefined();
    });

    test.sequential('Access API with session token', async () => {
      const request = new NextRequest('http://localhost/api/v1/items', {
        method: 'GET',
        headers: {
          'sec-fetch-site': 'none',
          'sec-fetch-mode': 'cors',
          'sec-fetch-dest': 'empty',
          'accept-language': 'en-US,en;q=0.9',
          accept: 'application/json',
        },
      });

      request.cookies.set('idb-session-id', session);

      const response = await apiMiddleware(request);
      expect(response.headers.get('x-itemdb-block')).toBeNull();
      expect(response.status).toBe(200);
    });

    test.sequential('Access API with session token with rate limit', async () => {
      const request = new NextRequest('http://localhost/api/v1/items', {
        method: 'GET',
        headers: {
          'X-Forwarded-For': 'test-ip',
        },
      });

      request.cookies.set('idb-session-id', session);

      await redis_setItemCount('test-ip', 500000, request as any);

      const response = await apiMiddleware(request);
      expect(response.status).toBe(429);
    });

    test('Access API with invalid session token', async () => {
      const request = new NextRequest('http://localhost/api/v1/items', {
        method: 'GET',
      });

      request.cookies.set('idb-session-id', 'invalid-session');

      const response = await apiMiddleware(request);
      expect(response.headers.get('x-itemdb-block')).toBe('true');
      expect(response.status).toBe(200); // change this after block is effective
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
    });

    test('Access API with invalid API Key', async () => {
      const request = new NextRequest('http://localhost/api/v1/items', {
        method: 'GET',
      });

      request.headers.set('x-itemdb-token', 'c441522904be4c4795221afea59a628f');

      const response = await apiMiddleware(request);
      expect(response.headers.get('x-itemdb-block')).toBe('true');
      expect(response.status).toBe(200); // change this after block is effective
    });
  });
});
