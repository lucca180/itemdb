import { describe, expect, test } from 'vitest';
import {
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

  test('mixed lots without a list abstain', () => {
    const mixed = [
      { item_iid: 1, amount: 1 },
      { item_iid: 2, amount: 1 },
    ];
    expect(prices('50m', mixed)).toBe('abstain: mixed lot');
    expect(prices('5 cool neggs', mixed)).toEqual([null, null]);
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
