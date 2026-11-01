// Visual identity of the Goal Counters feature: every place that points to it (the tool page,
// the list button and modal, the import CTAs) uses these colors and icon.
import { LuTarget } from 'react-icons/lu';

export const GOALS_ACCENT = '#B7791F';
export const GOALS_ACCENT_LIGHT = '#f6d38b';
export const GOALS_ACCENT_RGB = '183, 121, 31';

export const goalsAccentAlpha = (alpha: number) => `rgba(${GOALS_ACCENT_RGB}, ${alpha})`;

export const GoalCounterIcon = LuTarget;
