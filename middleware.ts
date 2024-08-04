import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { User } from './types';
import * as jose from 'jose';
import { LRUCache } from 'lru-cache';
import requestIp from 'request-ip';

const API_SKIPS: { [method: string]: string[] } = {
  GET: ['api/auth', 'api/cache', 'api/redis'],
  POST: ['api/auth', 'api/redis', '/v1/prices', '/v1/trades', '/v1/items', '/v1/items/open'],
};

const userKeyCache = new LRUCache({
  max: 100,
});

const PUBLIC_FILE = /\.(.*)$/;
const VALID_LOCALES = ['en', 'pt'];

const skipAPIMiddleware = process.env.SKIP_API_MIDDLEWARE === 'true';
const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === 'true';
const ITEMDB_URL = process.env.ITEMDB_SERVER;

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

  const cookies = {
    name: 'idb_accept-language',
    value: request.headers.get('accept-language') ?? '',
    expires: Date.now() + 1000000,
  };
  const response = NextResponse.next();

  response.cookies.set(cookies);

  const locale = request.cookies.get('NEXT_LOCALE')?.value;

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
  // if (process.env.NODE_ENV === 'development') return NextResponse.next();
  // Skip rate limit if key is provided
  if (request.headers.get('x-tarnum-skip') === process.env.TARNUM_KEY) {
    return NextResponse.next();
  }

  if (request.method === 'OPTIONS') {
    return NextResponse.next();
  }

  //check if request pathname has a skip route
  const skips = API_SKIPS[request.method] || [];
  if (skips.some((skip) => request.nextUrl.pathname.includes(skip))) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('session');

  // Admin routes - need to check if user is admin
  // if (request.nextUrl.pathname.startsWith('/api/admin')) {
  //   if (!sessionCookie || !sessionCookie.value) {
  //     return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  //   }

  //   try {
  //     const userid = await checkSessionLocal(sessionCookie.value);
  //     if (userKeyCache.has(userid)) {
  //       const user = userKeyCache.get(userid) as User;
  //       if (user.isAdmin) {
  //         return NextResponse.next();
  //       }
  //     }

  //     const authRes = await checkSession(sessionCookie.value, host, false);

  //     const user = authRes.user;

  //     if (user) userKeyCache.set(userid, user);

  //     if (!user || !user.isAdmin) throw new Error('Not authorized');
  //   } catch (e) {
  //     console.error(e);
  //     return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  //   }
  //   return NextResponse.next();
  // }

  if (sessionCookie && sessionCookie.value) {
    try {
      await checkSessionLocal(sessionCookie.value);
      return NextResponse.next();
    } catch (e) {}
  }

  // Rate limit
  const ip =
    requestIp.getClientIp(request as any) ?? request.ip ?? request.headers.get('x-forwarded-for');
  if (!ip) {
    return NextResponse.next();
  }

  const banned = await checkRedis(ip, request.nextUrl.pathname);
  if (banned) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  return NextResponse.next();
};

const checkSession = async (session: string, host: string, skipUser: boolean) => {
  const res = await fetch(`http://${host}/api/auth/checkSession`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ session: session, skipUser: skipUser }),
  });

  const { authRes } = await res.json();

  return authRes as
    | {
        decodedToken: DecodedIdToken;
        user: null;
      }
    | {
        decodedToken: DecodedIdToken;
        user: User;
      };
};

const checkSessionLocal = async (jwt: string) => {
  const decoded = jose.decodeProtectedHeader(jwt);
  const kid = decoded.kid as string;

  let cacheKeys = userKeyCache.get('firesbaseKeys') as
    | { keys: any; revalidate: number }
    | undefined;
  if (!cacheKeys || cacheKeys.revalidate < Date.now()) {
    const res = await fetch(
      'https://www.googleapis.com/identitytoolkit/v3/relyingparty/publicKeys'
    );
    const JWKS = await res.json();
    cacheKeys = { keys: undefined, revalidate: 0 };
    cacheKeys.keys = JWKS;
    const cacheControl = res.headers.get('Cache-Control')?.split('=')[1];
    cacheKeys.revalidate = cacheControl ? Date.now() + parseInt(cacheControl) * 1000 : 0;
    userKeyCache.set('firesbaseKeys', cacheKeys);
  }

  if (!cacheKeys) throw new Error('No keys');
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const publicKey = await jose.importX509(cacheKeys.keys[kid], decoded.alg!);

  const jwtDecoded = await jose.jwtVerify(jwt, publicKey, {
    issuer: 'https://session.firebase.google.com/itemdb-1db58',
    audience: 'itemdb-1db58',
  });

  return jwtDecoded.payload.user_id as string;
};

const checkRedis = async (ip: string, pathname: string) => {
  try {
    const res = await fetch(`${ITEMDB_URL}/api/redis/checkapi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': ip,
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
