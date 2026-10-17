import prisma from '@utils/prisma';
import { OpenableItems } from '@prisma/generated/client';
import {
  GRAM_OPTION_NOTE,
  isAuthoritativeDrop,
  MANUAL_OPENING_ID,
} from '@utils/item/itemDropEvidence';

/** Where an item's drop rows for a parent come from — shown in the admin drops editor. */
export type ItemDropSources = {
  item_iid: number;
  /** Lowercased prize pools of admin (manual) rows. */
  manualPools: string[];
  /** Lowercased prize pools whose manual row is marked LE. */
  manualLEPools: string[];
  /** Rows from NC Mall / capsule contents syncs. */
  hasSync: boolean;
  syncLE: boolean;
  /** Distinct community openings that reported the item. */
  communityOpenings: number;
  communityLE: boolean;
};

type SourceRow = Pick<
  OpenableItems,
  'opening_id' | 'item_iid' | 'prizePool' | 'limitedEdition' | 'notes'
>;

export const buildItemDropSources = (rows: SourceRow[]) => {
  const sources: Record<number, ItemDropSources> = {};
  const communityOpenings: Record<number, Set<string>> = {};

  for (const row of rows) {
    if (row.notes?.toLowerCase().includes(GRAM_OPTION_NOTE)) continue;

    const source = (sources[row.item_iid] ??= {
      item_iid: row.item_iid,
      manualPools: [],
      manualLEPools: [],
      hasSync: false,
      syncLE: false,
      communityOpenings: 0,
      communityLE: false,
    });

    const pool = row.prizePool?.toLowerCase();

    if (row.opening_id === MANUAL_OPENING_ID) {
      if (pool && !source.manualPools.includes(pool)) source.manualPools.push(pool);
      if (pool && row.limitedEdition && !source.manualLEPools.includes(pool))
        source.manualLEPools.push(pool);
    } else if (isAuthoritativeDrop(row)) {
      source.hasSync = true;
      source.syncLE ||= row.limitedEdition;
    } else {
      (communityOpenings[row.item_iid] ??= new Set()).add(row.opening_id);
      source.communityLE ||= row.limitedEdition;
    }
  }

  for (const [itemId, openings] of Object.entries(communityOpenings)) {
    sources[Number(itemId)].communityOpenings = openings.size;
  }

  return sources;
};

export const getItemDropSources = async (parent_iid: number) => {
  const rows = await prisma.openableItems.findMany({
    where: { parent_iid },
    select: {
      opening_id: true,
      item_iid: true,
      prizePool: true,
      limitedEdition: true,
      notes: true,
    },
  });

  return buildItemDropSources(rows);
};
