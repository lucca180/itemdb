'use server';

import { getMissingInfoItemsPage } from '@app/server/items/missingInfoData';
import type { ItemV2For } from '@types';
import { normalizeInteger } from '@utils/normalizeInteger';
import { MISSING_INFO_FIELDS, type MissingInfoField } from './buildMissingInfoPageProps';

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 100;
/** Defense-in-depth: bound `skip` from a crafted server-action call. */
const MAX_PAGE = 10_000;

export type LoadMissingInfoItemsInput = {
  field: MissingInfoField;
  page?: number;
  limit?: number;
};

/**
 * Page of canonical items whose selected field is missing.
 * Replaces the site's `GET /api/v1/items/missing` call without consuming API quota.
 */
export async function loadMissingInfoItems(
  input: LoadMissingInfoItemsInput
): Promise<ItemV2For<'card'>[]> {
  if (!input || !MISSING_INFO_FIELDS.includes(input.field)) {
    throw new Error('Invalid missing-info field');
  }

  const limit = normalizeInteger(input.limit, DEFAULT_LIMIT, 1, MAX_LIMIT);
  const page = normalizeInteger(input.page, 1, 1, MAX_PAGE);

  return getMissingInfoItemsPage({ field: input.field, page, limit });
}
