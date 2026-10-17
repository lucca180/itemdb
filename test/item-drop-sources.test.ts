import { describe, expect, test, vi } from 'vitest';

vi.mock('@utils/prisma', () => ({ default: {} }));

import { buildItemDropSources } from '@utils/item/itemDropSources';
import { CAPSULE_CONTENTS_SYNC_OPENING_ID, MANUAL_OPENING_ID } from '@utils/item/itemDropEvidence';

const row = (
  opening_id: string,
  item_iid: number,
  overrides: { prizePool?: string; limitedEdition?: boolean; notes?: string } = {}
) => ({
  opening_id,
  item_iid,
  prizePool: overrides.prizePool ?? null,
  limitedEdition: overrides.limitedEdition ?? false,
  notes: overrides.notes ?? null,
});

describe('buildItemDropSources', () => {
  test('separates manual, sync and community rows', () => {
    const sources = buildItemDropSources([
      row(MANUAL_OPENING_ID, 1, { prizePool: 'Normal' }),
      row(MANUAL_OPENING_ID, 1, { prizePool: 'bonus', limitedEdition: true }),
      row(CAPSULE_CONTENTS_SYNC_OPENING_ID, 2, { prizePool: 'cat1', limitedEdition: true }),
      row('opening-1', 3),
      row('opening-1', 3),
      row('opening-2', 3, { limitedEdition: true }),
      row('opening-3', 3, { notes: 'gramOption' }),
    ]);

    expect(sources[1]).toMatchObject({
      manualPools: ['normal', 'bonus'],
      manualLEPools: ['bonus'],
      hasSync: false,
      communityOpenings: 0,
    });
    expect(sources[2]).toMatchObject({ manualPools: [], hasSync: true, syncLE: true });
    expect(sources[3]).toMatchObject({
      manualPools: [],
      hasSync: false,
      communityOpenings: 2,
      communityLE: true,
    });
  });
});
