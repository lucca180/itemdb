import requestIp from 'request-ip';

/**
 * Client ip for App Router requests, with the same header precedence `request-ip` uses for
 * Pages API routes (so values match what older rows stored).
 */
export const getRequestClientIp = (request: Request): string | null =>
  requestIp.getClientIp({
    headers: Object.fromEntries(request.headers),
  } as Parameters<typeof requestIp.getClientIp>[0]);
