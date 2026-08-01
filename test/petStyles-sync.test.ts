import { describe, expect, test } from 'vitest';
import { diffStyleAvailability, mergePetStyleFields } from '@utils/petStyles/sync';
import { parsePetStyleFromName } from '@utils/petStyles';
import type { PetColorsCatalog } from '@utils/pet-utils';

const COLORS: PetColorsCatalog = {
  '63': 'Royalboy',
  '119': 'Void',
};

describe('mergePetStyleFields', () => {
  test('keeps existing color when parse cannot resolve one', () => {
    const parsed = parsePetStyleFromName('Nostalgic Royalboy Acara', {
      speciesId: 1,
      colors: {},
    });

    const merged = mergePetStyleFields(parsed, { color_id: 63 });
    expect(merged.color_id).toBe(63);
    expect(merged.needsReview).toBe(false);
    expect(merged.series).toBe('Nostalgic');
  });

  test('uses parsed color when available', () => {
    const parsed = parsePetStyleFromName('Ethereal Void Acara', {
      speciesId: 1,
      colors: COLORS,
    });

    const merged = mergePetStyleFields(parsed, { color_id: 1 });
    expect(merged.color_id).toBe(119);
    expect(merged.needsReview).toBe(false);
  });

  test('marks Treasured for review', () => {
    const parsed = parsePetStyleFromName('Treasured Roberta', { speciesId: 1, colors: COLORS });
    const merged = mergePetStyleFields(parsed, null);
    expect(merged.species_id).toBeNull();
    expect(merged.needsReview).toBe(true);
  });
});

describe('diffStyleAvailability', () => {
  test('opens new styles and closes missing ones', () => {
    const { toOpen, toClose } = diffStyleAvailability([1, 2, 3], [2, 4]);
    expect(toOpen.sort()).toEqual([1, 3]);
    expect(toClose).toEqual([4]);
  });

  test('no-ops when snapshot matches active set', () => {
    const { toOpen, toClose } = diffStyleAvailability([1, 2], [1, 2]);
    expect(toOpen).toEqual([]);
    expect(toClose).toEqual([]);
  });
});
