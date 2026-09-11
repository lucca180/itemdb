const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const MAX_TOKEN_LENGTH = 2048;
const SITEVERIFY_TIMEOUT_MS = 10_000;

type SiteverifyResponse = {
  success?: boolean;
  action?: string;
  'error-codes'?: string[];
};

export function shouldSkipTurnstile(): boolean {
  if (process.env.TURNSTILE_SECRET_KEY) return false;
  return process.env.NODE_ENV !== 'production';
}

export async function verifyTurnstileToken(
  token: string | undefined,
  remoteip?: string
): Promise<boolean> {
  if (shouldSkipTurnstile()) return true;

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return false;
  if (
    !token ||
    typeof token !== 'string' ||
    token.length === 0 ||
    token.length > MAX_TOKEN_LENGTH
  ) {
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
    if (!response.ok) return false;
    const result = (await response.json()) as SiteverifyResponse;
    if (!result.success) return false;
    if (result.action !== 'get-session') return false;
    return true;
  } catch {
    return false;
  }
}
