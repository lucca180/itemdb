import 'server-only';

import { cookies, headers } from 'next/headers';
import type { NextRequest } from 'next/server';
import requestIp from 'request-ip';
import { isLikelyBrowser, normalizeIP } from '@utils/api-utils';
import * as Redis from '@utils/redis';
import { checkSession } from '@utils/redis';

export type TroubleshootingPageProps = {
  isBrowser: boolean;
  hasSession: boolean;
  isIpBan: boolean;
};

export async function buildTroubleshootingPageProps(): Promise<TroubleshootingPageProps> {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const sessionCookie = cookieStore.get('idb-session-id')?.value ?? '';
  const hasSession = !!checkSession(sessionCookie);

  let isIpBan = false;
  try {
    const reqLike = { headers: Object.fromEntries(headerStore.entries()) };
    let ip = requestIp.getClientIp(reqLike as Parameters<typeof requestIp.getClientIp>[0]) ?? null;
    ip = ip ? normalizeIP(ip) : null;
    if (ip) await Redis.checkBan(ip);
  } catch (e) {
    if (e === Redis.API_ERROR_CODES.limitExceeded) {
      isIpBan = true;
    }
  }

  const { isLikely: isBrowser } = isLikelyBrowser({ headers: headerStore } as NextRequest);

  return {
    isBrowser,
    hasSession,
    isIpBan,
  };
}
