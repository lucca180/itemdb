'use server';

import { parseManyItemsV2Query } from '@app/api/v2/items/parse';
import type { FindManyItemsV2Query } from '@app/server/items/v2';
import { ItemService } from '@services/ItemService';
import type { ItemV2For } from '@types';

/** UI hydrate only — not a bulk dump API. Import uses dedicated actions. */
const MAX_MANY_LIMIT = 100;
const DEFAULT_MANY_LIMIT = 48;

type FetchManyItemsOptions = {
  limit?: number;
};

/**
 * Client-callable bulk item fetch for small UI hydrates (ItemV2 `card` only).
 * Caps at 100 keys — large imports must use page-local import actions.
 */
export async function fetchManyItems(
  query: FindManyItemsV2Query,
  options: FetchManyItemsOptions = {}
): Promise<Record<string, ItemV2For<'card'>>> {
  const parsed = parseManyItemsV2Query(query as unknown as Record<string, unknown>);
  if (!parsed) {
    throw new Error('Invalid fetchManyItems query');
  }

  if (parsed.data.length > MAX_MANY_LIMIT) {
    throw new Error('fetchManyItems query too large');
  }

  const rawLimit = options.limit ?? DEFAULT_MANY_LIMIT;
  const safeLimit = Math.min(
    Math.max(1, Number.isFinite(rawLimit) ? Math.trunc(rawLimit) : DEFAULT_MANY_LIMIT),
    MAX_MANY_LIMIT
  );

  return ItemService.getManyItems(parsed, { intent: 'card', limit: safeLimit });
}
