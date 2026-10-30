import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createTranslator } from 'next-intl';
import { beforeAll, describe, expect, test } from 'vitest';
import { isGuaranteedPool, renderDropText } from '@app/_components/Item/Drops/renderDropText';
import { loadTranslation } from '@utils/load-translation';
import type { ItemOpenable, PrizePoolData } from '@types';

type TFunction = Parameters<typeof renderDropText>[0];

const pool = (overrides: Partial<PrizePoolData> = {}): PrizePoolData => ({
  name: 'regular',
  items: [1, 2],
  openings: 108,
  minDrop: 2,
  maxDrop: 2,
  totalDrops: 216,
  isChance: false,
  isLE: false,
  ...overrides,
});

const openable = (
  rates: Record<number, number>,
  overrides: Partial<ItemOpenable> = {}
): ItemOpenable => ({
  openings: 108,
  pools: {},
  notes: null,
  drops: Object.fromEntries(
    Object.entries(rates).map(([id, dropRate]) => [
      id,
      { item_iid: Number(id), dropRate, notes: null, isLE: false, pool: 'normal' },
    ])
  ),
  hasLE: false,
  isGBC: false,
  isChoice: false,
  isGram: false,
  minDrop: 0,
  maxDrop: 0,
  ...overrides,
});

describe('isGuaranteedPool', () => {
  const all = openable({ 1: 100, 2: 100 });

  test('detects pools where every item always drops', () => {
    expect(isGuaranteedPool(pool(), all)).toBe(true);
    expect(isGuaranteedPool(pool(), openable({ 1: 100, 2: 40 }))).toBe(false);
  });

  test('ignores LE, bonus, chance, GBC, gram and tiny samples', () => {
    expect(isGuaranteedPool(pool({ isLE: true }), all)).toBe(false);
    expect(isGuaranteedPool(pool({ name: 'bonus' }), all)).toBe(false);
    expect(isGuaranteedPool(pool({ isChance: true }), all)).toBe(false);
    expect(isGuaranteedPool(pool(), openable({ 1: 100, 2: 100 }, { isGBC: true }))).toBe(false);
    expect(isGuaranteedPool(pool(), openable({ 1: 100, 2: 100 }, { isGram: true }))).toBe(false);
    expect(isGuaranteedPool(pool({ openings: 9 }), all)).toBe(false);
  });

  test('trusts pool names that declare every item, without opening data', () => {
    const noData = openable({ 1: 0, 2: 0 }, { openings: 0 });

    expect(isGuaranteedPool(pool({ name: 'normal', openings: 0 }), noData)).toBe(true);
    expect(isGuaranteedPool(pool({ name: 'normal-2-2', openings: 3 }), noData)).toBe(true);
    expect(isGuaranteedPool(pool({ name: 'normal-1-1', openings: 3 }), noData)).toBe(false);
    expect(isGuaranteedPool(pool({ name: 'normal-2-2-chance', openings: 3 }), noData)).toBe(false);
    expect(
      isGuaranteedPool(pool({ name: 'normal' }), openable({ 1: 0, 2: 0 }, { isGram: true }))
    ).toBe(false);
  });
});

describe('renderDropText message selection', () => {
  // stand-in translator: returns which message was picked and with what values
  const t = {
    rich: (key: string, values: Record<string, unknown>) => ({ key, values }),
  } as unknown as TFunction;

  const render = (p: PrizePoolData | null, o: ItemOpenable, isFirst = true) =>
    renderDropText(t, p, o, isFirst) as unknown as {
      key: string;
      values: Record<string, unknown>;
    };

  test('guaranteed pools use their own message with the item count', () => {
    const result = render(pool(), openable({ 1: 100, 2: 100 }), false);

    expect(result.key).toBe('Drops.guaranteed');
    expect(result.values).toMatchObject({ count: 2, isFirst: 'false' });
  });

  test('pools with random drops keep the single/multiple messages', () => {
    const random = openable({ 1: 50, 2: 50 });

    expect(render(pool({ minDrop: 2, maxDrop: 2 }), random).key).toBe('Drops.single');
    expect(render(pool({ minDrop: 2, maxDrop: 3 }), random).key).toBe('Drops.multiple');
  });

  test('gram LE pools show the offer chance; other gram pools stay a choice', () => {
    const gram = openable({ 1: 0, 2: 0 }, { isGram: true });
    const single = { minDrop: 1, maxDrop: 1, isChance: true };

    const le = render(
      pool({ ...single, name: 'le', isLE: true, offerChance: 21.9, openings: 3 }),
      gram
    );
    expect(le.key).toBe('Drops.chance-single');
    expect(le.values).toMatchObject({ chance: 21.9, isGram: 'true', type: 'le' });

    expect(render(pool({ ...single, name: 'gram-1-1' }), gram).key).toBe('Drops.gram-single');
  });
});

describe('Drops messages', () => {
  const locales = ['en', 'pt'] as const;
  const messages = {} as Record<(typeof locales)[number], Record<string, unknown>>;

  beforeAll(async () => {
    for (const locale of locales) messages[locale] = await loadTranslation(locale, 'item');
  });

  const rich = (locale: (typeof locales)[number], key: string, values: Record<string, unknown>) => {
    const t = createTranslator({ locale, messages: messages[locale] });
    const node = t.rich(
      `Drops.${key}` as never,
      { b: (c: ReactNode) => createElement('b', null, c), ...values } as never
    );
    return renderToStaticMarkup(createElement('p', null, node as never)).replace(/<\/?[^>]+>/g, '');
  };

  const base = { isFirst: 'true', isGram: 'false', chance: 40, type: 'unknown' };
  const scenarios = {
    guaranteed: [{ count: 1 }, { count: 2 }, { count: 5 }],
    single: [{ min: 0 }, { min: 1 }, { min: 2 }],
    multiple: [
      { min: 0, max: 3 },
      { min: 2, max: 3 },
    ],
    'chance-single': [{ min: 1 }, { min: 2 }],
    'chance-multiple': [
      { min: 0, max: 3 },
      { min: 1, max: 3 },
    ],
    'gram-single': [{ min: 1 }, { min: 2 }],
    'gram-multiple': [
      { min: 0, max: 3 },
      { min: 1, max: 3 },
    ],
  };

  test.each(locales)('%s: every message renders for every pool type', (locale) => {
    for (const [key, cases] of Object.entries(scenarios)) {
      for (const values of cases) {
        for (const type of ['unknown', 'le', 'bonus']) {
          const output = rich(locale, key, { ...base, ...values, type });
          expect(output.trim(), `${key} ${JSON.stringify(values)}`).not.toBe('');
          expect(output).not.toMatch(/[{}]|undefined|NaN/);
        }
      }
    }
  });

  test.each(locales)(
    '%s: range messages do not start with a conjunction when min is 0',
    (locale) => {
      for (const key of ['multiple', 'chance-multiple', 'gram-multiple']) {
        const output = rich(locale, key, { ...base, min: 0, max: 3 });
        expect(output, key).not.toMatch(/\b(and|e)\s+(up to|até)(?!\p{L})/iu);
      }
    }
  );
});
