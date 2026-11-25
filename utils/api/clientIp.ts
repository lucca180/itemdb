import type { IncomingHttpHeaders } from 'node:http';
import { isIP } from 'node:net';
import requestIp from 'request-ip';

type WebHeaders = Pick<Headers, 'get' | 'entries'>;

/** Pages API request, App Router / proxy request, or the result of `await headers()`. */
export type ClientIpSource = WebHeaders | { headers: WebHeaders | IncomingHttpHeaders };

function isWebHeaders(value: unknown): value is WebHeaders {
  return typeof (value as WebHeaders | undefined)?.get === 'function';
}

/**
 * Client ip, trusting Cloudflare first: the edge always overwrites `cf-connecting-ip`, while
 * `x-client-ip` and `x-forwarded-for` can be set by the client. Without it (local dev, tests),
 * falls back to `request-ip`, then to the raw first `x-forwarded-for` value.
 *
 * Not normalized: wrap with `normalizeIP` when using it as a key.
 */
export function getClientIp(source: ClientIpSource): string | null {
  const rawHeaders = 'headers' in source ? source.headers : source;
  // request-ip only reads plain objects
  const headers: IncomingHttpHeaders = isWebHeaders(rawHeaders)
    ? Object.fromEntries(rawHeaders.entries())
    : (rawHeaders ?? {});

  const cfIp = headers['cf-connecting-ip'];
  if (typeof cfIp === 'string' && isIP(cfIp)) return cfIp;

  const libraryReq = isWebHeaders(rawHeaders) ? { headers } : source;
  const libraryIp = requestIp.getClientIp(
    libraryReq as Parameters<typeof requestIp.getClientIp>[0]
  );
  if (libraryIp) return libraryIp;

  const forwardedFor = headers['x-forwarded-for'];
  const firstForwarded = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  return firstForwarded?.split(',')[0].trim() || null;
}
