// Fixed data for the style thumbnails in the goal counter modal: everyone with the same album page
// or collection sees the same images, so they can be cached for long. Only the large preview
// renders the user's own data.
import { GOAL_COLLECTIONS, isGoalCollectionSlug, type GoalCollectionSlug } from './collections';
import { countBits, getStampGoalData, type StampGoalData } from './stampGoalData';
import type { CollectionGoalData } from './collectionGoalData';

/** Stamp samples are keyed by the official album list: `stamps-<album list id>`. */
const STAMP_SAMPLE_PATTERN = /^stamps-(\d+)$/;

export type GoalSample = `stamps-${number}` | GoalCollectionSlug;

export const stampSample = (albumListId: number): GoalSample => `stamps-${albumListId}`;

export const parseStampSample = (value: string): number | null => {
  const match = value.match(STAMP_SAMPLE_PATTERN);
  return match ? Number(match[1]) : null;
};

export const isGoalSample = (value: string): value is GoalSample =>
  parseStampSample(value) !== null || isGoalCollectionSlug(value);

// a mix spread over the page, 12 of 25
const SAMPLE_OWNED_POSITIONS = [1, 2, 3, 5, 6, 8, 11, 13, 14, 19, 20, 23];
const SAMPLE_OWNED_MASK = SAMPLE_OWNED_POSITIONS.reduce((mask, pos) => mask | (1 << (pos - 1)), 0);

/** The album page's real avatar, title and stamps, with a fixed set of owned stamps. */
export async function getStampSampleData(albumListId: number): Promise<StampGoalData | null> {
  const data = await getStampGoalData(albumListId, { officialOnly: true });
  if (!data) return null;
  return { ...data, ownedMask: SAMPLE_OWNED_MASK, ownedCount: countBits(SAMPLE_OWNED_MASK) };
}

// roughly a third of each collection; totals are illustrative, not live
const SAMPLE_PROGRESS: Record<GoalCollectionSlug, { owned: number; total: number }> = {
  'gourmet-food': { owned: 312, total: 1441 },
  neodeck: { owned: 187, total: 365 },
  'book-award': { owned: 1204, total: 3695 },
  'booktastic-book-award': { owned: 96, total: 216 },
};

export const sampleCollectionData = (collection: GoalCollectionSlug): CollectionGoalData => ({
  collection,
  title: GOAL_COLLECTIONS[collection].title,
  iconImage: GOAL_COLLECTIONS[collection].icon,
  ...SAMPLE_PROGRESS[collection],
});
