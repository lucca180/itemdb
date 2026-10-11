import * as Sentry from '@sentry/nextjs';
import { isIP } from 'node:net';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const MAX_TOKEN_LENGTH = 2048;
const SITEVERIFY_TIMEOUT_MS = 10_000;
const EXPECTED_ACTION = 'get-session';

type SiteverifyResponse = {
  success?: boolean;
  action?: string;
  hostname?: string;
  'error-codes'?: string[];
};

/**
 * Records why a token was rejected (metric + attributes on the getSession span), so prod 401s
 * can be told apart: Cloudflare `error-codes`, action mismatch, HTTP or network failures.
 */
function recordVerifyFailure(
  reason: string,
  remoteip: string | undefined,
  result?: SiteverifyResponse
) {
  const ipVersion = remoteip ? `ipv${isIP(remoteip) || 'unknown'}` : 'none';

  Sentry.metrics.count('turnstile.verify_failed', 1, {
    attributes: { reason, ip_version: ipVersion },
  });
  Sentry.getActiveSpan()?.setAttributes({
    'turnstile.failure_reason': reason,
    'turnstile.ip_version': ipVersion,
    ...(result?.hostname ? { 'turnstile.hostname': result.hostname } : {}),
    ...(result?.action ? { 'turnstile.action': result.action } : {}),
  });
}

/**
 * Mirrors the client (`bootstrapApiSession` only requests a token in production): outside
 * production the token is never sent, so requiring it would 401 every getSession call.
 * Without a secret there is nothing to verify against, so it is skipped in production too.
 */
export function shouldSkipTurnstile(): boolean {
  if (!process.env.TURNSTILE_SECRET_KEY) return true;
  return process.env.NODE_ENV !== 'production';
}

export async function verifyTurnstileToken(
  token: string | undefined,
  remoteip?: string
): Promise<boolean> {
  if (shouldSkipTurnstile()) return true;

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return false;
  if (!token || typeof token !== 'string' || token.length === 0) {
    recordVerifyFailure('missing-token', remoteip);
    return false;
  }
  if (token.length > MAX_TOKEN_LENGTH) {
    recordVerifyFailure('token-too-long', remoteip);
    return false;
  }

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteip) body.set('remoteip', remoteip);

    const response = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: AbortSignal.timeout(SITEVERIFY_TIMEOUT_MS),
      body,
    });
    if (!response.ok) {
      recordVerifyFailure(`http-${response.status}`, remoteip);
      return false;
    }
    const result = (await response.json()) as SiteverifyResponse;
    if (!result.success) {
      const codes = result['error-codes']?.length ? result['error-codes'].join(',') : 'unknown';
      recordVerifyFailure(codes, remoteip, result);
      return false;
    }
    if (result.action !== EXPECTED_ACTION) {
      recordVerifyFailure('action-mismatch', remoteip, result);
      return false;
    }
    return true;
  } catch (error) {
    const reason =
      error instanceof Error && error.name === 'TimeoutError' ? 'fetch-timeout' : 'fetch-error';
    recordVerifyFailure(reason, remoteip);
    return false;
  }
}
