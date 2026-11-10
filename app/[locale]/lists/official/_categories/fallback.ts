import type { OfficialCategoryConfig } from './types';

/**
 * Categories without curation yet: every list shows under "All lists".
 * Give one a real layout by moving it to its own file.
 */

export const dailies = {
  slug: 'dailies',
  name: 'Neopets Dailies',
  tags: ['dailies'],
  color: '#D663A6',
  image: 'https://images.neopets.com/images/frontpage/y7_day.gif',
  description:
    'Discover complete prize lists from Neopets Dailies! Stay updated on the latest items from Neopets Freebies and never miss a daily freebie again.',
  intro: [
    'Discover complete prize lists from Neopets Dailies! Stay updated on the latest items from Neopets Freebies and never miss a daily freebie again.',
  ],
  layout: { type: 'groups', groups: [] },
} satisfies OfficialCategoryConfig;

export const adventCalendar = {
  slug: 'advent-calendar',
  name: 'Advent Calendar',
  tags: ['advent calendar'],
  color: '#FF0000',
  image: 'https://images.neopets.com/games/tradingcards/premium/0612.gif',
  description:
    'Explore the Advent Calendar lists and uncover the latest items and prizes from Neopets Advent Calendar Event!',
  intro: [
    'Explore the Advent Calendar lists and uncover the latest items and prizes from Neopets Advent Calendar Event!',
  ],
  layout: { type: 'groups', groups: [] },
} satisfies OfficialCategoryConfig;

export const stamps = {
  slug: 'stamps',
  name: 'Stamp Album',
  tags: ['stamps'],
  color: '#FFCC00',
  image: 'https://images.neopets.com/nt/ntimages/351_lenny_stamps.gif',
  description:
    'Explore detailed checklists for each Neopets Stamp Album page! Track your stamps and complete your collection with ease.',
  intro: [
    'Explore detailed checklists for each Neopets Stamp Album page! Track your stamps and complete your collection with ease.',
  ],
  layout: { type: 'groups', groups: [] },
} satisfies OfficialCategoryConfig;
