/** Distinct community openings required to accept any NC drop candidate. */
export const NC_DROP_SUPPORT = 1;

/** Controls how slowly the NP support requirement grows as more openings are reported. */
export const DROP_SUPPORT_LOG_COEFFICIENT = 0.4;

/** Opening ID used for administrator-maintained drop relationships. */
export const MANUAL_OPENING_ID = 'manual';

/** Opening ID used for relationships synchronized from official NC Mall data. */
export const NCMALL_SYNC_OPENING_ID = 'ncmall-sync';

/** Opening IDs whose rows are trusted without community evidence. */
export const AUTHORITATIVE_OPENING_IDS = [MANUAL_OPENING_ID, NCMALL_SYNC_OPENING_ID] as const;

/** Normalized notes marker used to keep gram options out of community evidence. */
export const GRAM_OPTION_NOTE = 'gramoption';

/** Minimum community sample needed to establish an unknown NP parent as openable. */
export const UNKNOWN_PARENT_MIN_OPENINGS = {
  play: 5,
  neutral: 8,
  eat: 12,
  read: 20,
} as const;

/** Minimum support floor and logarithmic adjustment applied for each NP parent signal. */
export const NP_DROP_SUPPORT_RULES = {
  play: { minimum: 2, adjustment: -1 },
  neutral: { minimum: 2, adjustment: 0 },
  eat: { minimum: 3, adjustment: 1 },
  read: { minimum: 4, adjustment: 2 },
} as const;

type ThreeStateBoolean = 'true' | 'unknown' | 'false';

export type DropEvidenceParent = {
  canOpen: ThreeStateBoolean;
  canPlay: ThreeStateBoolean;
  canEat: ThreeStateBoolean;
  canRead: ThreeStateBoolean;
  isNC: boolean;
};

export type DropEvidenceRow = {
  opening_id: string;
  item_iid: number;
  notes: string | null;
};

type ParentSignal = keyof typeof UNKNOWN_PARENT_MIN_OPENINGS;

/** Identifies trusted rows that bypass all community evidence thresholds. */
export const isAuthoritativeDrop = (row: Pick<DropEvidenceRow, 'opening_id'>) =>
  AUTHORITATIVE_OPENING_IDS.some((openingId) => openingId === row.opening_id);

/** Selects the applicable usage signal, prioritizing play when multiple flags are true. */
export const getParentSignal = (
  parent: Pick<DropEvidenceParent, 'canPlay' | 'canEat' | 'canRead'>
): ParentSignal => {
  if (parent.canPlay === 'true') return 'play';
  if (parent.canEat === 'true') return 'eat';
  if (parent.canRead === 'true') return 'read';
  return 'neutral';
};

/** Calculates the distinct-opening support required for an NP candidate. */
export const getNpDropSupport = (
  openingCount: number,
  parent: Pick<DropEvidenceParent, 'canPlay' | 'canEat' | 'canRead'>
) => {
  const supportBase = Math.ceil(DROP_SUPPORT_LOG_COEFFICIENT * Math.log(openingCount + 1));
  const rule = NP_DROP_SUPPORT_RULES[getParentSignal(parent)];

  return Math.max(rule.minimum, supportBase + rule.adjustment);
};

/** Returns how many community openings must establish an unknown NP parent as openable. */
export const getUnknownParentMinOpenings = (
  parent: Pick<DropEvidenceParent, 'canPlay' | 'canEat' | 'canRead'>
) => UNKNOWN_PARENT_MIN_OPENINGS[getParentSignal(parent)];

/**
 * Produces the community evidence set: trusted and gram-option rows are excluded,
 * and each candidate can contribute at most once per opening.
 */
export const deduplicateCommunityDrops = <T extends DropEvidenceRow>(rows: T[]) => {
  const seen = new Set<string>();

  return rows.filter((row) => {
    if (isAuthoritativeDrop(row) || row.notes?.toLowerCase().includes(GRAM_OPTION_NOTE))
      return false;

    const key = `${row.opening_id}:${row.item_iid}`;
    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
};

/**
 * Applies parent and candidate safeguards, returning the item IDs allowed to
 * participate in downstream pool, odds, and inverse-parent calculations.
 */
export const evaluateDropEvidence = <T extends DropEvidenceRow>(
  parent: DropEvidenceParent,
  rows: T[]
) => {
  const authoritativeItemIds = new Set(rows.filter(isAuthoritativeDrop).map((row) => row.item_iid));

  if (parent.canOpen === 'false') {
    return {
      acceptedItemIds: new Set<number>(),
      authoritativeItemIds,
      communityRows: [] as T[],
      openingCount: 0,
      requiredSupport: parent.isNC ? NC_DROP_SUPPORT : 0,
    };
  }

  const communityRows = deduplicateCommunityDrops(rows);
  const openingCount = new Set(communityRows.map((row) => row.opening_id)).size;
  const requiredSupport = parent.isNC ? NC_DROP_SUPPORT : getNpDropSupport(openingCount, parent);

  const supportByItem = new Map<number, number>();
  for (const row of communityRows) {
    supportByItem.set(row.item_iid, (supportByItem.get(row.item_iid) ?? 0) + 1);
  }

  const statisticallyAccepted = new Set(
    Array.from(supportByItem.entries())
      .filter(([, support]) => support >= requiredSupport)
      .map(([itemId]) => itemId)
  );

  const parentHasEnoughEvidence =
    parent.canOpen === 'true' || parent.isNC || openingCount >= getUnknownParentMinOpenings(parent);

  const acceptedItemIds = new Set(authoritativeItemIds);
  if (parentHasEnoughEvidence) {
    statisticallyAccepted.forEach((itemId) => acceptedItemIds.add(itemId));
  }

  return {
    acceptedItemIds,
    authoritativeItemIds,
    communityRows,
    openingCount,
    requiredSupport,
  };
};
