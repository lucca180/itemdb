import type { GoalConfig } from './config';
import type { GoalCounterInfo } from './eligibility';

/** Sample id of the fixed-data images (`/goal/sample/<sample>/...`) for a goal counter. */
export const goalCounterSample = (info: GoalCounterInfo) =>
  info.kind === 'collection' ? info.collection : `stamps-${info.albumListId}`;

/** Style used when a goal counter is advertised outside the modal. */
export const goalCounterPreviewConfig = (info: GoalCounterInfo): GoalConfig =>
  info.kind === 'collection'
    ? { variant: 'classic-trophy', bg: 'transparent' }
    : { variant: 'mosaic', bg: 'transparent' };
