import { COLLECTION_VARIANTS, STAMP_VARIANTS, type GoalConfig, type GoalVariant } from './config';
import { GOAL_COLLECTIONS } from './collections';
import type { GoalCounterInfo } from './eligibility';

/** Sample id of the fixed-data images (`/goal/sample/<sample>/...`) for a goal counter. */
export const goalCounterSample = (info: GoalCounterInfo) =>
  info.kind === 'collection' ? info.collection : `stamps-${info.albumListId}`;

/** Style used when a goal counter is advertised outside the modal. */
export const goalCounterPreviewConfig = (info: GoalCounterInfo): GoalConfig =>
  info.kind === 'collection'
    ? { variant: 'classic-trophy', bg: 'transparent' }
    : { variant: 'mosaic', bg: 'transparent' };

/** Styles offered for a goal counter; the trophy style only when the collection has a trophy. */
export const goalCounterVariants = (info: GoalCounterInfo): readonly GoalVariant[] =>
  info.kind === 'collection'
    ? COLLECTION_VARIANTS.filter(
        (v) => v !== 'classic-trophy' || !!GOAL_COLLECTIONS[info.collection].trophy
      )
    : STAMP_VARIANTS;
