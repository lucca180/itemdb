import type { OfficialCategoryConfig } from './types';

export const questLog = {
  slug: 'quest-log',
  name: 'Quest Log Prizes',
  tags: ['quest log'],
  color: '#F3C242',
  image: 'https://images.neopets.com/neopies/y25/images/nominees/Surprise_2sytnvcmnj/04.png',
  seoTitle: 'Quest Log Prizes: Daily, Weekly and Premium | itemdb',
  description:
    'Explore prize lists from current and past Quest Log prizes! Stay updated on the latest Daily Quests Prizes, find the best Weekly Prizes and make Neopoints easily!',

  kicker: 'Dailies guide',
  tagline: 'Every prize the Quest Log has ever handed out, in one place.',
  intro: [
    'Each reward track below shows the pool you can win right now, followed by every past pool of that track.',
    'Pools rotate every couple of months. When a pool leaves the rotation, it moves to the history of its track.',
  ],

  layout: {
    type: 'tracks',
    tracks: [
      {
        id: 'weekly',
        title: 'Weekly',
        current: { slugs: ['weekly-quest-prize'] },
        history: {
          slugPrefix: 'old-weekly-quest-pool-',
          title: 'Past Weekly pools',
          description: 'Weekly rewards that already left the Quest Log, newest first.',
        },
      },
      {
        id: 'daily',
        title: 'Daily',
        current: { slugs: ['daily-quest-prize'] },
        history: {
          slugPrefix: 'old-daily-quest-pool-',
          title: 'Past Daily pools',
          description: 'Daily rewards that already left the Quest Log, newest first.',
        },
      },
      {
        id: 'neopass',
        title: 'NeoPass',
        current: { slugs: ['weekly-neopass-prize'] },
        history: {
          slugPrefix: ['old-weekly-neopass-pool-', 'special-weekly-neopass-prize-'],
          title: 'Past NeoPass pools',
          description: 'Regular pools and special weeks, newest first.',
        },
      },
      {
        id: 'premium',
        title: 'Premium',
        current: { slugs: ['premium-daily-quest-prizes', 'premium-weekly-quest-prize'] },
      },
      {
        id: 'tutorial',
        title: 'Tutorial',
        current: { slugs: ['quest-log-tutorial'] },
      },
    ],
  },
  archive: { slugs: ['retired-daily-quest-prize', 'retired-weekly-quest-prize'] },
  labels: [
    {
      match: { slugPrefix: 'special-weekly-neopass-prize-' },
      label: 'Special week',
      color: '#F687B3',
    },
  ],

  faq: [
    {
      q: 'How often are these lists updated?',
      a: 'Current pools are updated as new prizes are reported. When a pool rotates out, we freeze it and start a new list.',
    },
    {
      q: 'Why are old pools still here?',
      a: 'Past pools are useful to check when an item was last obtainable and how often it shows up.',
    },
    {
      q: 'Can I help keep these lists updated?',
      a: 'Yes! Suggest missing items on any official list.',
    },
  ],
} satisfies OfficialCategoryConfig;
