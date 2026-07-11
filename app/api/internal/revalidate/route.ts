import { revalidateTag } from 'next/cache';
import {
  assertTagsMatchInternalId,
  isAppCacheTag,
  requiresImmediateRevalidation,
  type AppCacheTag,
  type ItemScopedCacheTag,
} from '@utils/appCacheTags';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';

function getRevalidateSecret(): string | undefined {
  return process.env.REVALIDATE_SECRET ?? process.env.TARNUM_KEY;
}

function isBearerAuthorized(request: Request): boolean {
  const secret = getRevalidateSecret();
  if (!secret) return false;

  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

async function isAdminSessionAuthorized(): Promise<boolean> {
  const { user } = await getServerCurrentUser();
  return user?.isAdmin === true;
}

function isItemScopedCacheTag(tag: AppCacheTag): tag is ItemScopedCacheTag {
  return tag.startsWith('item-');
}

type RevalidateRequestBody = {
  tags?: unknown;
  context?: { internalId?: number; slug?: string };
};

export async function POST(request: Request) {
  const bearerAuthorized = isBearerAuthorized(request);
  const adminAuthorized = !bearerAuthorized && (await isAdminSessionAuthorized());

  if (!bearerAuthorized && !adminAuthorized) {
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

  if (adminAuthorized) {
    if (!tags.every(isItemScopedCacheTag)) {
      return Response.json(
        { error: 'Admin session may only revalidate item-scoped tags' },
        { status: 403 }
      );
    }

    const internalId = body.context?.internalId;
    if (typeof internalId === 'number') {
      assertTagsMatchInternalId(internalId, tags);
    }
  }

  for (const tag of tags) {
    if (requiresImmediateRevalidation(tag)) {
      revalidateTag(tag, { expire: 0 });
    } else {
      revalidateTag(tag, 'max');
    }
  }

  return Response.json({
    revalidated: tags,
    context: body.context ?? null,
    now: Date.now(),
  });
}
