import type { AppCacheTag } from '@utils/appCacheTags';

export type AppRevalidationPayload = {
  tags: AppCacheTag[];
  /** Optional context for logs — not used for cache lookup. */
  context?: { internalId: number } | { slug: string };
};

function getRevalidateSecret(): string | undefined {
  return process.env.REVALIDATE_SECRET ?? process.env.TARNUM_KEY;
}

function getSiteBaseUrl(): string {
  return process.env.SITE_URL ?? 'http://localhost:3000';
}

export async function triggerAppRevalidation(payload: AppRevalidationPayload): Promise<void> {
  const { tags, context } = payload;

  if (tags.length === 0) return;

  const secret = getRevalidateSecret();
  if (!secret) {
    console.warn('[triggerAppRevalidation] REVALIDATE_SECRET / TARNUM_KEY not set — skipping');
    return;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${secret}`,
    'x-tarnum-skip': secret,
  };

  const response = await fetch(`${getSiteBaseUrl()}/api/internal/revalidate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ tags, context }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error(
      `[triggerAppRevalidation] failed (${response.status}): ${body || response.statusText}`,
      context
    );
  }
}
