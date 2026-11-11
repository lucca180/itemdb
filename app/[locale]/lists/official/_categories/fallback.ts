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

export const stamps = {
  slug: 'stamps',
  name: 'Stamp Album',
  tags: ['stamps'],
  color: '#FFCC00',
  image: 'https://images.neopets.com/nt/ntimages/351_lenny_stamps.gif',
  seoTitle: 'Neopets Stamps: Stamp Album Checklists & Prices | itemdb',
  description:
    "Neopets stamp checklists for 50+ Stamp Album pages, including Coins, Charms and Scarabs. Find the stamps you're missing and how much they cost.",
  intro: [
    'One checklist per Stamp Album page. Prices follow the market, so you can plan the cheapest way to finish a page.',
  ],
  layout: {
    type: 'groups',
    featured: { slugs: ['all-collectibles'], popular: 2 },
    groups: [],
  },
  faq: [
    {
      q: "How do I see which stamps I'm missing?",
      a: 'Import your items and itemdb will show which stamps on each checklist you already have.',
    },
    {
      q: 'Which stamps are the most expensive?',
      a: 'Open an album page and sort its list by price. Prices come from the market data itemdb collects.',
    },
  ],
} satisfies OfficialCategoryConfig;
