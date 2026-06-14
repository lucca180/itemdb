import { describe, expect, test } from 'vitest';
import {
  AUTHORITATIVE_OPENING_IDS,
  deduplicateCommunityDrops,
  DROP_SUPPORT_LOG_COEFFICIENT,
  evaluateDropEvidence,
  GRAM_OPTION_NOTE,
  getNpDropSupport,
  NC_DROP_SUPPORT,
  NP_DROP_SUPPORT_RULES,
  UNKNOWN_PARENT_MIN_OPENINGS,
} from '@utils/itemDropEvidence';

const parent = (
  overrides: Partial<Parameters<typeof evaluateDropEvidence>[0]> = {}
): Parameters<typeof evaluateDropEvidence>[0] => ({
  canOpen: 'true',
  canPlay: 'unknown',
  canEat: 'unknown',
  canRead: 'unknown',
  isNC: false,
  ...overrides,
});

const drop = (opening_id: string, item_iid: number, notes: string | null = null) => ({
  opening_id,
  item_iid,
  notes,
});

const communityDrops = (count: number, itemId: number, prefix = 'opening') =>
  Array.from({ length: count }, (_, index) => drop(`${prefix}-${index + 1}`, itemId));

const LARGE_POOL_OPENING_COUNT = 900;

describe('item drop evidence safeguards', () => {
  test('canOpen false vetoes community and authoritative drops', () => {
    const result = evaluateDropEvidence(parent({ canOpen: 'false' }), [
      drop(AUTHORITATIVE_OPENING_IDS[0], 1),
      drop('opening-1', 2),
      drop('opening-2', 2),
    ]);

    expect(Array.from(result.acceptedItemIds)).toEqual([]);
  });

  test('manual and ncmall sync only authorize their own items', () => {
    const result = evaluateDropEvidence(parent(), [
      drop(AUTHORITATIVE_OPENING_IDS[0], 1),
      drop(AUTHORITATIVE_OPENING_IDS[1], 2),
      drop('opening-1', 3),
    ]);

    expect(Array.from(result.acceptedItemIds).sort()).toEqual([1, 2]);
  });

  test('deduplicates a candidate within the same opening and excludes gram options', () => {
    const rows = deduplicateCommunityDrops([
      drop('opening-1', 1),
      drop('opening-1', 1),
      drop('opening-1', 2, GRAM_OPTION_NOTE),
      drop('opening-2', 1),
    ]);

    expect(rows).toEqual([drop('opening-1', 1), drop('opening-2', 1)]);
  });

  test('uses the configured distinct-opening support for NC drops', () => {
    const belowSupport = evaluateDropEvidence(
      parent({ isNC: true }),
      communityDrops(Math.max(0, NC_DROP_SUPPORT - 1), 1)
    );
    const requiredSupport = evaluateDropEvidence(
      parent({ isNC: true, canOpen: 'unknown' }),
      communityDrops(NC_DROP_SUPPORT, 1)
    );

    expect(belowSupport.acceptedItemIds.has(1)).toBe(false);
    expect(requiredSupport.acceptedItemIds.has(1)).toBe(true);
  });

  test('prioritizes play, then eat, then read for NP support', () => {
    const supportBase = Math.ceil(
      DROP_SUPPORT_LOG_COEFFICIENT * Math.log(LARGE_POOL_OPENING_COUNT + 1)
    );
    const expectedSupport = (signal: keyof typeof NP_DROP_SUPPORT_RULES) => {
      const rule = NP_DROP_SUPPORT_RULES[signal];
      return Math.max(rule.minimum, supportBase + rule.adjustment);
    };

    expect(getNpDropSupport(LARGE_POOL_OPENING_COUNT, parent({ canPlay: 'true' }))).toBe(
      expectedSupport('play')
    );
    expect(getNpDropSupport(LARGE_POOL_OPENING_COUNT, parent())).toBe(expectedSupport('neutral'));
    expect(getNpDropSupport(LARGE_POOL_OPENING_COUNT, parent({ canEat: 'true' }))).toBe(
      expectedSupport('eat')
    );
    expect(getNpDropSupport(LARGE_POOL_OPENING_COUNT, parent({ canRead: 'true' }))).toBe(
      expectedSupport('read')
    );
    expect(
      getNpDropSupport(LARGE_POOL_OPENING_COUNT, parent({ canEat: 'true', canPlay: 'true' }))
    ).toBe(expectedSupport('play'));
    expect(
      getNpDropSupport(
        LARGE_POOL_OPENING_COUNT,
        parent({ canRead: 'true', canEat: 'true', canPlay: 'true' })
      )
    ).toBe(expectedSupport('play'));
  });

  test('requires enough total openings when an NP parent canOpen is unknown', () => {
    const minimumOpenings = UNKNOWN_PARENT_MIN_OPENINGS.play;
    const candidateSupport = NP_DROP_SUPPORT_RULES.play.minimum;
    const insufficient = evaluateDropEvidence(
      parent({ canOpen: 'unknown', canPlay: 'true' }),
      communityDrops(candidateSupport, 1)
    );
    const enough = evaluateDropEvidence(parent({ canOpen: 'unknown', canPlay: 'true' }), [
      ...communityDrops(candidateSupport, 1),
      ...communityDrops(minimumOpenings - candidateSupport, 2, 'other-opening'),
    ]);

    expect(insufficient.acceptedItemIds.has(1)).toBe(false);
    expect(enough.acceptedItemIds.has(1)).toBe(true);
  });

  test('accepted candidates do not include statistically rejected items', () => {
    const result = evaluateDropEvidence(parent(), [
      drop('opening-1', 1),
      drop('opening-2', 1),
      drop('opening-3', 2),
    ]);

    expect(result.acceptedItemIds.has(1)).toBe(true);
    expect(result.acceptedItemIds.has(2)).toBe(false);
  });
});
