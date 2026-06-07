import { revalidateTag } from 'next/cache';
import { isAppCacheTag, type AppCacheTag } from '@utils/appCacheTags';

function getRevalidateSecret(): string | undefined {
  return process.env.REVALIDATE_SECRET ?? process.env.TARNUM_KEY;
}

function isAuthorized(request: Request): boolean {
  const secret = getRevalidateSecret();
  if (!secret) return false;

  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

type RevalidateRequestBody = {
  tags?: unknown;
  context?: { internalId?: number; slug?: string };
};

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: RevalidateRequestBody;
  try {
    body = (await request.json()) as RevalidateRequestBody;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const rawTags = Array.isArray(body.tags) ? body.tags : [];
  const tags = rawTags.filter(
    (tag): tag is AppCacheTag => typeof tag === 'string' && isAppCacheTag(tag)
  );

  if (tags.length === 0) {
    return Response.json({ error: 'No valid cache tags provided' }, { status: 400 });
  }

  for (const tag of tags) {
    revalidateTag(tag, 'max');
  }

  return Response.json({
    revalidated: tags,
    context: body.context ?? null,
    now: Date.now(),
  });
}
