'use server';

import { parseManyItemsV2Query } from '@app/api/v2/items/parse';
import type { FindManyItemsV2Query } from '@app/server/items/v2';
import { ItemService } from '@services/ItemService';
import type { ItemIntent, ItemV2For } from '@types';

/** Matches the legacy HTTP `/api/v1/items/many` cap. */
const MAX_MANY_LIMIT = 10_000;

type FetchManyItemsOptions<I extends ItemIntent = 'card'> = {
  intent?: I;
  limit?: number;
};

/**
 * Client-callable bulk item fetch (ItemV2).
 * Replaces in-app `POST /api/v1/items/many` — does not consume API quota.
 */
export async function fetchManyItems<I extends ItemIntent = 'card'>(
  query: FindManyItemsV2Query,
  options: FetchManyItemsOptions<I> = {}
): Promise<Record<string, ItemV2For<I>>> {
  const parsed = parseManyItemsV2Query(query as unknown as Record<string, unknown>);
  if (!parsed) {
    throw new Error('Invalid fetchManyItems query');
  }

  const intent = (options.intent ?? 'card') as I;
  const rawLimit = options.limit ?? MAX_MANY_LIMIT;
  const safeLimit = Math.min(
    Math.max(1, Number.isFinite(rawLimit) ? Math.trunc(rawLimit) : MAX_MANY_LIMIT),
    MAX_MANY_LIMIT
  );

  return ItemService.getManyItems(parsed, { intent, limit: safeLimit });
}
