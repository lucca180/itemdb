import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { generateSiteProof, verifySiteChallenge } from '@utils/api-utils';

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
  {
    startTime,
    proofCookie,
    skipSideEffects,
  }: { startTime: number; proofCookie: string; skipSideEffects?: boolean }
) => {
  updateServerTime('regular-middleware', startTime, response);

  if (skipSideEffects) {
    return response;
  }

  if (!verifySiteChallenge(proofCookie, 120)) {
    const proof = generateSiteProof();
    response.cookies.set({
      name: 'itemdb-proof',
      value: proof.token,
      maxAge: proof.expiresIn,
      secure: true,
      sameSite: 'lax',
      httpOnly: false,
    });
  }

  response.headers.set('Cache-Control', 'no-cache, must-revalidate');

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
      'Content-Type, Authorization, x-itemdb-proof, x-itemdb-token, x-itemdb-key'
    );
    response.headers.set(
      'Access-Control-Expose-Headers',
      'Content-Type, Authorization, x-itemdb-proof, x-itemdb-token, x-itemdb-key, x-itemdb-block, x-itemdb-skip, sentry-trace, baggage, traceparent'
    );
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  } catch {}
};
