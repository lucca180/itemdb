'use server';

import {
  getItemsWithEffectsPage,
  type ItemWithEffectsCard,
} from '@app/server/items/itemEffectsData';
import { normalizeInteger } from '@utils/normalizeInteger';
import { ITEM_EFFECTS_FIELDS, type ItemEffectsField } from './buildItemEffectsPageProps';

export type ItemEffectsHubItem = ItemWithEffectsCard;

const MAX_LIMIT_PER_PAGE = 48;
/** Defense-in-depth: bound `skip` from a crafted server-action call. */
const MAX_PAGE = 10_000;

export type LoadItemEffectsItemsInput = {
  field: ItemEffectsField;
  /** Effect name filter — only used by the `stats` field. */
  name?: string | null;
  page?: number;
  limit?: number;
};

/**
 * Page of items that have effects of a given type (ItemV2 `card` + effects).
 * Replaces in-app `GET /api/v1/items/effects`
 */
export async function loadItemEffectsItems(
  input: LoadItemEffectsItemsInput
): Promise<ItemEffectsHubItem[]> {
  if (!ITEM_EFFECTS_FIELDS.includes(input.field)) {
    throw new Error('Invalid item effects field');
  }

  const limit = normalizeInteger(input.limit, 18, 1, MAX_LIMIT_PER_PAGE);
  const page = normalizeInteger(input.page, 1, 1, MAX_PAGE);
  const name = typeof input.name === 'string' && input.name ? input.name : undefined;

  return getItemsWithEffectsPage({
    field: input.field,
    name,
    page,
    limit,
  });
}
