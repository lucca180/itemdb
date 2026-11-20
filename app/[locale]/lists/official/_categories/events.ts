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

export const neopetsAnniversary = {
  slug: 'neopets-anniversary',
  name: 'Birthday Celebration',
  tags: ['birthday celebrations'],
  // Only tagged "Treasure Maps" for now; drop this once it gets the Birthday Celebrations tag.
  lists: { slugs: ['birthday-map'] },
  // Wheel of Celebration list color.
  color: '#8ED1FC',
  image: 'https://images.neopets.com/homepage/marquee/icons/woc_event_icon.png',
  // Update the birthday number every year.
  seoTitle: 'Neopets 27th Birthday Prizes & Past Celebrations | itemdb',
  // Mention the current year's activities (2026: Celebration Pass and Monoceraptor raid).
  description:
    'Every prize from the Neopets Birthday Celebration in one place: the Wheel of Celebration, the new Celebration Pass, the Monoceraptor raid and the treasure map.',

  kicker: 'Yearly event',
  tagline: 'Wheel spins, treasure hunts and more from every Neopets Birthday.',
  intro: [
    'Looking for a birthday prize? Start with the latest celebration, then check past years to see when an item was last available.',
  ],

  layout: {
    type: 'editions',
    editionOrder: [
      'wheel-of-celebration-',
      'free-celebration-pass',
      'paid-celebration-pass',
      'monoceraptor-raid',
      'birthday-map',
      'birthday-treasure-hunt-',
    ],
    // Wheel of Celebration opened Nov 10 (support.neopets.com); the Celebration Pass end isn't
    // announced. Only applies once a 2026 list exists.
    editionDates: { 2026: { start: '2026-11-10' } },
    // Move to the new year when the birthday comes around again.
    editionYears: { 'birthday-map': [2025, 2026], 'birthday-treasure-hunt-prizes': [2025, 2026] },
  },

  faq: [
    {
      q: 'When is the Neopets Birthday Celebration?',
      a: 'Neopets launched on November 15, 1999, so its birthday is celebrated in mid-November, with events running for a couple of weeks.',
    },
    {
      q: 'What is the Wheel of Celebration?',
      a: 'A limited-time wheel that runs during the birthday celebration. Each year it ran has its own prize list on this page.',
    },
    {
      q: 'Where can I find the birthday map pieces?',
      a: 'The Birthday Map list has every piece of the birthday treasure map. Prizes for completing it are in the Birthday Treasure Hunt Prizes list.',
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

// Was `/lists/official/advent-calendar` (permanent redirect in next.config.ts).
export const winterStarlightCelebration = {
  slug: 'winter-starlight-celebration',
  name: 'Winter Starlight Celebration',
  tags: ['advent calendar'],
  // Stocking Stufftacular is tagged "NC Event"; the activities are Dailies/Quests (breadcrumbs keep their tag).
  lists: {
    slugPrefix: 'stocking-stufftacular-',
    slugs: ['snowager', 'tdmbgpop', 'snow-faerie-quest', 'snow-faerie-prizes'],
  },
  // Blue from the image's stamp frame.
  color: '#1F54BA',
  image: 'https://images.neopets.com/neopies/y25/images/nominees/AdventPrize_buorta61mo/03.png',
  seoTitle: 'Winter Starlight Celebration Prizes: Advent Calendar & More | itemdb',
  description:
    'Every prize from the Neopets Winter Starlight Celebration: Advent Calendar, Stocking Stufftacular and winter activities like the Snowager, TDMBGPOP and Snow Faerie quests.',

  layout: {
    type: 'editions',
    evergreen: {
      slugs: ['snowager', 'tdmbgpop', 'snow-faerie-quest', 'snow-faerie-prizes'],
      title: 'Activities',
    },
    // `advent-calendar-` also matches the bonus lists; the name tie-break puts them after the main one.
    editionOrder: ['advent-calendar-', 'premium-advent-calendar-', 'stocking-stufftacular-'],
    editionDates: {
      2025: { start: '2025-12-01', end: '2025-12-31' },
    },
    // One bonus list covers both years; the slug has no standalone year.
    editionYears: { 'advent-calendar-bonus-20212022': [2021, 2022] },
  },

  kicker: 'Yearly event',
  tagline: 'A month of prizes, stockings and a very sleepy Snowager.',
  intro: [
    "Reina hosts the celebration every December, and she's been handing out prizes for a long time. Here's everything: each Advent Calendar door, her bonus prizes, the Stocking Stufftacular and the winter activities that get a boost during the month.",
  ],
} satisfies OfficialCategoryConfig;
