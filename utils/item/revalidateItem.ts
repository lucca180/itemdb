import {
  assertTagsMatchInternalId,
  type AppCacheTag,
  type HomeCacheTag,
  type ItemPageCacheScope,
} from '@utils/appCacheTags';
import { triggerAppRevalidation } from '@utils/triggerAppRevalidation';

export type RevalidateItemInput =
  | { internalId: number; tags: readonly AppCacheTag[] }
  | { slug: string; tags: readonly AppCacheTag[] };

function normalizeInput(item: number | string, tags: readonly AppCacheTag[]): RevalidateItemInput {
  if (typeof item === 'number') {
    return { internalId: item, tags };
  }
  return { slug: item, tags };
}

/**
 * Invalidates App Router Data Cache entries by tag.
 * Must be called from server contexts (e.g. Pages API routes) — delegates to the App Route Handler.
 *
 * @param item - Item `internal_id` or slug (slug is metadata only; tags drive invalidation)
 * @param tags - Explicit cache tags to revalidate
 */
export async function revalidateItem(
  item: number | string,
  tags: readonly AppCacheTag[]
): Promise<void> {
  const input = normalizeInput(item, tags);

  if (input.tags.length === 0) return;

  if ('internalId' in input) {
    assertTagsMatchInternalId(input.internalId, input.tags);
  }

  await triggerAppRevalidation({
    tags: [...input.tags],
    context: 'internalId' in input ? { internalId: input.internalId } : { slug: input.slug },
  });
}

/** Invalidates home (or other global) App Router caches by tag. */
export async function revalidateAppCache(tags: readonly AppCacheTag[]): Promise<void> {
  if (tags.length === 0) return;
  await triggerAppRevalidation({ tags: [...tags] });
}

export type { AppCacheTag, HomeCacheTag, ItemPageCacheScope };
export {
  HomeRevalidateTags,
  ItemRevalidateTags,
  itemRootTag,
  itemSectionCacheTags,
  itemSectionTag,
} from '@utils/appCacheTags';
