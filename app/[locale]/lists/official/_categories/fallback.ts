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
  seoTitle: 'Neopets Dailies & Freebies: All Prize Lists | itemdb',
  description:
    "Prize lists for the Neopets dailies: Tombola, Giant Omelette, Coltzan's Shrine, the Wheels, the Snowager, Monthly Freebies and more.",
  intro: [
    'Not sure a daily is worth the click? Open its list to see everything it can give and how much each prize is worth.',
  ],
  layout: {
    type: 'groups',
    featured: { popular: 3 },
    groups: [],
  },
} satisfies OfficialCategoryConfig;
