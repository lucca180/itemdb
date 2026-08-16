import { describe, expect, it } from 'vitest';
import type { ItemData, ItemMallData, NCValue } from '@types';
import {
  buildItemMetaDescription,
  fitFlavor,
  ITEM_META_DESCRIPTION_MAX,
  ITEM_OG_DESCRIPTION_MAX,
  truncateItemOgDescription,
} from '@app/_components/Item/seo/buildItemMetaDescription';

const CHEAP_PRICE = 4_321;
const AUCTION_PRICE = 8_000_000;
const SUPER_PRICE = 150_000_000;

const item = (overrides: Partial<ItemData> = {}): ItemData =>
  ({
    internal_id: 1,
    item_id: 1,
    name: 'Test Item',
    description: 'A reasonably long official item description from TNT.',
    image: 'https://example.com/i.gif',
    image_id: 'abc',
    category: 'Food',
    rarity: 70,
    weight: 1,
    type: 'np',
    isNC: false,
    isWearable: false,
    isNeohome: false,
    isBD: false,
    estVal: 1,
    status: 'active',
    color: {
      lab: [0, 0, 0],
      rgb: [0, 0, 0],
      hsv: [0, 0, 0],
      hex: '#000000',
      type: 'vibrant',
      population: 1,
    },
    findAt: {},
    isMissingInfo: false,
    price: { value: 500, addedAt: '2026-01-01', inflated: false },
    saleStatus: null,
    ncValue: null,
    slug: 'test-item',
    comment: null,
    canonical_id: null,
    useTypes: { canEat: 'false', canRead: 'false', canOpen: 'false', canPlay: 'false' },
    firstSeen: null,
    mallData: null,
    cacheHash: null,
    ...overrides,
  }) as ItemData;

const mallData = (price = 250): ItemMallData => ({
  price,
  saleBegin: '2026-01-01',
  saleEnd: null,
  discountBegin: null,
  discountEnd: null,
  discountPrice: null,
});

const ncValue = (source: NCValue['source'] = 'lebron'): NCValue => ({
  minValue: 1,
  maxValue: 2,
  range: '1-2',
  addedAt: '2026-01-01',
  source,
});

function dBlock(meta: string, locale: 'en' | 'pt' = 'en') {
  const marker = locale === 'pt' ? 'Veja ' : 'See ';
  const index = meta.lastIndexOf(marker);
  expect(index).toBeGreaterThanOrEqual(0);
  return meta.slice(index);
}

function expectCommonMeta(meta: string, name: string, priceValue?: number | null) {
  expect(meta).toContain(name);
  expect(meta).not.toContain('...');
  if (name.length < 80) {
    expect(meta.length).toBeLessThanOrEqual(ITEM_META_DESCRIPTION_MAX);
  }
  if (priceValue != null) {
    expect(meta).not.toContain(String(priceValue));
  }
}

function expectSlotOrder(text: string, phrases: string[]) {
  const indexes = phrases.map((phrase) => text.indexOf(phrase));
  expect(indexes.every((index) => index >= 0)).toBe(true);
  for (let i = 1; i < indexes.length; i++) {
    expect(indexes[i]).toBeGreaterThan(indexes[i - 1]);
  }
}

describe('buildItemMetaDescription', () => {
  it('builds Green Apple as prices, trades, restocks without auction', () => {
    const greenApple = item({
      name: 'Green Apple',
      description: 'This is a tasty green apple from Neopia.',
      findAt: { restockShop: 'https://www.neopets.com/objects.phtml?type=shop&obj_type=1' },
      price: { value: CHEAP_PRICE, addedAt: '2026-01-01', inflated: false },
    });

    const meta = buildItemMetaDescription(greenApple, 'en');
    expectCommonMeta(meta, 'Green Apple', CHEAP_PRICE);
    expect(meta).toContain('This is a tasty green apple from Neopia.');
    expect(dBlock(meta)).toBe(
      'See updated prices, auction history, trades and restock info for Green Apple on itemdb.'
    );
    expect(meta).not.toContain('item preview');
  });

  it('keeps Baby Paint Brush first-sentence flavor and Hidden Tower restocks', () => {
    const babyPb = item({
      name: 'Baby Paint Brush',
      description:
        'Turn your Neopet into a cute little baby! This Paint Brush will change the colour of your Neopet.',
      rarity: 200,
      findAt: { restockShop: 'https://www.neopets.com/faerieland/hiddentower938.phtml' },
      price: { value: CHEAP_PRICE, addedAt: '2026-01-01', inflated: false },
    });

    const meta = buildItemMetaDescription(babyPb, 'en');
    expectCommonMeta(meta, 'Baby Paint Brush', CHEAP_PRICE);
    expect(meta.startsWith('Turn your Neopet into a cute little baby!')).toBe(true);
    expect(dBlock(meta)).toBe(
      'See updated prices, auction history, trades and restock info for Baby Paint Brush on itemdb.'
    );
  });

  it('still mentions auction for Super Attack Pea at or above 120M NP', () => {
    const suap = item({
      name: 'Super Attack Pea',
      description: 'Why is it super you ask? Because it is a pea that attacks superly!',
      price: { value: SUPER_PRICE, addedAt: '2026-01-01', inflated: false },
    });

    const meta = buildItemMetaDescription(suap, 'en');
    expectCommonMeta(meta, 'Super Attack Pea', SUPER_PRICE);
    expect(dBlock(meta)).toBe(
      'See updated prices, auction history and trades for Super Attack Pea on itemdb.'
    );
    expect(meta).not.toContain('restock info');
  });

  it('adds preview and restocks for an NP wearable that restocks', () => {
    const wearable = item({
      name: 'Cool Hat',
      isWearable: true,
      findAt: { restockShop: 'https://shop' },
      price: { value: CHEAP_PRICE, addedAt: '2026-01-01', inflated: false },
    });

    const meta = buildItemMetaDescription(wearable, 'en');
    expectCommonMeta(meta, 'Cool Hat', CHEAP_PRICE);
    expectSlotOrder(dBlock(meta), [
      'updated prices',
      'auction history',
      'trades',
      'restock info',
      'item preview',
    ]);
  });

  it('lets auction and trades coexist on NP items in the auction band', () => {
    const auctionItem = item({
      name: 'Fancy Sword',
      isWearable: true,
      price: { value: AUCTION_PRICE, addedAt: '2026-01-01', inflated: false },
    });

    const meta = buildItemMetaDescription(auctionItem, 'en');
    expectCommonMeta(meta, 'Fancy Sword', AUCTION_PRICE);
    expectSlotOrder(dBlock(meta), ['updated prices', 'auction history', 'trades', 'item preview']);
  });

  it('drops preview first when the description would exceed 155 characters', () => {
    const name = 'N'.repeat(80);
    const crowded = item({
      name,
      isWearable: true,
      price: { value: AUCTION_PRICE, addedAt: '2026-01-01', inflated: false },
    });

    const meta = buildItemMetaDescription(crowded, 'en');
    expect(meta).toContain(name);
    expect(meta.length).toBeLessThanOrEqual(ITEM_META_DESCRIPTION_MAX);
    expectSlotOrder(dBlock(meta), ['updated prices', 'auction history', 'trades']);
    expect(meta).not.toContain('item preview');
  });

  it('keeps the item name even when it forces the description over 155 characters', () => {
    const name = 'N'.repeat(200);
    const meta = buildItemMetaDescription(item({ name }), 'en');
    expect(meta).toContain(name);
    expect(meta.length).toBeGreaterThan(ITEM_META_DESCRIPTION_MAX);
  });

  it('adds NC value and NC trades for NC items with a Lebron value', () => {
    const nc = item({
      name: 'Background',
      type: 'nc',
      isNC: true,
      isWearable: true,
      price: { value: null, addedAt: null, inflated: false },
      ncValue: ncValue('lebron'),
    });

    const meta = buildItemMetaDescription(nc, 'en');
    expectCommonMeta(meta, 'Background');
    expectSlotOrder(dBlock(meta), ['Lebron NC value', 'NC trade history', 'item preview']);
    expect(meta).not.toContain('updated prices');
    expect(meta).not.toContain('auction history');
  });

  it('uses NC value without Lebron when the source is itemdb', () => {
    const nc = item({
      name: 'Background',
      type: 'nc',
      isNC: true,
      price: { value: null, addedAt: null, inflated: false },
      ncValue: ncValue('itemdb'),
    });

    const meta = buildItemMetaDescription(nc, 'en');
    expect(dBlock(meta)).toContain('NC value');
    expect(meta).not.toContain('Lebron');
  });

  it('treats an active mall listing as an NC value even without ncValue', () => {
    const nc = item({
      name: 'Mall Background',
      type: 'nc',
      isNC: true,
      price: { value: null, addedAt: null, inflated: false },
      mallData: mallData(250),
    });

    const meta = buildItemMetaDescription(nc, 'en');
    expect(dBlock(meta)).toContain('NC value');
    expect(meta).not.toContain('250');
    expect(meta).not.toContain('Lebron');
  });

  it('mentions NC value for an active NC item even without ncValue or mall data', () => {
    const nc = item({
      name: 'Unvalued Background',
      type: 'nc',
      isNC: true,
      isWearable: true,
      price: { value: null, addedAt: null, inflated: false },
    });

    const meta = buildItemMetaDescription(nc, 'en');
    expect(dBlock(meta)).toBe(
      'See NC value, NC trade history and item preview for Unvalued Background on itemdb.'
    );
  });

  it('omits updated prices when the NP price is the unknown-zero sentinel', () => {
    const unknown = item({
      name: 'Stale Food',
      price: { value: 0, addedAt: '2024-01-01', inflated: false },
    });

    const meta = buildItemMetaDescription(unknown, 'en');
    expect(dBlock(meta)).not.toContain('updated prices');
    expect(dBlock(meta)).toContain('trades');
  });

  it('omits prices, auction and trades for no-trade items but can still mention preview', () => {
    const noTrade = item({
      name: 'Quest Item',
      status: 'no trade',
      isWearable: true,
      price: { value: null, addedAt: null, inflated: false },
    });

    const meta = buildItemMetaDescription(noTrade, 'en');
    expectCommonMeta(meta, 'Quest Item');
    expect(meta).not.toContain('updated prices');
    expect(meta).not.toContain('auction history');
    expect(meta).not.toContain('trades');
    expect(dBlock(meta)).toContain('item preview');
  });

  it('attaches TNT flavor in Portuguese the same way as English', () => {
    const greenApple = item({
      name: 'Green Apple',
      description: 'This is a tasty green apple from Neopia.',
      findAt: { restockShop: 'https://shop' },
    });

    const meta = buildItemMetaDescription(greenApple, 'pt');
    expectCommonMeta(meta, 'Green Apple');
    expect(meta).toContain('This is a tasty green apple from Neopia.');
    expect(dBlock(meta, 'pt')).toBe(
      'Veja preços atualizados, histórico de leilões, trocas e restock info de Green Apple no itemdb.'
    );
    expect(meta).not.toContain('See ');
  });

  it('treats mixed-case No Trade as no-trade for NC slots', () => {
    const nc = item({
      name: 'Quest Background',
      type: 'nc',
      isNC: true,
      // Casing the union does not allow, but the column is a plain string.
      status: 'No Trade' as ItemData['status'],
      price: { value: null, addedAt: null, inflated: false },
      ncValue: ncValue('lebron'),
      mallData: mallData(250),
    });

    const meta = buildItemMetaDescription(nc, 'en');
    expect(meta).not.toContain('NC value');
    expect(meta).not.toContain('Lebron');
    expect(meta).not.toContain('NC trade history');
  });

  it('mentions restocks only when the item restocks', () => {
    const restocks = buildItemMetaDescription(
      item({ name: 'Shop Food', findAt: { restockShop: 'https://shop' } }),
      'en'
    );
    const hiddenTower = buildItemMetaDescription(
      item({
        name: 'HT Item',
        rarity: 200,
        findAt: { restockShop: 'https://www.neopets.com/faerieland/hiddentower938.phtml' },
      }),
      'en'
    );
    const rarityOnly = buildItemMetaDescription(
      item({ name: 'HT Missing Link', rarity: 200 }),
      'en'
    );
    const noRestock = buildItemMetaDescription(item({ name: 'Retired Food' }), 'en');

    expect(dBlock(restocks)).toContain('restock info');
    expect(dBlock(hiddenTower)).toContain('restock info');
    expect(dBlock(rarityOnly)).not.toContain('restock info');
    expect(dBlock(noRestock)).not.toContain('restock info');
  });

  it('mentions item preview only when the item is wearable', () => {
    const wearable = buildItemMetaDescription(item({ name: 'Hat', isWearable: true }), 'en');
    const notWearable = buildItemMetaDescription(item({ name: 'Apple' }), 'en');

    expect(dBlock(wearable)).toContain('item preview');
    expect(dBlock(notWearable)).not.toContain('item preview');
  });

  it('mentions odds and drops only when the drops card is actually shown', () => {
    const capsule = item({
      name: 'Mystery Capsule',
      useTypes: { canEat: 'false', canRead: 'false', canOpen: 'true', canPlay: 'false' },
    });

    const withDrops = buildItemMetaDescription(capsule, 'en', { hasDropsCard: true });
    const openableWithoutDrops = buildItemMetaDescription(capsule, 'en');

    expectSlotOrder(dBlock(withDrops), [
      'updated prices',
      'auction history',
      'trades',
      'odds and drops',
    ]);
    expect(dBlock(openableWithoutDrops)).not.toContain('odds and drops');
  });

  it('omits odds and drops when the item is not openable', () => {
    const meta = buildItemMetaDescription(item({ name: 'Green Apple' }), 'en');
    expect(dBlock(meta)).not.toContain('odds and drops');
  });

  it('closes a cut flavor with an ellipsis so it does not run into D', () => {
    const chatty = item({
      name: 'Chatty Snowball',
      description:
        'Give this to your Neopet so that it can play with all of its friends today and tomorrow.',
      findAt: { restockShop: 'https://shop' },
      price: { value: CHEAP_PRICE, addedAt: '2026-01-01', inflated: false },
    });

    const meta = buildItemMetaDescription(chatty, 'en');
    expect(meta.length).toBeLessThanOrEqual(ITEM_META_DESCRIPTION_MAX);
    expect(meta).toContain('... See ');
    expect(meta).not.toMatch(/[a-z] See /);
  });

  it('adds ellipsis when a cut lands on an abbreviation period', () => {
    const slothHat = item({
      name: 'N'.repeat(55),
      description: 'The favourite hat of Dr. Sloth himself, taken from his secret lair.',
      price: { value: CHEAP_PRICE, addedAt: '2026-01-01', inflated: false },
    });

    const meta = buildItemMetaDescription(slothHat, 'en');
    expect(meta).toContain('...');
    expect(meta).not.toMatch(/Dr\. See /);
    expect(meta.length).toBeLessThanOrEqual(ITEM_META_DESCRIPTION_MAX);
  });

  it('keeps a complete quoted sentence without adding another period', () => {
    const quoted = item({
      name: 'Eat Me',
      description: 'The label reads "eat me!"',
      price: { value: CHEAP_PRICE, addedAt: '2026-01-01', inflated: false },
    });

    const meta = buildItemMetaDescription(quoted, 'en');
    expect(meta).toContain('The label reads "eat me!" See ');
    expect(meta).not.toContain('"eat me!".');
  });

  it('keeps a full description that only fits if ellipsis is not reserved up front', () => {
    const description = 'This official flavor fits only if ellipsis space is not reserved.';
    const sized = item({
      name: 'Green Apple',
      description,
      findAt: { restockShop: 'https://shop' },
      price: { value: CHEAP_PRICE, addedAt: '2026-01-01', inflated: false },
    });

    const meta = buildItemMetaDescription(sized, 'en');
    expect(meta.startsWith(description)).toBe(true);
    expect(meta).not.toContain('...');
    expect(meta.length).toBeLessThanOrEqual(ITEM_META_DESCRIPTION_MAX);
  });

  it('closes an untruncated description that lacks punctuation with a period', () => {
    const noPeriod = item({
      name: 'Blunt Hat',
      description: 'A very shiny red hat indeed',
      price: { value: CHEAP_PRICE, addedAt: '2026-01-01', inflated: false },
    });

    const meta = buildItemMetaDescription(noPeriod, 'en');
    expect(meta).toContain('A very shiny red hat indeed. See ');
    expect(meta).not.toContain('...');
  });

  it('differs from the OG TNT truncation when D adds slots', () => {
    const greenApple = item({
      name: 'Green Apple',
      description: 'This is a tasty green apple from Neopia.',
      findAt: { restockShop: 'https://shop' },
    });

    const meta = buildItemMetaDescription(greenApple, 'en');
    const og = truncateItemOgDescription(greenApple.description);
    expect(og).toBe(greenApple.description);
    expect(meta).not.toBe(og);
  });
});

describe('fitFlavor', () => {
  it('keeps Baby Paint Brush first sentence and bang', () => {
    expect(
      fitFlavor(
        'Turn your Neopet into a cute little baby! This Paint Brush will change the colour of your Neopet.',
        50
      )
    ).toBe('Turn your Neopet into a cute little baby!');
  });

  it('keeps Super Attack Pea first sentence when the second does not fit', () => {
    expect(
      fitFlavor('Why is it super you ask? Because it is a pea that attacks superly!', 40)
    ).toBe('Why is it super you ask?');
  });

  it('keeps abbreviations such as Dr. inside the same sentence', () => {
    expect(
      fitFlavor('The favourite hat of Dr. Sloth himself, taken from his secret lair.', 40)
    ).toBe('The favourite hat of Dr. Sloth himself');
    expect(
      fitFlavor('Dr. Sloth was here and this is his very own special helmet of doom.', 60)
    ).toBe('Dr. Sloth was here and this is his very own special helmet');
  });

  it('does not treat a decimal point as the end of a sentence', () => {
    expect(fitFlavor('This item is worth about 2.5 million NP in the Neopian economy.', 45)).toBe(
      'This item is worth about 2.5 million NP'
    );
  });

  it('cuts the raw text when an unlisted abbreviation would leave a stub', () => {
    expect(
      fitFlavor('A Kau. Farms across Neopia are proud to bring you this fresh milk today.', 45)
    ).toBe('A Kau. Farms across Neopia are proud to bring');
  });

  it('keeps the last word of a complete sentence even when it is a function word', () => {
    expect(fitFlavor('Wear this on your Neopet to play with. It is also very shiny.', 60)).toBe(
      'Wear this on your Neopet to play with.'
    );
  });

  it('returns the full Green Apple flavor when it fits', () => {
    expect(fitFlavor('This is a tasty green apple from Neopia.', 155)).toBe(
      'This is a tasty green apple from Neopia.'
    );
  });

  it('keeps a complete short description even under 20 characters', () => {
    expect(fitFlavor('A hat.', 155)).toBe('A hat.');
  });

  it('drops a truncated fragment when the budget is under 20 characters', () => {
    expect(fitFlavor('Turn your Neopet into a cute little baby!', 19)).toBe('');
  });

  it('splits after a quoted sentence so the first sentence can be kept whole', () => {
    expect(
      fitFlavor('He said "it is shiny." Then he wore it all day long around Neopia.', 40)
    ).toBe('He said "it is shiny."');
  });

  it('does not cut in the middle of a word or append ellipses', () => {
    const flavor = fitFlavor('Wonderful mysterious sparkling object of great power', 28);
    expect(flavor.includes(' ')).toBe(true);
    expect(flavor.endsWith('sparkli')).toBe(false);
    expect(flavor).not.toContain('...');
    expect(flavor.length).toBeLessThanOrEqual(28);
  });
});

describe('truncateItemOgDescription', () => {
  it('leaves short official descriptions unchanged', () => {
    expect(truncateItemOgDescription('This is a tasty green apple from Neopia.')).toBe(
      'This is a tasty green apple from Neopia.'
    );
  });

  it('truncates long official descriptions at 130 characters with ellipses', () => {
    const description = 'x'.repeat(200);
    const og = truncateItemOgDescription(description);
    expect(og).toBe(`${'x'.repeat(ITEM_OG_DESCRIPTION_MAX)}...`);
    expect(og.startsWith(description.slice(0, ITEM_OG_DESCRIPTION_MAX))).toBe(true);
  });
});
