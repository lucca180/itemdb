/**
 * Shared mock data for the NC Mall hub design round.
 * Not wired to Prisma/APIs — every concept page must import from here.
 */
import type { ItemMallData, ItemV2For, NCValue, UserList } from '@types';
import type { RainbowPoolComboTile } from '@utils/petColorTool';
import type { StyleToken } from '@utils/petStyles/display';

export const NC_MALL_HUB_THEME = {
  color: '#CDC1FF',
  colorWash: 'rgba(205, 193, 255, 0.58)',
  banner: 'https://images.neopets.com/ncmall/shopkeepers/cashshop_new.png',
  fashionBanner: 'https://images.neopets.com/ncmall/shopkeepers/cashshop_fashionshow.png',
  limitedBanner: 'https://images.neopets.com/ncmall/shopkeepers/cashshop_limited.png',
  exclusiveBanner: 'https://images.neopets.com/ncmall/shopkeepers/exclusive_shop1.png',
  icon: '/icons/nc.png',
} as const;

export const NC_MALL_HUB_QUICK_LINKS = [
  { label: 'Leaving NC Mall', href: '/mall/leaving', description: 'Items leaving the mall soon' },
  { label: 'Report NC trades', href: '/mall/report', description: 'Send trades to Lebron' },
  { label: 'Pet Styles', href: '/rainbow-pool/pet-styles', description: 'Tokens and combos' },
  { label: 'Lebron values', href: '/articles/lebron', description: 'How NC caps values work' },
  { label: 'Search NC items', href: '/search?type=nc', description: 'Full NC catalog search' },
  { label: 'Exclusive clothes', href: '/hub/outfits/acara', description: 'Wearables by species' },
] as const;

export type NcMallLebronUpdate = {
  item: ItemV2For<'card'>;
  previousRange: string;
  newRange: string;
  direction: 'up' | 'down' | 'new';
  pricedAt: string;
  isVolatile: boolean;
};

export type NcMallMockTrade = {
  id: number;
  offered: ItemV2For<'card'>[];
  received: ItemV2For<'card'>[];
  reportedAt: string;
  notes: string;
};

function lebronValue(min: number, max: number, addedAt: string): NCValue {
  return {
    minValue: min,
    maxValue: max,
    range: min === max ? String(min) : `${min}-${max}`,
    addedAt,
    source: 'lebron',
  };
}

function mallPrice(input: {
  price: number;
  saleBegin?: string | null;
  saleEnd?: string | null;
  discountPrice?: number | null;
  discountBegin?: string | null;
  discountEnd?: string | null;
}): ItemMallData & { type: 'ncMall' } {
  return {
    type: 'ncMall',
    price: input.price,
    saleBegin: input.saleBegin ?? '2026-08-01T00:00:00.000Z',
    saleEnd: input.saleEnd ?? null,
    discountPrice: input.discountPrice ?? null,
    discountBegin: input.discountBegin ?? null,
    discountEnd: input.discountEnd ?? null,
  };
}

function card(input: {
  id: number;
  name: string;
  slug: string;
  imageId: string;
  description: string;
  colorHex: string;
  flags?: ItemV2For<'card'>['flags'];
  category?: string;
  rarity?: number;
  price: ItemV2For<'card'>['price'];
  ncValue?: NCValue;
}): ItemV2For<'card'> {
  return {
    internal_id: input.id,
    item_id: 80000 + input.id,
    name: input.name,
    slug: input.slug,
    image: {
      url: `https://images.neopets.com/items/${input.imageId}.gif`,
      id: input.imageId,
    },
    type: 'nc',
    description: input.description,
    status: 'active',
    flags: input.flags ?? [],
    colorHex: input.colorHex,
    price: input.price,
    ncValue: input.ncValue,
    rarity: input.rarity ?? 180,
    category: input.category ?? 'Clothes',
    estVal: 1,
  };
}

function officialList(input: {
  id: number;
  name: string;
  slug: string;
  description: string;
  coverURL: string;
  colorHex: string;
  itemCount: number;
  seriesStart: string;
  seriesEnd: string | null;
  officialTag: string[];
}): UserList {
  return {
    internal_id: input.id,
    name: input.name,
    description: input.description,
    owner: {
      id: 'official',
      username: 'official',
      neopetsUser: null,
      lastSeen: '2026-08-21T00:00:00.000Z',
    },
    coverURL: input.coverURL,
    official: true,
    purpose: 'none',
    visibility: 'public',
    colorHex: input.colorHex,
    sortBy: 'addedAt',
    sortDir: 'asc',
    order: null,
    createdAt: input.seriesStart,
    updatedAt: '2026-08-20T18:00:00.000Z',
    itemCount: input.itemCount,
    officialTag: input.officialTag,
    userTag: null,
    dynamicType: null,
    lastSync: null,
    linkedListId: null,
    canBeLinked: false,
    slug: input.slug,
    seriesType: 'listDates',
    seriesStart: input.seriesStart,
    seriesEnd: input.seriesEnd,
    highlight: null,
    highlightText: null,
  };
}

function styleToken(input: {
  id: number;
  name: string;
  series: string;
  speciesName: string;
  colorName: string;
  imageId: string;
  itemSlug: string;
  releasedAt: string;
  inStudio: boolean;
  isPrismatic?: boolean;
  ncValue: NCValue | null;
}): StyleToken {
  return {
    id: input.id,
    name: input.name,
    series: input.series,
    speciesName: input.speciesName,
    colorName: input.colorName,
    isPrismatic: input.isPrismatic ?? false,
    prismaticVariant: null,
    inStudio: input.inStudio,
    seekingCount: 4,
    tradingCount: 2,
    ncTradeCount: 6,
    trades: [],
    ncValue: input.ncValue,
    imageUrl: `https://images.neopets.com/items/${input.imageId}.gif`,
    previewUrl: `https://cdn.itemdb.com.br/colors/${input.speciesName.toLowerCase()}_${input.colorName.toLowerCase()}.png`,
    imageId: input.imageId,
    itemSlug: input.itemSlug,
    releasedAt: input.releasedAt,
  };
}

export const newMallItems: ItemV2For<'card'>[] = [
  card({
    id: 101,
    name: 'Neovian Lantern Background',
    slug: 'neovian-lantern-background',
    imageId: 'gold_bg',
    description: 'A newly released NC Mall background.',
    colorHex: '#6B4C9A',
    flags: [],
    category: 'Background',
    price: mallPrice({ price: 250, saleBegin: '2026-08-20T00:00:00.000Z' }),
  }),
  card({
    id: 102,
    name: 'Moonlit Faerie Wings',
    slug: 'moonlit-faerie-wings',
    imageId: 'grey_pb',
    description: 'Iridescent wings from this week’s mall drop.',
    colorHex: '#8B5CF6',
    flags: ['wearable'],
    price: mallPrice({ price: 400, saleBegin: '2026-08-19T00:00:00.000Z' }),
    ncValue: lebronValue(3, 5, '2026-08-20T16:00:00.000Z'),
  }),
  card({
    id: 103,
    name: 'Cash Shop Trinket Foreground',
    slug: 'cash-shop-trinket-foreground',
    imageId: 'baby_pb',
    description: 'A sparkly foreground for custom outfits.',
    colorHex: '#C084FC',
    category: 'Foreground',
    price: mallPrice({ price: 150, saleBegin: '2026-08-21T00:00:00.000Z' }),
  }),
  card({
    id: 104,
    name: 'Limited Gallery Frame',
    slug: 'limited-gallery-frame',
    imageId: 'plushie_pb',
    description: 'Frame released with the fashion show restock.',
    colorHex: '#A78BFA',
    category: 'Frame',
    price: mallPrice({ price: 200, saleBegin: '2026-08-18T00:00:00.000Z' }),
  }),
  card({
    id: 105,
    name: 'Starlit Usul Wig',
    slug: 'starlit-usul-wig',
    imageId: 'faerie_pb',
    description: 'New species-locked wig.',
    colorHex: '#F0ABFC',
    flags: ['wearable'],
    price: mallPrice({ price: 350, saleBegin: '2026-08-21T00:00:00.000Z' }),
  }),
  card({
    id: 106,
    name: 'Midnight Tea Set',
    slug: 'midnight-tea-set',
    imageId: 'mushroom_bg',
    description: 'Neohome furniture drop.',
    colorHex: '#7C3AED',
    flags: ['neohome'],
    category: 'Furniture',
    price: mallPrice({ price: 300, saleBegin: '2026-08-17T00:00:00.000Z' }),
  }),
];

export const onSaleMallItems: ItemV2For<'card'>[] = [
  card({
    id: 201,
    name: 'Summer Carnival Background',
    slug: 'summer-carnival-background',
    imageId: 'island_bg',
    description: 'On sale until the weekend.',
    colorHex: '#FB923C',
    category: 'Background',
    price: mallPrice({
      price: 500,
      discountPrice: 250,
      discountBegin: '2026-08-18T00:00:00.000Z',
      discountEnd: '2026-08-25T23:59:00.000Z',
    }),
    ncValue: lebronValue(4, 6, '2026-08-10T00:00:00.000Z'),
  }),
  card({
    id: 202,
    name: 'Pastel Cloud Wig',
    slug: 'pastel-cloud-wig',
    imageId: 'msp_pb',
    description: 'Wearable wig at half price.',
    colorHex: '#F472B6',
    flags: ['wearable'],
    price: mallPrice({
      price: 400,
      discountPrice: 200,
      discountBegin: '2026-08-15T00:00:00.000Z',
      discountEnd: '2026-08-24T23:59:00.000Z',
    }),
  }),
  card({
    id: 203,
    name: 'Gourmet Kitchen Foreground',
    slug: 'gourmet-kitchen-foreground',
    imageId: 'halloween_bg',
    description: 'Discounted foreground.',
    colorHex: '#FDBA74',
    category: 'Foreground',
    price: mallPrice({
      price: 300,
      discountPrice: 150,
      discountBegin: '2026-08-20T00:00:00.000Z',
      discountEnd: '2026-08-27T23:59:00.000Z',
    }),
  }),
  card({
    id: 204,
    name: 'Royal Sash',
    slug: 'royal-sash',
    imageId: 'royalboy_acara',
    description: 'Classic wearable on promo.',
    colorHex: '#F59E0B',
    flags: ['wearable'],
    price: mallPrice({
      price: 250,
      discountPrice: 100,
      discountBegin: '2026-08-19T00:00:00.000Z',
      discountEnd: '2026-08-23T23:59:00.000Z',
    }),
    ncValue: lebronValue(1, 2, '2026-08-19T00:00:00.000Z'),
  }),
];

export const leavingMallItems: ItemV2For<'card'>[] = [
  card({
    id: 301,
    name: 'Festival Confetti Background',
    slug: 'festival-confetti-background',
    imageId: 'eventide_pb',
    description: 'Leaves the mall tomorrow.',
    colorHex: '#C4B5FD',
    category: 'Background',
    price: mallPrice({
      price: 250,
      saleBegin: '2026-07-01T00:00:00.000Z',
      saleEnd: '2026-08-22T23:59:00.000Z',
    }),
    ncValue: lebronValue(2, 3, '2026-08-01T00:00:00.000Z'),
  }),
  card({
    id: 302,
    name: 'Berry Bouquet Handheld',
    slug: 'berry-bouquet-handheld',
    imageId: 'darigan_pb',
    description: 'Leaving in three days.',
    colorHex: '#DDD6FE',
    flags: ['wearable'],
    price: mallPrice({
      price: 150,
      saleBegin: '2026-07-10T00:00:00.000Z',
      saleEnd: '2026-08-24T23:59:00.000Z',
    }),
  }),
  card({
    id: 303,
    name: 'Sunset Balcony Background',
    slug: 'sunset-balcony-background',
    imageId: 'stealthy_pb',
    description: 'Last week in the mall.',
    colorHex: '#A78BFA',
    category: 'Background',
    price: mallPrice({
      price: 400,
      saleBegin: '2026-06-01T00:00:00.000Z',
      saleEnd: '2026-08-28T23:59:00.000Z',
    }),
    ncValue: lebronValue(5, 8, '2026-08-12T00:00:00.000Z'),
  }),
  card({
    id: 304,
    name: 'Garden Trellis Foreground',
    slug: 'garden-trellis-foreground',
    imageId: 'royalgirl_acara',
    description: 'Leaves at the end of the month.',
    colorHex: '#86EFAC',
    category: 'Foreground',
    price: mallPrice({
      price: 200,
      saleBegin: '2026-07-15T00:00:00.000Z',
      saleEnd: '2026-08-31T23:59:00.000Z',
    }),
  }),
];

export const freeMallItems: ItemV2For<'card'>[] = [
  card({
    id: 401,
    name: 'Welcome Gift Box',
    slug: 'welcome-gift-box',
    imageId: 'plushie_pb',
    description: 'Free with a mall purchase this week.',
    colorHex: '#F9A8D4',
    category: 'Gift',
    price: mallPrice({ price: 0, saleBegin: '2026-08-18T00:00:00.000Z' }),
  }),
  card({
    id: 402,
    name: 'NC Mall Sticker',
    slug: 'nc-mall-sticker',
    imageId: 'baby_pb',
    description: 'Free collectible sticker.',
    colorHex: '#E9D5FF',
    category: 'Sticker',
    price: mallPrice({ price: 0, saleBegin: '2026-08-01T00:00:00.000Z' }),
  }),
];

export const mallCapsules: ItemV2For<'card'>[] = [
  card({
    id: 501,
    name: 'Fashion Fortune Capsule',
    slug: 'fashion-fortune-capsule',
    imageId: 'plushie_pb',
    description: 'Openable capsule currently in the mall.',
    colorHex: '#C084FC',
    category: 'Mystery Capsule',
    flags: [],
    price: mallPrice({ price: 250, saleBegin: '2026-08-10T00:00:00.000Z' }),
    ncValue: lebronValue(2, 4, '2026-08-15T00:00:00.000Z'),
  }),
  card({
    id: 502,
    name: 'Background Bonanza Capsule',
    slug: 'background-bonanza-capsule',
    imageId: 'gold_bg',
    description: 'Capsule of retired backgrounds.',
    colorHex: '#818CF8',
    category: 'Mystery Capsule',
    price: mallPrice({ price: 400, saleBegin: '2026-08-05T00:00:00.000Z' }),
    ncValue: lebronValue(4, 7, '2026-08-18T00:00:00.000Z'),
  }),
];

export const popularNcItems: ItemV2For<'card'>[] = [
  card({
    id: 601,
    name: 'Grey Faerie Wings',
    slug: 'grey-faerie-wings',
    imageId: 'grey_pb',
    description: 'Most viewed NC item this week.',
    colorHex: '#A1A1AA',
    flags: ['wearable'],
    price: null,
    ncValue: lebronValue(15, 20, '2026-08-21T10:00:00.000Z'),
  }),
  card({
    id: 602,
    name: 'Magical Faerieland Background',
    slug: 'magical-faerieland-background',
    imageId: 'faerie_pb',
    description: 'High trade demand background.',
    colorHex: '#D8B4FE',
    category: 'Background',
    price: null,
    ncValue: lebronValue(8, 12, '2026-08-20T09:00:00.000Z'),
  }),
  card({
    id: 603,
    name: 'Vintage Lace Dress',
    slug: 'vintage-lace-dress',
    imageId: 'royalgirl_acara',
    description: 'Popular wearable on item pages.',
    colorHex: '#FBCFE8',
    flags: ['wearable'],
    price: mallPrice({ price: 500, saleBegin: '2026-08-01T00:00:00.000Z' }),
    ncValue: lebronValue(4, 6, '2026-08-19T00:00:00.000Z'),
  }),
  card({
    id: 604,
    name: 'Void Within Portal Background',
    slug: 'void-within-portal-background',
    imageId: 'stealthy_pb',
    description: 'Plot leftover still heavily traded.',
    colorHex: '#6D28D9',
    category: 'Background',
    price: null,
    ncValue: lebronValue(6, 9, '2026-08-21T08:00:00.000Z'),
  }),
  card({
    id: 605,
    name: 'Royal Boy Acara Token',
    slug: 'royal-boy-acara-token',
    imageId: 'royalboy_acara',
    description: 'Pet style token with lots of pageviews.',
    colorHex: '#FDE68A',
    flags: ['wearable'],
    price: null,
    ncValue: lebronValue(10, 14, '2026-08-18T00:00:00.000Z'),
  }),
  card({
    id: 606,
    name: 'Neovian Street Background',
    slug: 'neovian-street-background',
    imageId: 'gold_bg',
    description: 'Classic NC background.',
    colorHex: '#78716C',
    category: 'Background',
    price: null,
    ncValue: lebronValue(20, 25, '2026-08-16T00:00:00.000Z'),
  }),
];

export const lebronUpdates: NcMallLebronUpdate[] = [
  {
    item: popularNcItems[0],
    previousRange: '12-16',
    newRange: '15-20',
    direction: 'up',
    pricedAt: '2026-08-21T10:00:00.000Z',
    isVolatile: true,
  },
  {
    item: popularNcItems[1],
    previousRange: '10-14',
    newRange: '8-12',
    direction: 'down',
    pricedAt: '2026-08-20T09:00:00.000Z',
    isVolatile: false,
  },
  {
    item: newMallItems[1],
    previousRange: '—',
    newRange: '3-5',
    direction: 'new',
    pricedAt: '2026-08-20T16:00:00.000Z',
    isVolatile: true,
  },
  {
    item: leavingMallItems[2],
    previousRange: '4-6',
    newRange: '5-8',
    direction: 'up',
    pricedAt: '2026-08-21T07:30:00.000Z',
    isVolatile: false,
  },
  {
    item: mallCapsules[1],
    previousRange: '5-6',
    newRange: '4-7',
    direction: 'down',
    pricedAt: '2026-08-18T14:00:00.000Z',
    isVolatile: true,
  },
];

export const activeNcEvents: UserList[] = [
  officialList({
    id: 9001,
    name: 'NC Mall Fashion Show 2026',
    slug: 'nc-mall-fashion-show-2026',
    description: 'Wearables and backgrounds from the August fashion show attraction.',
    coverURL: NC_MALL_HUB_THEME.fashionBanner,
    colorHex: '#C084FC',
    itemCount: 48,
    seriesStart: '2026-08-08T00:00:00.000Z',
    seriesEnd: '2026-08-31T23:59:00.000Z',
    officialTag: ['nc mall', 'attraction'],
  }),
  officialList({
    id: 9002,
    name: 'Styling Studio Rotation',
    slug: 'styling-studio-rotation-aug',
    description: 'Pet style tokens currently available in the Styling Studio.',
    coverURL: 'https://images.neopets.com/ncmall/shopkeepers/cashshop_homestructure.png',
    colorHex: '#F0ABFC',
    itemCount: 24,
    seriesStart: '2026-08-01T00:00:00.000Z',
    seriesEnd: '2026-08-28T23:59:00.000Z',
    officialTag: ['nc mall', 'pet styles'],
  }),
  officialList({
    id: 9003,
    name: 'Void Within NC Prizes',
    slug: 'void-within-nc-prizes',
    description: 'NC prizes still associated with The Void Within plot.',
    coverURL: 'https://itemdb.com.br/hub/tvw-banner.png',
    colorHex: '#7C3AED',
    itemCount: 36,
    seriesStart: '2026-07-15T00:00:00.000Z',
    seriesEnd: null,
    officialTag: ['plot', 'nc'],
  }),
  officialList({
    id: 9004,
    name: 'Limited Time Capsules',
    slug: 'limited-time-capsules-aug',
    description: 'Openable capsules currently buyable in the mall.',
    coverURL: NC_MALL_HUB_THEME.limitedBanner,
    colorHex: '#FDBA74',
    itemCount: 12,
    seriesStart: '2026-08-10T00:00:00.000Z',
    seriesEnd: '2026-08-26T23:59:00.000Z',
    officialTag: ['nc mall', 'capsule'],
  }),
];

export const recentPetStyles: StyleToken[] = [
  styleToken({
    id: 1,
    name: 'Royal Boy Acara Token',
    series: 'Nostalgic Royal',
    speciesName: 'Acara',
    colorName: 'Blue',
    imageId: 'royalboy_acara',
    itemSlug: 'royal-boy-acara-token',
    releasedAt: '2026-08-20T00:00:00.000Z',
    inStudio: true,
    ncValue: lebronValue(10, 14, '2026-08-18T00:00:00.000Z'),
  }),
  styleToken({
    id: 2,
    name: 'Grey Ixi Token',
    series: 'Grey',
    speciesName: 'Ixi',
    colorName: 'Grey',
    imageId: 'grey_pb',
    itemSlug: 'grey-ixi-token',
    releasedAt: '2026-08-19T00:00:00.000Z',
    inStudio: true,
    ncValue: lebronValue(6, 8, '2026-08-19T00:00:00.000Z'),
  }),
  styleToken({
    id: 3,
    name: 'Pastel Kacheek Token',
    series: 'Pastel',
    speciesName: 'Kacheek',
    colorName: 'Pink',
    imageId: 'msp_pb',
    itemSlug: 'pastel-kacheek-token',
    releasedAt: '2026-08-18T00:00:00.000Z',
    inStudio: false,
    ncValue: lebronValue(4, 6, '2026-08-18T00:00:00.000Z'),
  }),
  styleToken({
    id: 4,
    name: 'Faerie Usul Token',
    series: 'Faerie',
    speciesName: 'Usul',
    colorName: 'Faerie',
    imageId: 'faerie_pb',
    itemSlug: 'faerie-usul-token',
    releasedAt: '2026-08-16T00:00:00.000Z',
    inStudio: true,
    isPrismatic: true,
    ncValue: lebronValue(12, 16, '2026-08-16T00:00:00.000Z'),
  }),
  styleToken({
    id: 5,
    name: 'Stealthy Blumaroo Token',
    series: 'Stealthy',
    speciesName: 'Blumaroo',
    colorName: 'Stealthy',
    imageId: 'stealthy_pb',
    itemSlug: 'stealthy-blumaroo-token',
    releasedAt: '2026-08-14T00:00:00.000Z',
    inStudio: false,
    ncValue: lebronValue(7, 9, '2026-08-14T00:00:00.000Z'),
  }),
  styleToken({
    id: 6,
    name: 'Eventide Aisha Token',
    series: 'Eventide',
    speciesName: 'Aisha',
    colorName: 'Eventide',
    imageId: 'eventide_pb',
    itemSlug: 'eventide-aisha-token',
    releasedAt: '2026-08-12T00:00:00.000Z',
    inStudio: true,
    ncValue: lebronValue(5, 7, '2026-08-12T00:00:00.000Z'),
  }),
];

export const studioAvailableNow = recentPetStyles.filter((token) => token.inStudio);

export const recentStyleCombos: RainbowPoolComboTile[] = [
  {
    speciesId: 1,
    colorId: 2,
    speciesName: 'Acara',
    colorName: 'Blue',
    previewUrl: 'https://cdn.itemdb.com.br/colors/acara_blue.png',
    href: '/rainbow-pool/pet-styles/acara/blue',
    addedAt: new Date('2026-08-20T12:00:00.000Z'),
  },
  {
    speciesId: 9,
    colorId: 14,
    speciesName: 'Ixi',
    colorName: 'Grey',
    previewUrl: 'https://cdn.itemdb.com.br/colors/ixi_grey.png',
    href: '/rainbow-pool/pet-styles/ixi/grey',
    addedAt: new Date('2026-08-19T12:00:00.000Z'),
  },
  {
    speciesId: 12,
    colorId: 21,
    speciesName: 'Kacheek',
    colorName: 'Pink',
    previewUrl: 'https://cdn.itemdb.com.br/colors/kacheek_pink.png',
    href: '/rainbow-pool/pet-styles/kacheek/pink',
    addedAt: new Date('2026-08-18T12:00:00.000Z'),
  },
  {
    speciesId: 5,
    colorId: 8,
    speciesName: 'Aisha',
    colorName: 'Eventide',
    previewUrl: 'https://cdn.itemdb.com.br/colors/aisha_eventide.png',
    href: '/rainbow-pool/pet-styles/aisha/eventide',
    addedAt: new Date('2026-08-16T12:00:00.000Z'),
  },
];

export const recentNcTrades: NcMallMockTrade[] = [
  {
    id: 1,
    offered: [popularNcItems[0]],
    received: [popularNcItems[1], onSaleMallItems[3]],
    reportedAt: '2026-08-21T14:20:00.000Z',
    notes: 'Wings for background + sash',
  },
  {
    id: 2,
    offered: [mallCapsules[0], newMallItems[2]],
    received: [popularNcItems[4]],
    reportedAt: '2026-08-21T11:05:00.000Z',
    notes: 'Capsule bundle for token',
  },
  {
    id: 3,
    offered: [leavingMallItems[2]],
    received: [newMallItems[1], onSaleMallItems[1]],
    reportedAt: '2026-08-20T22:40:00.000Z',
    notes: 'Leaving item dumped before it rotates out',
  },
];

/** Featured “of the month” highlights for Mall Hub monthly-section concepts. */
export type MonthlyHighlightEntry = {
  item: ItemV2For<'card'>;
  /** When the item joined its official list (collectibles) or list series start (dyeworks). */
  highlightedAt: string;
  listSlug: string;
  listLabel: string;
  kicker: string;
};

export const monthlyNcCollectible: MonthlyHighlightEntry = {
  item: card({
    id: 901,
    name: 'Bottled Faerie Collectors Trinket',
    slug: 'bottled-faerie-collectors-trinket',
    imageId: 'faerie_pb',
    description: 'August’s NC Collectible — a bottled faerie for collectors.',
    colorHex: '#C084FC',
    category: 'Trinkets',
    price: mallPrice({ price: 250, saleBegin: '2026-08-05T00:00:00.000Z' }),
  }),
  highlightedAt: '2026-08-05T12:00:00.000Z',
  listSlug: 'nc-collectible',
  listLabel: 'NC Collectible',
  kicker: 'Collectible of the month',
};

export const monthlyPremiumCollectible: MonthlyHighlightEntry = {
  item: card({
    id: 902,
    name: 'Premium Collectible: Summer Magical Girl Transformation Filter',
    slug: 'premium-collectible-summer-magical-girl-transformation-filter',
    imageId: 'msp_pb',
    description: 'August’s Premium Collectible — summer magical girl filter.',
    colorHex: '#F472B6',
    category: 'Special',
    price: mallPrice({ price: 0, saleBegin: '2026-08-15T00:00:00.000Z' }),
  }),
  highlightedAt: '2026-08-15T12:00:00.000Z',
  listSlug: 'premium-collectible',
  listLabel: 'Premium Collectible',
  kicker: 'Premium of the month',
};

export const monthlyDyeworks: MonthlyHighlightEntry = {
  item: card({
    id: 903,
    name: 'Royal Boy Aisha Wig - Eventide',
    slug: 'royal-boy-aisha-wig-eventide',
    imageId: 'grey_pb',
    description: 'Current Dyeworks color variant — wearable dye rotation.',
    colorHex: '#67E8F9',
    flags: ['wearable'],
    category: 'Clothes',
    price: mallPrice({ price: 200, saleBegin: '2026-08-20T00:00:00.000Z' }),
  }),
  highlightedAt: '2026-08-20T18:00:00.000Z',
  listSlug: 'dyeworks',
  listLabel: 'Current Dyeworks',
  kicker: 'Dyeworks update',
};

export const monthlyHighlightsFixtures = {
  ncCollectible: monthlyNcCollectible,
  premiumCollectible: monthlyPremiumCollectible,
  dyeworks: monthlyDyeworks,
} as const;

export const ncMallHubFixtures = {
  newMallItems,
  onSaleMallItems,
  leavingMallItems,
  freeMallItems,
  mallCapsules,
  popularNcItems,
  lebronUpdates,
  activeNcEvents,
  recentPetStyles,
  studioAvailableNow,
  recentStyleCombos,
  recentNcTrades,
  monthlyHighlights: monthlyHighlightsFixtures,
  quickLinks: NC_MALL_HUB_QUICK_LINKS,
  theme: NC_MALL_HUB_THEME,
};
