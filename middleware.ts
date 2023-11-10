import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { User } from './types';
import * as jose from 'jose';
import { LRUCache } from 'lru-cache';
import requestIp from 'request-ip';

const API_SKIPS: { [method: string]: string[] } = {
  GET: ['api/auth', 'api/cache'],
  POST: ['api/auth', '/v1/prices', '/v1/trades', '/v1/items', '/v1/items/open'],
};

const userKeyCache = new LRUCache({
  max: 500,
});

const rateLimitCache = new LRUCache<string, RateLimit>({
  max: 500,
});

type RateLimit = {
  count: number;
  lastRequest: number;
  reset: number;
  limitedUntil: number;
};

const LIMIT_PERIOD = 1 * 60 * 1000;
const LIMIT_COUNT = 60;
const LIMIT_BAN = 5 * 60 * 1000;

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
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
  const host = request.headers.get('host') as string;

  // Admin routes - need to check if user is admin
  if (request.nextUrl.pathname.startsWith('/api/admin')) {
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }

    try {
      const userid = await checkSessionLocal(sessionCookie.value);
      if (userKeyCache.has(userid)) {
        const user = userKeyCache.get(userid) as User;
        if (user.isAdmin) {
          return NextResponse.next();
        }
      }

      const authRes = await checkSession(sessionCookie.value, host, false);

      const user = authRes.user;

      if (user) userKeyCache.set(userid, user);

      if (!user || !user.isAdmin) throw new Error('Not authorized');
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (sessionCookie && sessionCookie.value) {
    await checkSessionLocal(sessionCookie.value);
    return NextResponse.next();
  }

  // Rate limit
  const ip = requestIp.getClientIp(request as any);

  if (!ip) {
    return NextResponse.next();
  }

  let rateLimit = rateLimitCache.get(ip) ?? { count: 0, lastRequest: 0, reset: 0, limitedUntil: 0 };
  const now = Date.now();

  rateLimit.lastRequest = now;
  rateLimit.count++;

  if (rateLimit.limitedUntil > now) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  if (rateLimit.reset < now) {
    rateLimit = { count: 0, lastRequest: 0, reset: now + LIMIT_PERIOD, limitedUntil: 0 };
  }

  if (rateLimit.count >= LIMIT_COUNT) {
    rateLimit.limitedUntil = now + LIMIT_BAN;
    console.error(`Rate limit exceeded for ${ip}`);
    rateLimitCache.set(ip, rateLimit);

    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  rateLimitCache.set(ip, rateLimit);

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
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
