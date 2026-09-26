import { revalidateTag } from 'next/cache';
import {
  listMutationCacheTags,
  requiresImmediateRevalidation,
  type AppCacheTag,
} from '@utils/appCacheTags';

/**
 * Revalidates App Router cache tags from Route Handlers / Server Actions.
 * List tags expire immediately (see {@link requiresImmediateRevalidation}); the rest are
 * stale-while-revalidate (`'max'`).
 *
 * Pages Router code can't call `revalidateTag`: use `triggerAppRevalidation`, which goes
 * through `/api/internal/revalidate` and ends up here. Server Actions that need
 * read-your-own-writes should use `updateTag` instead.
 */
export function revalidateAppCacheTags(tags: AppCacheTag[]): void {
  for (const tag of tags) {
    if (requiresImmediateRevalidation(tag)) {
      revalidateTag(tag, { expire: 0 });
    } else {
      revalidateTag(tag, 'max');
    }
  }
}

/** Revalidates every cache affected by a list item mutation (list pages + owner's lists). */
export function revalidateListMutationCaches(username: string, listId: number): void {
  revalidateAppCacheTags(listMutationCacheTags(username, listId));
}
