import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import requestIp from 'request-ip';
import { LRUCache } from 'lru-cache';

const API_SKIPS: { [method: string]: string[] } = {
  GET: ['api/auth', 'api/cache', 'api/redis'],
  POST: ['api/auth', 'api/redis', '/v1/prices', '/v1/trades', '/v1/items', '/v1/items/open'],
};

const sessionCache = new LRUCache({
  max: 250,
});

const PUBLIC_FILE = /\.(.*)$/;
const VALID_LOCALES = ['en', 'pt'];

const skipAPIMiddleware = process.env.SKIP_API_MIDDLEWARE === 'true';
const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === 'true';
const ITEMDB_URL = process.env.ITEMDB_SERVER;
const isDev = process.env.NODE_ENV === 'development';
export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/_next') || PUBLIC_FILE.test(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  if (MAINTENANCE_MODE) {
    return NextResponse.rewrite(new URL('/maintenance', request.url), { status: 503 });
  }

  if (request.nextUrl.pathname.startsWith('/api/')) {
    if (skipAPIMiddleware) return NextResponse.next();

    return apiMiddleware(request);
  }
  const startTime = Date.now();
  // handle session
  const response = NextResponse.next();

  const sessionCookie = request.cookies.get('idb-session-id')?.value || '';
  if (!sessionCookie && !isDev) {
    const newSession = await getSession(sessionCookie);
    response.cookies.set({
      name: 'idb-session-id',
      value: newSession,
      expires: Date.now() + 20 * 60 * 1000, // 20 minutes
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }

  // Set accept-language cookie
  const cookies = {
    name: 'idb_accept-language',
    value: request.headers.get('accept-language') ?? '',
    expires: Date.now() + 1000000,
  };

  response.cookies.set(cookies);

  const locale = request.cookies.get('NEXT_LOCALE')?.value;

  updateServerTime('regular-middleware', startTime, response);

  if (!locale || locale === request.nextUrl.locale || !VALID_LOCALES.includes(locale))
    return response;

  const redirectResponse = NextResponse.redirect(
    new URL(`/${locale}${request.nextUrl.pathname}${request.nextUrl.search}`, request.url)
  );

  redirectResponse.cookies.set(cookies);
  return redirectResponse;
}

export const config = {
  matcher: ['/api/:path*', '/:path*'],
};

// ---------- API Middleware ---------- //

const apiMiddleware = async (request: NextRequest) => {
  const response = NextResponse.next();
  if (isDev) return response;
  // Skip rate limit if key is provided
  if (request.headers.get('x-tarnum-skip') === process.env.TARNUM_KEY) {
    return response;
  }

  if (request.method === 'OPTIONS') {
    return response;
  }

  //check if request pathname has a skip route
  const skips = API_SKIPS[request.method] || [];
  if (skips.some((skip) => request.nextUrl.pathname.includes(skip))) {
    return response;
  }

  const startTime = Date.now();

  const sessionCookie = request.cookies.get('idb-session-id');
  const cacheSession = sessionCache.get(sessionCookie?.value || '');

  if (cacheSession) {
    updateServerTime('api-middleware', startTime, response);
    return response;
  }

  if (sessionCookie && sessionCookie.value) {
    try {
      const isValidSession = await getSession(sessionCookie.value, true);
      if (!!isValidSession) {
        sessionCache.set(sessionCookie.value, true, {
          ttl: 20 * 60 * 1000,
        });

        updateServerTime('api-middleware', startTime, response);
        return response;
      }
    } catch (e) {}
  }

  // Rate limit
  const ip =
    requestIp.getClientIp(request as any) || request.headers.get('X-Forwarded-For')?.split(',')[0];

  if (!ip) {
    updateServerTime('api-middleware', startTime, response);
    return NextResponse.next();
  }

  const banned = await checkRedis(ip, request.nextUrl.pathname);
  if (banned) {
    updateServerTime('api-middleware', startTime, response);
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  updateServerTime('api-middleware', startTime, response);
  return NextResponse.next();
};

const checkRedis = async (ip: string, pathname: string) => {
  try {
    const res = await fetch(`${ITEMDB_URL}/api/redis/checkapi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': ip,
        'idb-ip-check': ip,
      },
      body: JSON.stringify({ pathname }),
    });

    if (res.status === 429) {
      return true;
    }

    return false;
  } catch (e) {
    console.error('checkRedis error', e);
    return false;
  }
};

const getSession = async (sessionToken?: string, checkOnly = false) => {
  try {
    const res = await fetch(`${ITEMDB_URL}/api/redis/session?checkOnly=${checkOnly}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'idb-session-id': sessionToken || '',
      },
    });

    const data = await res.json();

    return data;
  } catch (e) {
    console.error('checkRedis error', e);
    return false;
  }
};

const updateServerTime = (label: string, startTime: number, response: NextResponse) => {
  const endTime = Date.now();
  const value = endTime - startTime;
  let serverTime = response.headers.get('Server-Timing') || '';

  if (!serverTime) {
    const sst = response.headers.get('X-Nginx-Timing') || '';
    if (sst) {
      serverTime = `nginx-timing;dur=${Number(sst) * 1000}`;
    }
  }

  const newServerTime = serverTime
    ? `${serverTime}, ${label};dur=${value}`
    : `${label};dur=${value}`;
  response.headers.set('Server-Timing', newServerTime);
};
