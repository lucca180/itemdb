import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import requestIp from 'request-ip';
import { LRUCache } from 'lru-cache';
import * as Redis from '@utils/redis';
import { generateSiteProof, isLikelyBrowser, normalizeIP, verifySiteProof } from '@utils/api-utils';
import Sentry from '@sentry/nextjs';
const API_SKIPS = {
  GET: [/^\/api\/auth.*$/, /^\/api\/widget.*$/, /^\/api\/build-id.*$/],
  POST: [
    /^\/api\/auth.*$/,
    /^\/api\/v1\/prices$/,
    /^\/api\/v1\/trades$/,
    /^\/api\/v1\/items$/,
    /^\/api\/v1\/items\/open$/,
  ],
} as const;

const sessionCache = new LRUCache({
  max: 250,
});

const PUBLIC_FILE = /\.(.*)$/;
const VALID_LOCALES = ['en', 'pt'];

const skipAPIMiddleware = process.env.SKIP_API_MIDDLEWARE === 'true';
const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === 'true';

const isDev = false; //process.env.NODE_ENV === 'development'; // temporarily disable dev mode to test rate limit caching

export const config = {
  matcher: ['/api/:path*', '/:path*'],
};

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();

  if (request.nextUrl.pathname.startsWith('/_next') || PUBLIC_FILE.test(request.nextUrl.pathname)) {
    return response;
  }

  if (MAINTENANCE_MODE) {
    return NextResponse.rewrite(new URL('/maintenance', request.url), { status: 503 });
  }

  if (request.nextUrl.pathname.startsWith('/api/')) {
    if (skipAPIMiddleware) return response;

    return apiMiddleware(request);
  }

  const startTime = Date.now();

  const locale = request.cookies.get('NEXT_LOCALE')?.value;

  updateServerTime('regular-middleware', startTime, response);

  let ip =
    requestIp.getClientIp(request as any) || request.headers.get('X-Forwarded-For')?.split(',')[0];
  ip = ip ? normalizeIP(ip) : undefined;

  if (isLikelyBrowser(request).isLikely) {
    const proof = generateSiteProof(ip);
    response.cookies.set({ name: 'itemdb-proof', value: proof.token, maxAge: proof.expiresIn });
  }

  if (!locale || locale === request.nextUrl.locale || !VALID_LOCALES.includes(locale))
    return response;

  const redirectResponse = NextResponse.redirect(
    new URL(`/${locale}${request.nextUrl.pathname}${request.nextUrl.search}`, request.url)
  );

  return redirectResponse;
}

// ---------- API Middleware ---------- //

export const apiMiddleware = async (request: NextRequest) => {
  const response = NextResponse.next();
  addCors(request, response);
  if (isDev) return response;
  // Skip rate limit if key is provided
  if (request.headers.get('x-tarnum-skip') === process.env.TARNUM_KEY) {
    return response;
  }

  if (request.method === 'OPTIONS') {
    return response;
  }

  //check if request pathname has a skip route
  const skips = API_SKIPS[request.method as keyof typeof API_SKIPS] || [];

  if (skips.some((skip) => skip.test(request.nextUrl.pathname))) {
    response.headers.set('x-itemdb-skip', 'true');
    return response;
  }

  const startTime = Date.now();

  let ip =
    requestIp.getClientIp(request as any) || request.headers.get('X-Forwarded-For')?.split(',')[0];
  ip = ip ? normalizeIP(ip) : undefined;

  // request is trusted if it has a valid site proof, skip all checks
  const itemdb_proof = request.headers.get('x-itemdb-proof');
  request.headers.delete('x-itemdb-valid');
  if (itemdb_proof && verifySiteProof(itemdb_proof, ip || undefined)) {
    // set on both request and response (redis func uses this)
    request.headers.set('x-itemdb-valid', 'true');
    response.headers.set('x-itemdb-valid', 'true');

    // regenerate proof to extend its validity and set it on the response cookie
    const proof = generateSiteProof(ip, 'long');
    response.cookies.set({ name: 'itemdb-proof', value: proof.token, maxAge: proof.expiresIn });

    updateServerTime('api-middleware', startTime, response);
    return response;
  } else if (itemdb_proof) {
    const e = new Error('Incorrect site proof', {
      cause: itemdb_proof,
    });

    response.cookies.set({ name: 'itemdb-proof', value: '', maxAge: 0 });

    Sentry.captureException(e);
  }

  // check ip ban
  if (ip) {
    try {
      await Redis.checkBan(ip);
    } catch (e) {
      if (e === Redis.API_ERROR_CODES.limitExceeded) {
        updateServerTime('api-middleware', startTime, response);
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
      }
    }
  }

  // request is coming from a cross-origin source (probably userscripts)
  if (isLikelyBrowser(request).isLikely) {
    // console.log('[Warning] - Request without valid proof, but has browser-like headers.');
    const sessionCookie = request.cookies.get('idb-session-id');
    const cacheSession = sessionCache.get(sessionCookie?.value || '');

    if (cacheSession) {
      updateServerTime('api-middleware', startTime, response);
      return response;
    }

    if (sessionCookie && sessionCookie.value) {
      try {
        const isValidSession = await Redis.getSession(sessionCookie.value, true);
        if (!!isValidSession) {
          // console.log('[Warning] - Request without valid proof, but has browser-like headers.');
          sessionCache.set(sessionCookie.value, true, { ttl: 1000 * 60 * 5 });
          updateServerTime('api-middleware', startTime, response);
          return response;
        }
      } catch (e) {
        console.error('Error validating session in middleware', e);
        if (e === Redis.API_ERROR_CODES.noRedis) {
          updateServerTime('api-middleware', startTime, response);
          return response;
        }
      }
    }
  }

  // request is coming from a non-browser source -> check api key
  const apiKey = request.headers.get('x-itemdb-key');
  if (apiKey) {
    try {
      const keyData = await Redis.checkApiKey(apiKey);
      if (keyData) {
        updateServerTime('api-middleware', startTime, response);
        return response;
      }
    } catch (e) {
      if (e === Redis.API_ERROR_CODES.limitExceeded) {
        updateServerTime('api-middleware', startTime, response);
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
      }

      if (e === Redis.API_ERROR_CODES.invalidKey) {
        updateServerTime('api-middleware', startTime, response);
        return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
      }
    }
  }

  // everything else will be blocked in a near future.
  response.headers.set('x-itemdb-block', 'true');

  // console.warn(`[WARNING] - this request will be blocked in a near future`);
  // return NextResponse.json({ error: 'Invalid access' }, { status: 401 });

  updateServerTime('api-middleware', startTime, response);
  return response;
};

const updateServerTime = (label: string, startTime: number, response: NextResponse) => {
  const endTime = Date.now();
  const value = endTime - startTime;

  const serverTime = response.headers.get('Server-Timing') || '';

  const newServerTime = serverTime
    ? `${serverTime}, ${label};dur=${value}`
    : `${label};dur=${value}`;
  response.headers.set('Server-Timing', newServerTime);
};

const allowedOrigins = ['itemdb.com.br', 'neopets.com', 'www.neopets.com', 'impress.openneo.net'];

const addCors = (request: NextRequest, response: NextResponse) => {
  const origin = request.headers.get('origin');
  if (!origin) return;

  const url = new URL(origin || '');
  if (!allowedOrigins.includes(url.hostname)) {
    return;
  }

  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
};
