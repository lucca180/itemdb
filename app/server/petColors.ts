import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { fetchAllNeopetsColors } from '@utils/pet-colors';
import { PET_COLORS_CACHE_TAG, type PetColorsCatalog } from '@utils/pet-utils';

/** App Router cached catalog (`'use cache'`). Do not call from Pages Router. */
export async function getAllNeopetsColors(): Promise<PetColorsCatalog> {
  'use cache';
  cacheTag(PET_COLORS_CACHE_TAG);
  cacheLife('homeSlow');
  return fetchAllNeopetsColors();
}
