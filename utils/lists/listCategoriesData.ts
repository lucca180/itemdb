import { UserList } from '@types';

export const listCategoriesData: {
  [cat: string]: {
    id: string;
    name: string;
    url: string;
    color: string;
    description: string;
    featured?: string[];
  };
} = {
  dailies: {
    id: 'dailies',
    name: 'Neopets Dailies',
    url: 'https://images.neopets.com/images/frontpage/y7_day.gif',
    color: '#D663A6',
    description:
      'Discover complete prize lists from Neopets Dailies! Stay updated on the latest items from Neopets Freebies and never miss a daily freebie again.',
  },
  'advent-calendar': {
    id: 'advent calendar',
    name: 'Advent Calendar',
    url: 'https://images.neopets.com/games/tradingcards/premium/0612.gif',
    color: '#FF0000',
    description:
      'Explore the Advent Calendar lists and uncover the latest items and prizes from Neopets Advent Calendar Event!',
  },
  'altador-cup': {
    id: 'altador cup',
    name: 'Altador Cup',
    url: 'https://images.neopets.com/nt/nt_images/548_altadorcup_referee.gif',
    color: '#FFCC00',
    description:
      'Explore the Altador Cup lists and uncover the latest prizes from Neopets Altador Cup Event!',
  },
  'festival-of-neggs': {
    id: 'festival of neggs',
    name: 'Festival of Neggs',
    url: 'https://images.neopets.com/neopies/2010/finalists/byd32vcnx73a/03.jpg',
    color: '#8FAA37',
    description:
      'Discover the complete prize list from current and past Festival of Neggs Neopets events!',
  },
  'quest-log': {
    id: 'quest log',
    name: 'Quest Log Prizes',
    url: 'https://images.neopets.com/neopies/y25/images/nominees/Surprise_2sytnvcmnj/04.png',
    color: '#F3C242',
    description:
      'Explore prize lists from current and past Quest Log prizes! Stay updated on the latest Daily Quests Prizes, find the best Weekly Prizes and make Neopoints easily! ',
    featured: ['weekly-quest-prize', 'daily-quest-prize', 'premium-daily-quest-prizes'],
  },
  stamps: {
    id: 'stamps',
    name: 'Stamp Album',
    url: 'https://images.neopets.com/nt/ntimages/351_lenny_stamps.gif',
    color: '#FFCC00',
    description:
      'Explore detailed checklists for each Neopets Stamp Album page! Track your stamps and complete your collection with ease.',
  },
};

export const sortOfficialLists = (a: UserList, b: UserList, featured?: string[]) => {
  if (featured) {
    const aIndex = featured.indexOf(a.slug?.toLowerCase() ?? '');
    const bIndex = featured.indexOf(b.slug?.toLowerCase() ?? '');
    if (aIndex !== -1 && bIndex === -1) return -1;
    if (aIndex === -1 && bIndex !== -1) return 1;
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
  }
  return a.name.localeCompare(b.name);
};
