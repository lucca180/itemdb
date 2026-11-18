import { ReviewItem } from './mockData';

/**
 * Data for the "General" chapter of the Review: Neopia and itemdb in the year, the same for everyone.
 * The 2026 values below are real, from read-only queries run on Nov 13-18, 2026, with data up to
 * Nov 13 (see docs/restock-review-2026.md). The batch script runs from Dec 7 and recomputes them
 * with the data that arrived up to the final cutoff, Dec 6.
 */

export type InflationCategory = 'books' | 'booktastic' | 'gourmet' | 'stamps' | 'questlog';

export type RankedItem = { item: ReviewItem; value: number; count?: number };

export type QuizId = 'viewed' | 'opened' | 'auction' | 'books' | 'rise' | 'drop';

/** One answer. Items show their image; `value`, `count`, `start` and `end` feed the reveal. */
export type QuizOption = {
  item?: ReviewItem;
  value?: number;
  count?: number;
  start?: number;
  end?: number;
};

export type Quiz = {
  id: QuizId;
  /** The first option is always the right answer. */
  options: QuizOption[];
  /** Display order (indexes into `options`), so the answer isn't always first. */
  order: number[];
};

export type GeneralReviewData = {
  year: number;
  /** ISO date the numbers go up to. */
  dataUntil: string;
  /** ISO date of the last day of data the final Review uses (the batch runs the day after). */
  finalCutoff: string;
  /** ISO date Umami starts recording page views. */
  viewsSince: string;
  totals: {
    priceUpdates: number;
    auctionsSeen: number;
    trades: number;
    searches: number;
    openings: number;
    listItems: number;
    lists: number;
    newAccounts: number;
  };
  mostViewed: RankedItem[];
  openables: RankedItem[];
  ncTraded: RankedItem[];
  /** Items in the most lists of different people (no imported items, no dynamic lists). */
  mostWanted: RankedItem[];
  /** Sold auctions: with a buyer, closed or under 30 minutes left. `value` is NP, `count` auctions. */
  auctions: {
    sold: number;
    np: number;
    items: number;
    top: RankedItem[];
    /** Auctions that hit 2,147,483,647 NP, the highest value possible, and their distinct items. */
    cappedCount: number;
    capped: ReviewItem[];
  };
  /** Median price change (%) of the official checklist items worth at least 1,000 NP. */
  inflation: { category: InflationCategory; typical: number; expensive: number }[];
  /** "All Collectibles" list: every page of the album. */
  stampAlbum: {
    items: number;
    /** Items with a price both on Jan 1st and now; start and end sum only these. */
    priced: number;
    unpriced: number;
    unpricedExample: ReviewItem;
    unpricedExampleAuction: number;
    start: number;
    end: number;
  };
  questLog: {
    /** Median price change of an item from the month before its pool to the last 3 weeks of it. */
    medianChange: number;
    entries: number;
    pools: number;
    /** Entries that didn't lose value. */
    notDropped: number;
    examples: { item: ReviewItem; start: number; end: number }[];
  };
  bookRush: {
    /** Day of the Neopets update that gave more prizes for reading. */
    updateDate: string;
    books: number;
    examples: { item: ReviewItem; start: number; end: number }[];
  };
  quizzes: Record<QuizId, Quiz>;
};

const img = (file: string) => `https://images.neopets.com/items/${file}`;

const item = (name: string, file: string): ReviewItem => ({ name, image: img(file), price: 0 });

const ITEMS = {
  hungryFungus: item('Hungry Fungus', 'spookyfoo_hungryfungus.gif'),
  donna: item('ARGH!!!! DONNA STAMP', 'stamp_hal_scary.gif'),
  coolNegg: item('Cool Negg', 'food_coolnegg.gif'),
  drakarasWand: item('Drakaras Wand', '4fd30e1604fb56.gif'),
  corruptedStaff: item('Corrupted Staff of the Void', 'bd_staff_void_corrupt.gif'),
  donationCapsule: item('Faerie Donation Capsule', 'np_mc_ffdonation.gif'),
  kougraGbmc: item('26th Anniversary Kougra Black Friday GBMC', '1ic83mm2ih.gif'),
  sleepoverCapsule: item('NC Mall 19th Sleepover Birthday Mystery Capsule', '21c2bc16c87cca.gif'),
  doctorsBag: item('Doctors Bag', 'med_doctorsbag.gif'),
  retiredGbmc: item('Retired GBMC 2026 Mystery Capsule', 'ac682ef617c39b.gif'),
  stylingSupplies: item('Styling Studio Supplies', 'mall_ss_supplies.gif'),
  prismaticBrush: item('Styling Studio Prismatic Brush', 'h2bb8ihj4c.gif'),
  hueBrew: item('Dyeworks Hue Brew Potion', 'mall_80x80_cleaning.gif'),
  deluxeSupplies: item('Deluxe Styling Studio Supplies', 'mall_ss_deluxesupplies.gif'),
  coltzan: item('Coltzan Stamp', 'stamp_desert_coltzan.gif'),
  midnightJelly: item('Midnight Jelly World Stamp', 'stamp_jelly_night.gif'),
  fyora: item('Queen Fyora Stamp', 'sta_queen_fyora.gif'),
  garoo: item('Commander Garoo Stamp', 'stamp_space_garoo.gif'),
  muffinBook: item('Muffin Baking Book', 'boo_muffin_making.gif'),
  baconGuide: item('Bacon Guide to Bacon', 'boo_bacon_bacon_guide.gif'),
  bruceDarblat: item('The Bruce and The Darblat', 'boo_bruce_darblat.gif'),
  dayNightScarab: item('Day and Night Collectable Scarab', 'coi_gmc2013_daynightscar.gif'),
  wiseGnorbu: item('Wise Gnorbu Stamp', 'sta_shen_wisegnorbu.gif'),
  toothygrin: item('Toothygrin', 'd814ck47e8.gif'),
  bankManager: item('Bank Manager Stamp', 'stamp_mono.gif'),
  darkestFaerie: item('The Darkest Faerie Stamp', 'stamp_386.gif'),
  jorett: item('Jorett Stamp', '5k309e7a39.gif'),
  igneot: item('Igneot Stamp', 'sta_igneot.gif'),
  faerieSlingshot: item('Faerie Slingshot', 'bd_faerieacornslingshot.gif'),
  seasonalPea: item('Seasonal Attack Pea', 'seasonal_pea.gif'),
  coffeeMarshmallows: item('Coffee and Marshmallows', 'coffeandmarsh.gif'),
  darkFaerieBottle: item('Fading Bottled Dark Faerie', 'bottlefaerie_dark.gif'),
  kikoStamp: item('Mystery Island Kiko Stamp', 'stamp_island_kiko.gif'),
  darkFaerieEraser: item('Eraser of the Dark Faerie', 'artifact_darkfaerie_eraser.gif'),
  superPea: item('Super Attack Pea', 'bd_superpea.gif'),
  fashionista: item('Fashionista Stamp', 'stamp_neo_shoes.gif'),
  zafaraAgent: item('Zafara Double Agent', 'goldtradingcardback.gif'),
  fyoraBoxes: item('Small Fyora Spring Gift Boxes', 'gif_fyora_smallboxes.gif'),
  toothbrushSword: item('Toothbrush Sword', 'bd_toothbrush_sword.gif'),
};

export const GENERAL_REVIEW: GeneralReviewData = {
  year: 2026,
  dataUntil: '2026-11-13',
  finalCutoff: '2026-12-06',
  viewsSince: '2026-03-09',
  totals: {
    priceUpdates: 1097824,
    auctionsSeen: 984168,
    trades: 1693282,
    searches: 1339883,
    openings: 205011,
    listItems: 4907089,
    lists: 10436,
    newAccounts: 2680,
  },
  mostViewed: [
    { item: ITEMS.hungryFungus, value: 6865 },
    { item: ITEMS.donna, value: 5748 },
    { item: ITEMS.coolNegg, value: 5043 },
    { item: ITEMS.drakarasWand, value: 4163 },
    { item: ITEMS.corruptedStaff, value: 3548 },
  ],
  openables: [
    { item: ITEMS.donationCapsule, value: 10622 },
    { item: ITEMS.kougraGbmc, value: 5420 },
    { item: ITEMS.sleepoverCapsule, value: 4192 },
    { item: ITEMS.doctorsBag, value: 3850 },
    { item: ITEMS.retiredGbmc, value: 3826 },
  ],
  ncTraded: [
    { item: ITEMS.kougraGbmc, value: 382 },
    { item: ITEMS.stylingSupplies, value: 297 },
    { item: ITEMS.prismaticBrush, value: 204 },
    { item: ITEMS.hueBrew, value: 146 },
    { item: ITEMS.deluxeSupplies, value: 128 },
  ],
  mostWanted: [
    { item: ITEMS.donna, value: 59 },
    { item: ITEMS.coltzan, value: 57 },
    { item: ITEMS.midnightJelly, value: 57 },
    { item: ITEMS.fyora, value: 57 },
    { item: ITEMS.garoo, value: 56 },
  ],
  auctions: {
    sold: 291466,
    np: 9122960967490,
    items: 19967,
    top: [
      { item: ITEMS.seasonalPea, value: 218606050814, count: 3580 },
      { item: ITEMS.coffeeMarshmallows, value: 188343370895, count: 1646 },
      { item: ITEMS.coolNegg, value: 173807964942, count: 29903 },
    ],
    cappedCount: 6,
    capped: [
      ITEMS.kikoStamp,
      ITEMS.darkFaerieEraser,
      ITEMS.superPea,
      ITEMS.fashionista,
      ITEMS.garoo,
    ],
  },
  // Dec/2025-Jan/2026 median price vs Sep-Nov/2026 median price, before the November book rush
  inflation: [
    { category: 'books', typical: 3.8, expensive: -2.5 },
    { category: 'booktastic', typical: -15.6, expensive: -30.6 },
    { category: 'gourmet', typical: -13.1, expensive: -38 },
    { category: 'stamps', typical: -17.4, expensive: -34 },
    { category: 'questlog', typical: -33.8, expensive: -71.7 },
  ],
  stampAlbum: {
    items: 984,
    priced: 903,
    unpriced: 7,
    unpricedExample: ITEMS.fashionista,
    unpricedExampleAuction: 2147483647,
    start: 51378091888,
    end: 28030842677,
  },
  questLog: {
    medianChange: -98.6,
    entries: 687,
    pools: 5,
    notDropped: 4,
    examples: [
      { item: ITEMS.zafaraAgent, start: 62600000, end: 410000 },
      { item: ITEMS.toothbrushSword, start: 14000000, end: 120000 },
      { item: ITEMS.fyoraBoxes, start: 12000000, end: 60250 },
    ],
  },
  bookRush: {
    updateDate: '2026-11-02',
    books: 900,
    examples: [
      { item: ITEMS.muffinBook, start: 3700, end: 650000 },
      { item: ITEMS.baconGuide, start: 15100, end: 790000 },
      { item: ITEMS.bruceDarblat, start: 12000, end: 520000 },
    ],
  },
  quizzes: {
    viewed: {
      id: 'viewed',
      options: [
        { item: ITEMS.hungryFungus, value: 6865 },
        { item: ITEMS.donna, value: 5748 },
        { item: ITEMS.coolNegg, value: 5043 },
        { item: ITEMS.drakarasWand, value: 4163 },
      ],
      order: [2, 1, 0, 3],
    },
    opened: {
      id: 'opened',
      options: [
        { item: ITEMS.donationCapsule, value: 10622 },
        { item: ITEMS.kougraGbmc, value: 5420 },
        { item: ITEMS.sleepoverCapsule, value: 4192 },
        { item: ITEMS.doctorsBag, value: 3850 },
      ],
      order: [1, 3, 2, 0],
    },
    auction: {
      id: 'auction',
      options: [
        { item: ITEMS.seasonalPea, value: 218606050814, count: 3580 },
        { item: ITEMS.coffeeMarshmallows, value: 188343370895, count: 1646 },
        { item: ITEMS.coolNegg, value: 173807964942, count: 29903 },
        { item: ITEMS.donna, value: 169150375223, count: 1034 },
      ],
      order: [2, 0, 3, 1],
    },
    books: {
      id: 'books',
      options: [{ value: 650000 }, { value: 6900 }, { value: 65000 }, { value: 6500000 }],
      order: [1, 2, 0, 3],
    },
    // conservative values: highest of the first 3 prices of the year vs lowest of the last 3 (and
    // the other way around for drops), with at least 5 price updates in 2026
    rise: {
      id: 'rise',
      options: [
        { item: ITEMS.dayNightScarab, start: 20600000, end: 135000000 },
        { item: ITEMS.bankManager, start: 294000000, end: 335000000 },
        { item: ITEMS.wiseGnorbu, start: 41800000, end: 81000000 },
        { item: ITEMS.toothygrin, start: 48400000, end: 84000000 },
      ],
      order: [2, 0, 3, 1],
    },
    drop: {
      id: 'drop',
      options: [
        { item: ITEMS.darkestFaerie, start: 600000000, end: 3350000 },
        { item: ITEMS.igneot, start: 140000000, end: 26000000 },
        { item: ITEMS.jorett, start: 133000000, end: 22000000 },
        { item: ITEMS.faerieSlingshot, start: 373000000, end: 285000000 },
      ],
      order: [1, 3, 0, 2],
    },
  },
};

/** Book quiz: the price the Muffin Baking Book had before the rush. */
export const BOOK_QUIZ_START = 3700;

export const QUIZ_ORDER: QuizId[] = ['viewed', 'opened', 'auction', 'books', 'rise', 'drop'];

export type ResultTier = 'oracle' | 'tycoon' | 'explorer' | 'newcomer';

export const getResultTier = (score: number, total: number): ResultTier => {
  if (score === total) return 'oracle';
  if (score >= total - 2) return 'tycoon';
  if (score >= 2) return 'explorer';
  return 'newcomer';
};
