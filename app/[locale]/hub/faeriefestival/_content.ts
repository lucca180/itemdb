// Shared content for the Faerie Festival hub.
// Recycling point values/ranges come from FAERIE_FESTIVAL_POINT_TIERS (utils/utils.ts) —
// update them there and this page, item badges, and the "Recycling Points" list sort all
// stay in sync.
import { FAERIE_FESTIVAL_POINT_TIERS, type FaerieFestivalPointTier } from '@utils/utils';

export type TierCard = {
  points: number;
  description: string;
  link: string;
  color: string;
  coverURL: string;
  rarityRange: string;
};

type RecyclingTierUI = {
  description: string;
  color: string;
  coverURL: string;
};

// Presentation-only metadata per point value — the rarity ranges themselves come from
// FAERIE_FESTIVAL_POINT_TIERS. If TNT changes which point values exist (not just their
// ranges), add/remove an entry here to match.
const RECYCLING_TIER_UI: Record<number, RecyclingTierUI> = {
  10: {
    description: 'All items that give you 10 points to spend at the Prize Shop',
    color: '#40A464',
    coverURL: 'https://images.neopets.com/items/om_peppers2.gif',
  },
  8: {
    description: 'All items that give you 8 points to spend at the Prize Shop',
    color: '#C71F1D',
    coverURL: 'https://images.neopets.com/items/toy_bobble_abominable.gif',
  },
  6: {
    description:
      'All items that give you 6 points to spend at the Prize Shop (except Sticky Snowballs)',
    color: '#515C66',
    coverURL: 'https://images.neopets.com/items/toy_faerie_grey.gif',
  },
  5: {
    description: 'All items that give you 5 points to spend at the Prize Shop',
    color: '#6C3C44',
    coverURL: 'https://images.neopets.com/items/clo_bg_8bitprideflag.gif',
  },
  3: {
    description: 'All items that give you 3 points to spend at the Prize Shop',
    color: '#065DD2',
    coverURL: 'https://images.neopets.com/items/bluetradingcardback.gif',
  },
  1: {
    description: 'All items that give you 1 point to spend at the Prize Shop',
    color: '#8484BC',
    coverURL: 'https://images.neopets.com/items/om_chokato3.gif',
  },
};

function rarityRangeLabel(tier: FaerieFestivalPointTier) {
  return tier.minRarity === tier.maxRarity
    ? `r${tier.minRarity}`
    : `r${tier.minRarity} - r${tier.maxRarity}`;
}

function rarityLink(tier: FaerieFestivalPointTier) {
  return `/search?s=&rarity[]=${tier.minRarity}&rarity[]=${tier.maxRarity}&sortBy=price&price[]=1&price[]=`;
}

export const recyclingTiers: TierCard[] = [...FAERIE_FESTIVAL_POINT_TIERS]
  .sort((a, b) => b.points - a.points)
  .map((tier) => ({
    points: tier.points,
    rarityRange: rarityRangeLabel(tier),
    link: rarityLink(tier),
    ...RECYCLING_TIER_UI[tier.points],
  }));

export type CapsuleTier = {
  rarityLabel: string;
  description: string;
  link: string;
  color: string;
  coverURL: string;
  chance: string;
};

export const capsuleTiers: CapsuleTier[] = [
  {
    rarityLabel: 'r99',
    description: 'All r99 items that you can get from the Faerie Donation Capsule',
    link: '/search?s=&rarity[]=99&rarity[]=99',
    color: '#EC5CDC',
    coverURL: 'https://images.neopets.com/items/sta_queen_fyora.gif',
    chance: '15% chance',
  },
  {
    rarityLabel: 'r96 - r98',
    description: 'All r96 - r98 items that you can get from the Faerie Donation Capsule',
    link: '/search?s=&rarity[]=96&rarity[]=98',
    color: '#F70808',
    coverURL: 'https://images.neopets.com/items/sta_sloth_charm.gif',
    chance: '25% chance',
  },
  {
    rarityLabel: 'r90 - r95',
    description: 'All r90 - r95 items that you can get from the Faerie Donation Capsule',
    link: '/search?s=&rarity[]=90&rarity[]=95',
    color: '#F4C412',
    coverURL: 'https://images.neopets.com/items/toy_faerie_siyana.gif',
    chance: '60% chance',
  },
];

export type UtilityCard = {
  title: string;
  description: string;
  link: string;
  color: string;
  coverURL: string;
  footerText: string;
};

export const utilityCards: UtilityCard[] = [
  {
    title: 'Price Checker',
    description:
      'Check how many Faerie Festival points each item is worth — SDB, inventory, shops, and more.',
    link: '/tools/price-checker',
    color: '#65855B',
    coverURL: 'https://images.neopets.com/themes/h5/basic/images/v3/transferlog-icon.svg',
    footerText: 'Tool',
  },
  {
    title: 'Dynamic Lists',
    description: 'Create your own lists that update automatically based on your criteria',
    link: '/articles/checklists-and-dynamic-lists',
    color: '#FCE414',
    coverURL: '/icons/dynamic.png',
    footerText: 'Lists',
  },
  {
    title: 'SDB Importer',
    description:
      'Import all your sdb items to itemdb and sort them by Recycling Points to find the best items to recycle',
    link: '/lists/import',
    color: '#6A7895',
    coverURL: 'https://images.neopets.com/themes/h5/basic/images/v3/safetydeposit-icon.svg',
    footerText: 'Tool',
  },
  {
    title: 'Advanced Search',
    description:
      'Combine rarity, price, and other filters to build your own donation shopping list beyond the presets above.',
    link: '/articles/advanced-search-queries',
    color: '#3E8FB0',
    coverURL: '/icons/neosearch.svg',
    footerText: 'Guide',
  },
  {
    title: 'How to Sell Expensive Items',
    description: "Items r180 and above can't be donated — here's what to do with them instead.",
    link: '/articles/how-to-sell-expensive-items',
    color: '#D9A441',
    coverURL: '/icons/auction.png',
    footerText: 'Guide',
  },
];
