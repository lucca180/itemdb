import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import requestIp from 'request-ip';
import { LRUCache } from 'lru-cache';
import { checkRedis, getSession } from '@utils/redis';

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
const isDev = process.env.NODE_ENV === 'development';

export const config = {
  matcher: ['/api/:path*', '/:path*'],
  runtime: 'nodejs',
};

export async function middleware(request: NextRequest) {
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
  // handle session
  const sessionCookie = request.cookies.get('idb-session-id')?.value || '';
  if (!sessionCookie && !isDev) {
    const newSession = (await getSession(sessionCookie)) as string;
    response.cookies.set({
      name: 'idb-session-id',
      value: newSession,
      expires: Date.now() + 20 * 60 * 1000, // 20 minutes
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }

  const locale = request.cookies.get('NEXT_LOCALE')?.value;

  updateServerTime('regular-middleware', startTime, response);

  // setting a cookie makes cloudflare not cache the HTML
  response.cookies.set({ name: 'skip-html-cache', value: 'true', maxAge: 60 });

  if (!locale || locale === request.nextUrl.locale || !VALID_LOCALES.includes(locale))
    return response;

  const redirectResponse = NextResponse.redirect(
    new URL(`/${locale}${request.nextUrl.pathname}${request.nextUrl.search}`, request.url)
  );

  // setting a cookie makes cloudflare not cache the HTML
  redirectResponse.cookies.set({ name: 'skip-html-cache', value: 'true', maxAge: 60 });

  return redirectResponse;
}

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

const updateServerTime = (label: string, startTime: number, response: NextResponse) => {
  const endTime = Date.now();
  const value = endTime - startTime;

  const serverTime = response.headers.get('Server-Timing') || '';

  const newServerTime = serverTime
    ? `${serverTime}, ${label};dur=${value}`
    : `${label};dur=${value}`;
  response.headers.set('Server-Timing', newServerTime);
};
