import type { OfficialCategoryConfig } from './types';

export const questLog = {
  slug: 'quest-log',
  name: 'Quest Log Prizes',
  tags: ['quest log'],
  color: '#F3C242',
  image: 'https://images.neopets.com/neopies/y25/images/nominees/Surprise_2sytnvcmnj/04.png',
  seoTitle: 'Quest Log Prizes Guide: Daily, Weekly & NeoPass | itemdb',
  description:
    'Every Neopets Quest Log prize pool in one place: the current Daily, Weekly, NeoPass and Premium rewards, plus the full history of past pools.',

  kicker: 'Dailies guide',
  tagline: 'Explore current and past Quest Log prizes, all in one place.',
  intro: [
    'The Quest Log has separate reward tracks: Daily, Weekly, NeoPass and Premium. Each one below shows the pool you can win right now, followed by its past pools.',
    'Pools rotate every couple of months. When one rotates out, we freeze its list and start a new one, so you can still check what it gave.',
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
      q: 'What prizes can I get from the Quest Log?',
      a: 'Each track has its own prize pool: Daily, Weekly, NeoPass and Premium. The current pool of each track is at the top of this page.',
    },
    {
      q: 'How often do Quest Log prize pools change?',
      a: 'Pools rotate every couple of months. When one rotates out, its list is frozen and moved to the history of its track, and a new list starts.',
    },
    {
      q: 'What is a NeoPass Special Week?',
      a: 'Sometimes the NeoPass has a Special Week, with special prizes for a limited time. Those pools are marked as "Special week" in the NeoPass history.',
    },
    {
      q: 'How are these lists kept up to date?',
      a: "Prizes are added as players report them. Got something that isn't listed? Suggest it on the list and it will be reviewed.",
    },
  ],
} satisfies OfficialCategoryConfig;
