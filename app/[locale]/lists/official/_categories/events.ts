import type { OfficialCategoryConfig } from './types';

export const festivalOfNeggs = {
  slug: 'festival-of-neggs',
  name: 'Festival of Neggs',
  tags: ['festival of neggs', 'festival of neggs 2026'],
  color: '#8FAA37',
  image: 'https://images.neopets.com/neopies/2010/finalists/byd32vcnx73a/03.jpg',
  description:
    'Discover the complete prize list from current and past Festival of Neggs Neopets events!',

  kicker: 'Yearly event',
  tagline: 'Prizes from every Festival of Neggs, newest edition first.',
  intro: [
    'The latest edition stays on top even after it ends, so you can still check what it gave out.',
    'Older editions are kept below, one row per year.',
  ],

  layout: {
    type: 'editions',
    // Same as the 2026 list dates; keep in sync if the event is extended.
    editionDates: { 2026: { start: '2026-03-30', end: '2026-04-15' } },
  },

  // FAQ + articles right after the latest edition.
  sections: ['featured', ['faq', 'related'], 'intro', 'main'],

  faq: [
    {
      q: 'Where are the prizes from older festivals?',
      a: 'Every past edition has its own list under "Past editions".',
    },
    {
      q: 'Can I help keep these lists updated?',
      a: 'Yes! Suggest missing items on any official list.',
    },
  ],
} satisfies OfficialCategoryConfig;

export const altadorCup = {
  slug: 'altador-cup',
  name: 'Altador Cup',
  tags: ['altador cup', 'altador cup 2026'],
  color: '#FFCC00',
  image: 'https://images.neopets.com/nt/nt_images/548_altadorcup_referee.gif',
  description:
    'Explore the Altador Cup lists and uncover the latest prizes from Neopets Altador Cup Event!',

  kicker: 'Yearly event',
  tagline: 'Every Altador Cup prize list, edition by edition.',
  intro: [
    'The latest edition and its side lists are on top. Lists that apply to every edition have their own row.',
  ],

  layout: {
    type: 'editions',
    evergreen: { slugs: ['altador-cup-sign-up-prizes'], title: 'Every edition' },
    editionOrder: ['altador-cup-', 'premium-altador-cup-', 'ac-staff-tournament-'],
  },

  faq: [
    {
      q: 'Where are the prizes from older Altador Cups?',
      a: 'Every past edition has its own row under "Past editions", including the staff tournament.',
    },
  ],
} satisfies OfficialCategoryConfig;
