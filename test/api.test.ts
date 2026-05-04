import { generateSiteProof, getSiteProofInput, verifySessionToken } from '@utils/api-utils';
import { expect, test, describe } from 'vitest';
import { NextRequest } from 'next/server';
import { apiMiddleware } from '../proxy';
import { createSession, redis_setItemCount } from '@utils/redis';
import { generateAPIToken } from '../pages/api/auth/token';
import { createHash } from 'crypto';

describe.concurrent('API Access tests', () => {
  test('Access API with valid proof', async () => {
    const proof = generateSiteProof();

    expect(proof).toBeDefined();

    const solvedProof = solveSiteProof(proof.token, 'GET', '/api/v1/items');

    const request = new NextRequest('http://localhost/api/v1/items', {
      method: 'GET',
      headers: {
        'x-itemdb-proof': solvedProof,
      },
    });

    const response = await apiMiddleware(request);
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
    expect(response.status).toBe(401); // change this after block is effective
  });

  test('Access API with proof solved for another path', async () => {
    const proof = generateSiteProof();
    const solvedProof = solveSiteProof(proof.token, 'GET', '/api/v1/search');

    const request = new NextRequest('http://localhost/api/v1/items', {
      method: 'GET',
      headers: {
        'x-itemdb-proof': solvedProof,
      },
    });

    const response = await apiMiddleware(request);
    expect(response.status).toBe(401);
  });

  test('Valid proof skips item count without x-itemdb-valid forwarding header', async () => {
    const proof = generateSiteProof();
    const solvedProof = solveSiteProof(proof.token, 'GET', '/api/v1/items');

    const request = {
      method: 'GET',
      url: '/api/v1/items',
      headers: {
        'x-itemdb-proof': solvedProof,
      },
      cookies: {},
    } as any;

    await redis_setItemCount('proof-test', 999_999, request);

    const response = await apiMiddleware(
      new NextRequest('http://localhost/api/v1/items', {
        method: 'GET',
        headers: {
          'X-Forwarded-For': 'proof-test',
          'x-itemdb-proof': solvedProof,
        },
      })
    );
    expect(response.status).toBe(200);
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

  test('Access API without proof, key or session', async () => {
    const request = new NextRequest('http://localhost/api/v1/items', {
      method: 'GET',
    });

    const response = await apiMiddleware(request);
    expect(response.status).toBe(401); // change this after block is effective
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
      expect(response.status).toBe(401); // change this after block is effective
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
      expect(response.status).toBe(401); // change this after block is effective
    });
  });
});

function solveSiteProof(challenge: string, method: string, pathname: string) {
  const payload = JSON.parse(Buffer.from(challenge.split('.')[1], 'base64url').toString('utf8'));
  const difficulty = Number(payload.difficulty);

  for (let counter = 0; counter < 10_000_000; counter++) {
    const input = getSiteProofInput(challenge, counter, { method, pathname });
    const hash = createHash('sha256').update(input).digest();

    if (hasLeadingZeroBits(hash, difficulty)) {
      return `${challenge}:${counter}`;
    }
  }

  throw new Error('Unable to solve site proof');
}

function hasLeadingZeroBits(hash: Uint8Array, bits: number) {
  let remaining = bits;

  for (const byte of hash) {
    if (remaining <= 0) return true;
    if (remaining >= 8) {
      if (byte !== 0) return false;
      remaining -= 8;
      continue;
    }

    return byte >> (8 - remaining) === 0;
  }

  return true;
}
