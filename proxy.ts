import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import requestIp from 'request-ip';
import * as Redis from '@utils/api/redis';
import {
  generateSiteProof,
  isLikelyBrowser,
  normalizeIP,
  verifyApiToken,
  verifySiteChallenge,
  verifySiteProof,
} from '@utils/api/api-utils';
import * as Sentry from '@sentry/nextjs';
import createIntlMiddleware from 'next-intl/middleware';
import { getCurrentPath } from '@utils/locales';
import {
  createForwardedContext,
  finalizeApiResponse,
  finalizePageResponse,
} from '@utils/api/proxy';
import { checkSession } from '@utils/api/redis';
import { routing } from './i18n/routing';

const handleI18nRouting = createIntlMiddleware(routing);

const API_SKIPS = {
  GET: [
    /^\/api\/auth.*$/,
    /^\/api\/widget.*$/,
    /^\/api\/build-id.*$/,
    /^\/api\/v1\/tools\/album-helper\/redirect$/,
    /^\/api\/health$/,
    /^\/api\/health\/db$/,
  ],
  POST: [
    /^\/api\/auth.*$/,
    /^\/api\/v1\/prices$/,
    /^\/api\/v1\/trades$/,
    /^\/api\/v1\/items$/,
    /^\/api\/v1\/items\/open$/,
    /^\/api\/v1\/lists\/import-session$/,
    /^\/api\/internal\/revalidate$/,
  ],
} as const;

const PUBLIC_FILE = /\.(.*)$/;

const skipAPIMiddleware = process.env.SKIP_API_MIDDLEWARE === 'true';
const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === 'true';

const isDev = process.env.NODE_ENV === 'development';

export const config = {
  matcher: ['/api/:path*', '/:path*'],
};

export function proxy(request: NextRequest) {
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
  const proofCookie = request.cookies.get('itemdb-proof')?.value || '';
  const isDevRscRequest = isDev && request.nextUrl.searchParams.has('_rsc');
  const currentPath = getCurrentPath(request.nextUrl.pathname, request.nextUrl.search);
  const pageRequestHeaders = new Headers(request.headers);
  pageRequestHeaders.set('x-itemdb-current-path', currentPath);

  const intlRequest = new NextRequest(request.url, {
    headers: pageRequestHeaders,
    method: request.method,
  });

  const intlResponse = handleI18nRouting(intlRequest);

  return finalizePageResponse(intlResponse, {
    startTime,
    proofCookie,
    skipSideEffects: isDevRscRequest,
  });
}

// ---------- API Middleware ---------- //

export const apiMiddleware = async (request: NextRequest) => {
  const { requestHeaders, response } = createForwardedContext(request);
  if (isDev) return finalizeApiResponse(request, response);
  // Skip rate limit if key is provided
  if (request.headers.get('x-tarnum-skip') === process.env.TARNUM_KEY) {
    return finalizeApiResponse(request, response);
  }

  if (request.method === 'OPTIONS') {
    return finalizeApiResponse(request, response);
  }

  const startTime = Date.now();

  //check if request pathname has a skip route
  const skips = API_SKIPS[request.method as keyof typeof API_SKIPS] || [];

  if (skips.some((skip) => skip.test(request.nextUrl.pathname))) {
    response.headers.set('x-itemdb-skip', 'true');
    Sentry.metrics.count('api.requests', 1, {
      attributes: {
        type: 'skip-route',
      },
    });
    Sentry.setTag('api_type', 'skip-route');
    return finalizeApiResponse(request, response, startTime);
  }

  let ip =
    requestIp.getClientIp(request as any) || request.headers.get('X-Forwarded-For')?.split(',')[0];
  ip = ip ? normalizeIP(ip) : undefined;

  const { score, isLikely: isBrowser } = isLikelyBrowser(request);
  requestHeaders.set('x-itemdb-score', score.toString());
  requestHeaders.set('x-itemdb-likely', isBrowser ? 'true' : 'false');
  Sentry.setTag('x-itemdb-score', score);
  // request is trusted if it has a valid site proof, skip all checks
  const itemdb_proof = request.headers.get('x-itemdb-proof');

  const proofContext = {
    method: request.method,
    pathname: request.nextUrl.pathname,
  };

  if (itemdb_proof && verifySiteProof(itemdb_proof, 0, proofContext)) {
    // check if proof is close to expiration, if so, refresh it
    const challenge = itemdb_proof.slice(0, itemdb_proof.lastIndexOf(':'));
    if (!verifySiteChallenge(challenge, 300) && isBrowser) {
      const proof = generateSiteProof('long');
      response.cookies.set({
        name: 'itemdb-proof',
        value: proof.token,
        maxAge: proof.expiresIn,
        secure: true,
        sameSite: 'lax',
        httpOnly: false,
      });
    }

    Sentry.metrics.count('api.requests', 1, {
      attributes: {
        type: 'site-proof',
      },
    });
    Sentry.setTag('api_type', 'site-proof');
    return finalizeApiResponse(request, response, startTime);
  } else if (itemdb_proof) {
    response.cookies.set({ name: 'itemdb-proof', value: '', maxAge: 0 });
  }

  // check ip ban
  if (ip) {
    try {
      await Redis.checkBan(ip);
    } catch (e) {
      if (e === Redis.API_ERROR_CODES.limitExceeded) {
        Sentry.metrics.count('api.requests', 1, {
          attributes: {
            type: 'rate-limited-request',
          },
        });

        const res = NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        const ttl = await Redis.getBanTTL(ip);
        res.headers.set('Retry-After', ttl.toString());

        return finalizeApiResponse(request, res, startTime);
      }
    }
  }

  // request is coming from a cross-origin source (probably userscripts)
  const sessionCookie = request.cookies.get('idb-session-id');
  if (isBrowser) {
    if (sessionCookie && sessionCookie.value) {
      Sentry.setTag('api_type', 'session');
      try {
        const sessionId = checkSession(sessionCookie.value);
        if (!!sessionId) {
          Sentry.metrics.count('api.requests', 1, {
            attributes: {
              type: 'session',
            },
          });

          return finalizeApiResponse(request, response, startTime);
        } else if (!sessionId) {
          Sentry.metrics.count('api.requests', 1, {
            attributes: {
              type: 'blocked-invalid-session',
            },
          });

          const res = NextResponse.json({ error: 'Invalid access' }, { status: 401 });
          res.cookies.set({ name: 'idb-session-id', value: '', maxAge: 0 });
          res.cookies.set({ name: 'idb-session-exp', value: '', maxAge: 0 });

          return res;
        }
      } catch (e) {
        console.error('Error validating session in middleware', e);
        if (e === Redis.API_ERROR_CODES.noRedis) {
          return finalizeApiResponse(request, response, startTime);
        }
      }
    }
  }

  // request is coming from a non-browser source -> check api token
  const apiToken = request.headers.get('x-itemdb-token');
  const tokenPayload = apiToken ? verifyApiToken(apiToken) : null;
  if (apiToken && tokenPayload) {
    Sentry.setTag('api_type', 'api-token');
    Sentry.setTag('api_key_id', tokenPayload.sub);
    try {
      await Redis.checkApiToken(apiToken);

      Sentry.metrics.count('api.requests', 1, {
        attributes: {
          type: 'api-token',
        },
      });

      return finalizeApiResponse(request, response, startTime);
    } catch (e) {
      if (e === Redis.API_ERROR_CODES.noRedis)
        return finalizeApiResponse(request, response, startTime);

      if (e === Redis.API_ERROR_CODES.limitExceeded) {
        Sentry.metrics.count('api.requests', 1, {
          attributes: {
            type: 'api-rate-limit',
          },
        });

        const res = NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        const ttl = await Redis.getKeyTTL(apiToken);
        res.headers.set('Retry-After', ttl.toString());

        return finalizeApiResponse(request, res, startTime);
      }

      if (e === Redis.API_ERROR_CODES.invalidKey) {
        Sentry.metrics.count('api.requests', 1, {
          attributes: {
            type: 'api-invalid-key',
          },
        });

        return finalizeApiResponse(
          request,
          NextResponse.json({ error: 'Invalid API key' }, { status: 401 }),
          startTime
        );
      }
    }
  }

  // everything else will be blocked in a near future.
  response.headers.set('x-itemdb-block', 'true');

  // ------- track metrics ----------- //
  let type = 'blocked';
  if (sessionCookie) type += '-invalid-session';
  if (isBrowser) type += '-browser';
  else type += '-non-browser';

  Sentry.metrics.count('api.requests', 1, {
    attributes: {
      type: type,
    },
  });

  Sentry.setTag('api_type', 'undefined');

  return NextResponse.json({ error: 'Invalid access' }, { status: 401 });
};
