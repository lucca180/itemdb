import 'server-only';

import { cacheTag } from 'next/cache';
import { itemSectionCacheTags, type ItemPageCacheScope } from '@utils/appCacheTags';

/** Registers root + section tags on a `'use cache'` loader. Accepts multiple scopes. */
export function applyItemSectionCacheTags(
  internalId: number,
  ...scopes: ItemPageCacheScope[]
): void {
  for (const scope of scopes) {
    for (const tag of itemSectionCacheTags(internalId, scope)) {
      cacheTag(tag);
    }
  }
}
