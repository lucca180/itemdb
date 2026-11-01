import { describe, expect, test } from 'vitest';
import {
  getConfirmedBlank,
  getWishlistNameCandidates,
  getWishlistPrices,
  wishlistPricesMatch,
  type WishlistLotItem,
} from '@utils/trades/wishlistPrice';

const M = 1e6;
const one: WishlistLotItem[] = [{ item_iid: 1, amount: 1 }];
const noNames = new Set<string>();

const prices = (
  wishlist: string,
  items: WishlistLotItem[] = one,
  knownItemNames = noNames,
  instantBuy: number | null = null
) => {
  const result = getWishlistPrices(wishlist, items, instantBuy, knownItemNames);
  return 'prices' in result ? result.prices : `abstain: ${result.abstain}`;
};

describe('getWishlistPrices', () => {
  test.each([
    ['37.99m pure obo', 37.99 * M],
    ['145,500,000np', 145.5 * M],
    ['39,000,000 nps', 39 * M],
    ['6,5m NP', 6.5 * M],
    ['1,8 mil np or cool items :)', 1.8 * M],
    ['1m800k', 1.8 * M],
    ['60~ish mil in pure, nm to auction', 60 * M],
    ['best offer over 2 mil', 2 * M], // pt-19
  ])('explicit value: %s', (wishlist, expected) => {
    expect(prices(wishlist)).toEqual([expected]);
  });

  test.each([
    ['auto accept 25-30 mil, timezone gmt+8', 25 * M],
    ['100-120m', 100 * M],
  ])('ranges take the lowest value: %s', (wishlist, expected) => {
    expect(prices(wishlist)).toEqual([expected]);
  });

  test.each([
    '5 cool neggs',
    '100 obo',
    '13-14',
    'NM me for offers',
    'need pure, mail me for 5 each',
    'for boasurfer3008',
    'Pure or stamps I need: items.jellyneo.net/mywishes/hermionie278/432422/',
    'KKAT17452 I GOT THIS AT THE GIVING TREE',
  ])('no np value -> blank: %s', (wishlist) => {
    expect(prices(wishlist)).toEqual([null]);
  });

  test.each([
    '20m + 2 cool neggs',
    '20m pure + 2 cool neggs',
    '20m + 1 cnegg',
    '10m + 20 Nerkmids',
    '20m + something cool = Auto',
    'Chia Clown Collectible Charm + 20m',
  ])('np + item without value -> blank (pt-9): %s', (wishlist) => {
    expect(prices(wishlist)).toEqual([null]);
  });

  test('item names come from knownItemNames', () => {
    expect(prices('10m + Hungry Fungus')).toEqual([10 * M]);
    expect(prices('10m + Hungry Fungus', one, new Set(['hungry fungus']))).toEqual([null]);
  });

  test.each([
    ['42M or 9 Cool Neggs', 42 * M],
    ['38M Will take 20M + 3 cool neggs', 38 * M],
    ['34 mil pure; 30 mil + 1 Cool Negg; 30 mil + 5 mil in items; OBO', 34 * M],
    ["20 mil + cool negg please! NM if you'd prefer to pay 25 mil via auction! (:", 25 * M],
  ])('np alternative to an item payment: %s', (wishlist, expected) => {
    expect(prices(wishlist)).toEqual([expected]);
  });

  test.each([
    ['[38m] - 20m + 3x Cool Neggs', 38 * M],
    ['80m in pure and cool negg', 80 * M],
    ['25 million NP (20 million + 1 cool negg)', 25 * M],
    ['30 Mil! Mix of NP and Items!', 30 * M],
    ['13m. 2 cool neggs and pure', 13 * M],
  ])('explicit total of a mixed payment: %s', (wishlist, expected) => {
    expect(prices(wishlist)).toEqual([expected]);
  });

  test.each([
    ['20 mil + invis pb (3mil from hidden tower)', 23 * M],
    ['20 mil + 40 mil ets. No nms, plz.', 60 * M],
    ['10 mil pure + a pb worth 1 mil', 11 * M],
    ['20m pure and 1m in items is auto online now', 21 * M],
  ])('declared item value is summed: %s', (wishlist, expected) => {
    expect(prices(wishlist)).toEqual([expected]);
  });

  test.each([
    ['Lowest on TP by 500k', [null]],
    ['5% below trading post', [null]],
    ['700k lower than lowest!! Online 24-7', [null]],
    ['22M (8 MILLION LOWER THAN LOWEST!!)', [22 * M]],
  ])('relative prices: %s', (wishlist, expected) => {
    expect(prices(wishlist)).toEqual(expected);
  });

  test('symbolic prices are blank (pt-11)', () => {
    expect(prices('baby pb for 1np merry christmas')).toEqual([null]);
  });

  test.each([
    ["250mil = auto, also looking for certain gourmet foods that's under 20mil", 'multiple values'],
    ['20m & 10 cool neggs ( 80 m )', 'multiple values'],
    [
      'NM serious offers only, I am very reasonable and do not think this is worth 150m.',
      'negation',
    ],
  ])('abstains when ambiguous: %s', (wishlist, reason) => {
    expect(prices(wishlist)).toBe(`abstain: ${reason}`);
  });

  test('abstains on Instant Buy lots', () => {
    expect(prices('10m', one, noNames, 10 * M)).toBe('abstain: instant buy');
  });

  test('identical items share the total unless priced per unit (pt-17)', () => {
    expect(prices('200m firm', [{ item_iid: 1, amount: 4 }])).toEqual([50 * M]);
    expect(prices("Timbre X 10 millions chaqu'un", [{ item_iid: 1, amount: 5 }])).toEqual([10 * M]);
    const two = [
      { item_iid: 1, amount: 1 },
      { item_iid: 1, amount: 1 },
    ];
    expect(prices('80M each', two)).toEqual([80 * M, 80 * M]);
  });

  test.each([
    ['200m per lot', 50 * M],
    ['200m per trade', 50 * M],
    ['200m for all 4', 50 * M],
    ['50m per stamp', 50 * M],
    ['50m/each', 50 * M],
  ])('quantity > 1: %s', (wishlist, expected) => {
    expect(prices(wishlist, [{ item_iid: 1, amount: 4 }])).toEqual([expected]);
  });

  test.each([
    ['50m each or 50m', 'unit or total'],
    // "each" of the negg alternative may cover the np value too
    ['200m or 1 cool negg each', 'unit or total'],
    ['28m or 7 Cool Negg each, or Alien Attack Pea + 10 Cool Negg for all', 'unit or total'],
    ['50m ea or 180m for all', 'multiple values'],
    ['200m total (50m ea)', 'multiple values'],
  ])('quantity > 1, unit or total unclear -> abstains: %s', (wishlist, reason) => {
    expect(prices(wishlist, [{ item_iid: 1, amount: 4 }])).toBe(`abstain: ${reason}`);
  });

  test('a single unit is the same price either way', () => {
    expect(prices('50m each or 50m')).toEqual([50 * M]);
  });

  test('list slots divide by their amount unless priced per unit', () => {
    const lot = [
      { item_iid: 1, amount: 2 },
      { item_iid: 2, amount: 3 },
    ];
    expect(prices('10m | 9m each', lot)).toEqual([5 * M, 9 * M]);
  });

  test('lists map by slot or by item name (pt-14)', () => {
    const four = [1, 2, 3, 4].map((item_iid) => ({ item_iid, amount: 1 }));
    expect(prices('10m | 5m | nm | 10m', four)).toEqual([10 * M, 5 * M, null, 10 * M]);

    const named = [
      { item_iid: 1, name: 'Spotted Blue Collectable Scarab' },
      { item_iid: 2, name: 'Golden Dubloon Stamp' },
      { item_iid: 3, name: 'Usuki Doll Stamp' },
    ];
    expect(
      prices(
        'Autos: Usuki Doll Stamp 50m | Golden Dubloon Stamp 100m | Spotted Blue Collectable Scarab 50m. Can always beat TP price',
        named
      )
    ).toEqual([50 * M, 100 * M, 50 * M]);
  });

  test('a mixed lot total is not split between items (pt-6)', () => {
    const mixed = [
      { item_iid: 1, amount: 1 },
      { item_iid: 2, amount: 1 },
      { item_iid: 3, amount: 2 },
    ];
    expect(prices('50m', mixed)).toEqual([null, null, null]);
    expect(prices('Otb 675m for all', mixed)).toEqual([null, null, null]);
    expect(prices('5 cool neggs', mixed)).toEqual([null, null, null]);
    // as many values as items: may be a price per item (pt-16)
    expect(prices('Maraquan 1,800,000, Island 2,500,000, Red 2,000,000', mixed)).toBe(
      'abstain: multiple values'
    );
    expect(prices('10m pure or 10m in neggs or 10m in items', mixed)).toBe('abstain: mixed lot');
    expect(prices('2b each', mixed)).toBe('abstain: mixed lot');
    const named = [
      { item_iid: 1, amount: 1, name: 'Kacheek Plushie' },
      { item_iid: 2, amount: 1, name: 'Rubber Duck' },
    ];
    // pt-5: the wishlist points at one of the items
    expect(prices('NM offers, Kacheek 100M is Auto', named)).toBe('abstain: mixed lot');
    // naming every item is still the lot total
    expect(prices('Kacheek and Duck bundle 10m', named)).toEqual([null, null]);
  });

  test('Instant Buy on a mixed lot is a total too', () => {
    const mixed = [
      { item_iid: 1, amount: 1 },
      { item_iid: 2, amount: 1 },
      { item_iid: 3, amount: 1 },
    ];
    expect(prices('[MIX OF EVIL COCONUTS - 20M]', mixed, noNames, 20 * M)).toEqual([
      null,
      null,
      null,
    ]);
    expect(prices('Offer 1 np or a junk item please!', mixed, noNames, 5 * M)).toEqual([
      null,
      null,
      null,
    ]);
    expect(prices('10m | 5m | nm', mixed, noNames, 15 * M)).toBe('abstain: mixed lot');
    expect(prices('Pink 3,700,000, Red 2m and Fire 1.5m', mixed, noNames, 7 * M)).toBe(
      'abstain: mixed lot'
    );
  });
});

describe('getConfirmedBlank', () => {
  const confirmed = (
    wishlist: string,
    items: WishlistLotItem[] = one,
    instantBuy: number | null = null
  ) => getConfirmedBlank(wishlist, items, instantBuy, noNames);
  const mixed = [1, 2, 3].map((item_iid) => ({ item_iid, amount: 1 }));

  test.each([
    ['5 cool neggs', 'no np value'], // pt-10
    ['NM me for offers, 2 full maps!', 'no np value'],
    ['20m + 2 cool neggs', 'item payment without np value'], // pt-9
    ['20 mil and a cool negg. Online Daily!', 'item payment without np value'],
    ['baby pb for 1np merry christmas', 'symbolic'],
    ['700k lower than lowest', 'relative price'],
  ])('confirms: %s', (wishlist, reason) => {
    expect(confirmed(wishlist)).toBe(reason);
  });

  test('confirms mixed lot totals, with or without Instant Buy (pt-6)', () => {
    expect(
      confirmed('1m online now please buy im tired of this the tp is upsetting me', mixed)
    ).toBe('mixed lot total');
    expect(confirmed('[MIX OF EVIL COCONUTS - 20M]', mixed, 20 * M)).toBe('instant buy mixed lot');
    expect(confirmed('5 cool neggs', mixed)).toBe('no np value');
  });

  test.each([
    '17.5 please', // bare value, usually millions
    '39.5 pure',
    "I'd prefer 12, but I'll take 10.",
    '120Mi pure or combo',
    'oh looky a deal......7.5 mil and its yours',
    'Quicksale13m',
    'See my auctions. 40+M',
    'Free to good home (1 bill rehoming fee)',
  ])('leaves numbers it cannot read to the queue: %s', (wishlist) => {
    expect(confirmed(wishlist)).toBeNull();
  });

  test.each([
    "12.5M in NP's and items if needed", // a mixed payment total
    '10 mil. I like nps and stamps/coins/charms',
    '70mil? open to haggle and trade for album items',
    '50m - 20m NP + 6 Cool Neggs', // a total and its breakdown
    '140M - 20M pure + Cool Neggs or fully pure',
    '250m obo. Saving for golden shell',
    '17m please, 6.5+x2 cool negg or equiv',
    // the items are an ad in another sentence
    '10m pure! check my gallery for UBs and other album items, MPs, Books, and other fun and collectable stuff!!',
  ])('leaves item payments that may not be an addition to the queue: %s', (wishlist) => {
    expect(confirmed(wishlist)).toBeNull();
  });

  test('leaves symbolic decimals and relative prices with a value to the queue', () => {
    expect(confirmed('16.5 NP!!! Online all day')).toBeNull();
    expect(confirmed('willing to do 120mil - 7mil below current tp price')).toBeNull();
  });

  test('leaves mixed lots that may price one item to the queue (pt-5)', () => {
    expect(confirmed('9 mil for the Blumaroo Slingshot and the codestone free', mixed)).toBeNull();
    expect(confirmed('8.5M, TCG card included as a bonus', mixed, 8.5 * M)).toBeNull();
    const two = mixed.slice(0, 2);
    expect(confirmed('14M', two)).toBeNull();
  });

  test('never confirms a lot that gets a price or abstains', () => {
    expect(confirmed('20m')).toBeNull();
    expect(confirmed('10m', one, 10 * M)).toBeNull(); // instant buy
    expect(confirmed('10m | nm | nm', mixed)).toBeNull(); // list by slot
  });
});

describe('getWishlistNameCandidates', () => {
  test('returns word sequences that could be item names', () => {
    const candidates = getWishlistNameCandidates('20m + Hungry Fungus!');
    expect(candidates).toContain('hungry fungus');
    expect(candidates).toContain('hungry');
    expect(candidates).not.toContain('20m');
  });
});

describe('wishlistPricesMatch', () => {
  test('tolerates 1 NP of rounding and requires blanks to match', () => {
    expect(wishlistPricesMatch([5_833_333], [5_833_334])).toBe(true);
    expect(wishlistPricesMatch([null, 10], [null, 10])).toBe(true);
    expect(wishlistPricesMatch([20 * M], [null])).toBe(false);
    expect(wishlistPricesMatch([7.5 * M], [75 * M])).toBe(false);
  });
});
