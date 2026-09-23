import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { LOCALE_COOKIE_NAME } from '@utils/locales';

const allowedOrigins = [
  'itemdb.com.br',
  'neopets.com',
  'www.neopets.com',
  'impress.openneo.net',
  'magnetismotimes.com',
  'castleneo.com',
  'www.castleneo.com',
];

export const createForwardedContext = (request: NextRequest) => {
  const requestHeaders = new Headers(request.headers);
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  return { requestHeaders, response };
};

export const updateServerTime = (label: string, startTime: number, response: NextResponse) => {
  const endTime = Date.now();
  const value = endTime - startTime;

  const serverTime = response.headers.get('Server-Timing') || '';
  const newServerTime = serverTime
    ? `${serverTime}, ${label};dur=${value}`
    : `${label};dur=${value}`;
  response.headers.set('Server-Timing', newServerTime);
};

export const finalizePageResponse = (
  response: NextResponse,
  { startTime }: { startTime: number }
) => {
  updateServerTime('regular-middleware', startTime, response);
  return response;
};

/**
 * Removes the locale cookie set by the next-intl middleware, so the URL never changes the
 * user's locale. The cookie is only written by explicit user actions (language switcher, login).
 */
export const stripLocaleSetCookie = (response: NextResponse) => {
  const prefix = `${LOCALE_COOKIE_NAME}=`;
  const setCookies = response.headers.getSetCookie();
  if (!setCookies.some((cookie) => cookie.startsWith(prefix))) return response;

  const keptCookies = setCookies.filter((cookie) => !cookie.startsWith(prefix));

  response.headers.delete('set-cookie');
  keptCookies.forEach((cookie) => response.headers.append('set-cookie', cookie));

  // NextResponse mirrors its cookies into this internal header so the render sees them,
  // and Next.js turns them back into a Set-Cookie on the page response.
  if (keptCookies.length) response.headers.set('x-middleware-set-cookie', keptCookies.join(','));
  else response.headers.delete('x-middleware-set-cookie');

  return response;
};

export const finalizeApiResponse = (
  request: NextRequest,
  response: NextResponse,
  startTime?: number
) => {
  addCors(request, response);

  if (startTime !== undefined) {
    updateServerTime('api-middleware', startTime, response);
  }

  return response;
};

export const addCors = (request: NextRequest, response: NextResponse) => {
  const origin = request.headers.get('origin');
  if (!origin || origin === 'null') return;

  try {
    const url = new URL(origin);
    if (!allowedOrigins.includes(url.hostname)) {
      return;
    }

    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, x-itemdb-token, x-itemdb-key'
    );
    response.headers.set(
      'Access-Control-Expose-Headers',
      'Content-Type, Authorization, x-itemdb-token, x-itemdb-key, x-itemdb-block, x-itemdb-skip, sentry-trace, baggage, traceparent'
    );
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  } catch {}
};
