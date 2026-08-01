import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parsePetStyleFromName } from '@utils/petStyles';
import type { PetColorsCatalog } from '@utils/pet-utils';

/** Subset of PetColor ids used by style name parse tests. */
const SAMPLE_COLORS: PetColorsCatalog = {
  '1': 'Alien',
  '19': 'Coconut',
  '26': 'Faerie',
  '39': 'Island',
  '44': 'Maraquan',
  '54': 'Pirate',
  '63': 'Royalboy',
  '64': 'Royalgirl',
  '94': 'Water',
  '97': 'Yellow',
  '115': 'Valentine',
  '119': 'Void',
};

type StyleDumpRow = {
  item_id: number;
  name: string;
  image: string;
  species_id?: number;
};

describe('parsePetStyleFromName', () => {
  test('parses nostalgic royalboy base style', () => {
    const parsed = parsePetStyleFromName('Nostalgic Royalboy Acara', {
      speciesId: 1,
      colors: SAMPLE_COLORS,
    });

    expect(parsed).toMatchObject({
      species_id: 1,
      series: 'Nostalgic',
      color_id: 63,
      colorRest: 'Royalboy',
      isPrismatic: false,
      prismaticVariant: null,
      needsReview: false,
    });
  });

  test('parses prismatic variant and keeps base series/color', () => {
    const parsed = parsePetStyleFromName('Prismatic Dawn: Nostalgic Royalboy Acara', {
      speciesId: 1,
      colors: SAMPLE_COLORS,
    });

    expect(parsed).toMatchObject({
      species_id: 1,
      series: 'Nostalgic',
      color_id: 63,
      isPrismatic: true,
      prismaticVariant: 'Dawn',
      needsReview: false,
    });
  });

  test('parses ethereal void', () => {
    const parsed = parsePetStyleFromName('Ethereal Void Cybunny', {
      speciesId: 9,
      colors: SAMPLE_COLORS,
    });

    expect(parsed).toMatchObject({
      series: 'Ethereal',
      color_id: 119,
      colorRest: 'Void',
      needsReview: false,
    });
  });

  test('strips JubJub species case-insensitively', () => {
    const parsed = parsePetStyleFromName('Prismatic Mirage: Nostalgic Royalboy Jubjub', {
      speciesId: 21,
      colors: SAMPLE_COLORS,
    });

    expect(parsed).toMatchObject({
      series: 'Nostalgic',
      color_id: 63,
      isPrismatic: true,
      prismaticVariant: 'Mirage',
      needsReview: false,
    });
  });

  test('parses multi-word prismatic variants', () => {
    const parsed = parsePetStyleFromName('Prismatic Cookies & Cream: Delightful Chocolate Aisha', {
      speciesId: 2,
      colors: { '51': 'Chocolate' },
    });

    expect(parsed).toMatchObject({
      species_id: 2,
      series: 'Delightful',
      colorRest: 'Chocolate',
      color_id: 51,
      isPrismatic: true,
      prismaticVariant: 'Cookies & Cream',
      needsReview: false,
    });
  });

  test('marks Treasured for review without species/color', () => {
    const parsed = parsePetStyleFromName('Treasured Roberta', {
      speciesId: 1,
      colors: SAMPLE_COLORS,
    });

    expect(parsed).toMatchObject({
      species_id: null,
      series: 'Treasured',
      color_id: null,
      needsReview: true,
      isPrismatic: false,
    });
  });

  test('marks All-Star Essence for review without color', () => {
    const parsed = parsePetStyleFromName('All-Star Essence of Tulah', {
      speciesId: 1,
      colors: SAMPLE_COLORS,
    });

    expect(parsed).toMatchObject({
      species_id: 1,
      series: 'All-Star Essence',
      color_id: null,
      needsReview: true,
    });
  });

  test('needs review when color catalog cannot resolve colorRest', () => {
    const parsed = parsePetStyleFromName('Nostalgic Royalboy Acara', {
      speciesId: 1,
      colors: {},
    });

    expect(parsed.series).toBe('Nostalgic');
    expect(parsed.colorRest).toBe('Royalboy');
    expect(parsed.color_id).toBeNull();
    expect(parsed.needsReview).toBe(true);
  });

  test('parses multi-word series via longest color suffix', () => {
    const parsed = parsePetStyleFromName('Habbo Hotel Yellow Acara', {
      speciesId: 1,
      colors: SAMPLE_COLORS,
    });

    expect(parsed).toMatchObject({
      species_id: 1,
      series: 'Habbo Hotel',
      color_id: 97,
      colorRest: 'Yellow',
      isPrismatic: false,
      needsReview: false,
    });
  });

  test('maps Anniversary alias to 25th Anniversary color', () => {
    const parsed = parsePetStyleFromName('Celebratory Anniversary Acara', {
      speciesId: 1,
      colors: {
        '120': '25th Anniversary',
        '97': 'Yellow',
      },
    });

    expect(parsed).toMatchObject({
      series: 'Celebratory',
      color_id: 120,
      colorRest: '25th Anniversary',
      needsReview: false,
    });
  });

  test('maps prismatic Celebratory Anniversary via alias', () => {
    const parsed = parsePetStyleFromName('Prismatic Light Blue: Celebratory Anniversary Acara', {
      speciesId: 1,
      colors: { '120': '25th Anniversary' },
    });

    expect(parsed).toMatchObject({
      series: 'Celebratory',
      color_id: 120,
      isPrismatic: true,
      prismaticVariant: 'Light Blue',
      needsReview: false,
    });
  });

  test('falls back to first-token series when no colors catalog', () => {
    const parsed = parsePetStyleFromName('Habbo Hotel Yellow Acara', {
      speciesId: 1,
    });

    expect(parsed).toMatchObject({
      series: 'Habbo',
      colorRest: 'Hotel Yellow',
      color_id: null,
      needsReview: true,
    });
  });
});

describe('styles.json smoke', () => {
  const dumpPath = resolve(process.cwd(), 'styles.json');
  let styles: StyleDumpRow[] = [];

  try {
    styles = JSON.parse(readFileSync(dumpPath, 'utf8')) as StyleDumpRow[];
  } catch {
    styles = [];
  }

  test.skipIf(styles.length === 0)('parses Tarnum dump with expected series/color shape', () => {
    let withColor = 0;
    let needsReview = 0;
    let prismatic = 0;

    for (const style of styles) {
      const parsed = parsePetStyleFromName(style.name, {
        speciesId: style.species_id ?? null,
        colors: SAMPLE_COLORS,
      });

      expect(parsed.series.length).toBeGreaterThan(0);
      if (parsed.isPrismatic) {
        prismatic += 1;
        expect(parsed.prismaticVariant).toBeTruthy();
      }
      if (parsed.color_id != null) withColor += 1;
      if (parsed.needsReview) needsReview += 1;
    }

    // Smoke: common color names in the Tarnum dump map cleanly; Treasured/All-Star need review.
    expect(withColor).toBeGreaterThan(800);
    expect(prismatic).toBeGreaterThan(600);
    expect(needsReview).toBeGreaterThan(0);
    expect(needsReview).toBeLessThan(100);

    const sample = parsePetStyleFromName('Coastal Water Acara', {
      speciesId: 1,
      colors: SAMPLE_COLORS,
    });
    expect(sample).toMatchObject({ series: 'Coastal', color_id: 94, needsReview: false });
  });
});
