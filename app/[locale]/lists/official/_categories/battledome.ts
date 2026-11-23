import type { OfficialCategoryConfig } from './types';

/** One prize list per arena (1-Player Challengers) plus Premium Battledome Prizes. */
export const battledome = {
  slug: 'battledome',
  name: 'Battledome Prizes',
  tags: ['battledome'],
  color: '#D9412F',
  image: 'https://images.neopets.com/battledome/battledome.gif',
  seoTitle: 'Neopets Battledome Prizes: Every Arena & Challenger | itemdb',
  description:
    'Every Neopets Battledome prize list in one place: the 1-Player Challenger prizes for each arena, plus the Premium Battledome opponents.',

  kicker: 'Battledome guide',
  tagline: 'Find out what every challenger can drop, arena by arena.',
  intro: [
    'Each arena has its own list with the prizes from its 1-Player Challengers. Open one to see the prizes grouped by challenger, plus the ones any challenger in that arena can drop.',
  ],

  layout: {
    type: 'groups',
    featured: { slugs: ['premium-battledome-prizes'], label: 'Premium', popular: 2 },
    groups: [
      {
        id: 'arenas',
        title: 'Arenas',
        description: 'One list per arena, with the prizes from its 1-Player Challengers.',
        // Arena lists are tagged "Battledome, Arena" (Battledome first: it drives the breadcrumb).
        match: { tags: ['arena'] },
      },
    ],
  },
} satisfies OfficialCategoryConfig;
